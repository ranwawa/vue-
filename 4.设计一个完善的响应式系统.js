/*
 * @Description:
 * 1. 代理拦截data的get属性 -> 将key和副作用函数关联起来
 * 2. 代理拦截data的set属性 -> 当用户给data重新赋值时(过滤掉副作用函数里的赋值操作),自动执行[对应key]的副作用函数
 * 3. 创建工厂函数 -> 利用副作用函数栈自定义每个key的副作用函数,执行副作用函数前,先断开它与其他key的关联,执行副作用函数后,弹出顶端的副作用函数
 * 4. 手动执行副作用函数 -> 执行get拦截器,根据data的值修改网页
 * 5. 修改data的值 -> 执行set拦截器
 * @Date: 2022-09-04 14:38:11
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const ITER_KEY = Symbol("forin");
const bucket = new Map();
const effectStack = [];
let isFlushing = false;
const promise = Promise.resolve();
const typeMap = {
  SET: "SET",
  ADD: "ADD",
  DEL: "DEL",
};

// 解决: 使用刷新队列和set去重,让所有副作用函数在下一个微任务循环中执行,避免执行多次同样的副作用函数
const flushJob = (job) => {
  if (isFlushing) return;

  isFlushing = true;

  return promise
    .then(() => {
      job();
    })
    .finally(() => {
      isFlushing = false;
    });
};

const track = (target, key) => {
  const activeEffect = effectStack[effectStack.length - 1];

  if (!activeEffect) return;

  let dependenciesMap = bucket.get(target);

  // 解决: 每个对象作为惟一的键,防止多个对象有相同属性时,重复收集依赖冲突的问题
  if (!dependenciesMap) {
    dependenciesMap = new Map();
    bucket.set(target, dependenciesMap);
  }

  let dependencies = dependenciesMap.get(key);

  if (!dependencies) {
    dependencies = new Set();
    dependenciesMap.set(key, dependencies);
  }

  // 解决: 同个属性绑定多个副作用,触发时只执行最后一个副作用函数的问题
  dependencies.add(activeEffect);

  activeEffect.target = target;
  activeEffect.key = key;
  activeEffect.deps.push(dependencies);
};

const trigger = (target, key, type) => {
  const currentDependenciesMap = bucket.get(target);

  if (!currentDependenciesMap) {
    return;
  }

  const currentDependencies = currentDependenciesMap.get(key);

  const waitToRunEffectList = new Set();

  currentDependencies &&
    currentDependencies.forEach((currentEffect) => {
      // 解决: 注册副作用函数时,同时读取设置对象值导致的死循环
      if (currentEffect !== effectStack[effectStack.length - 1]) {
        waitToRunEffectList.add(currentEffect);
      }
    });

  // 解决: 如果是新增/删除属性,则要触发for in相关副作用函数
  if (type === typeMap.ADD || type === typeMap.DEL) {
    const iteratorEffectList = currentDependenciesMap.get(ITER_KEY);

    iteratorEffectList &&
      iteratorEffectList.forEach((interatorEffect) => {
        waitToRunEffectList.add(interatorEffect);
      });
  }

  waitToRunEffectList.forEach((waitToRunEffect) => {
    const { scheduler } = waitToRunEffect.options;

    if (scheduler) {
      scheduler(waitToRunEffect);
    } else {
      waitToRunEffect();
    }
  });
};

const createReactive = (originData, isShallow) => {
  return new Proxy(originData, {
    get(target, key, receiver) {
      if (key === "__raw") {
        return target;
      }

      track(target, key);

      const value = Reflect.get(target, key, receiver);
      // 解决: 深响应
      const isObjectValue = typeof value === "object" && value !== null;
      // 解决: 浅响应
      const shouldDeepReactive = isObjectValue && !isShallow;

      return shouldDeepReactive ? reactive(value) : value;
    },
    set(target, key, newValue, receiver) {
      const type = target.hasOwnProperty(key) ? typeMap.SET : typeMap.ADD;
      const oldValue = target[key];

      Reflect.set(target, key, newValue, receiver);

      // 解决: 屏蔽原型链代理对象属性设置触发重复的副作用执行
      const isCurrentObj = receiver.__raw === target;
      // 解决: 只有当值发生变化时才触发副作用函数
      const isChangedValue =
        oldValue !== newValue &&
        !(Number.isNaN(oldValue) && Number.isNaN(newValue));

      if (isCurrentObj && isChangedValue) {
        trigger(target, key, type);
      }
    },
    has(target, key) {
      // 解决: 拦截in操作
      track(target, key);

      return Reflect.has(target, key);
    },
    deleteProperty(target, key) {
      const isOwn = target.hasOwnProperty(key);
      const isDeleted = Reflect.deleteProperty(target, key);

      // 解决: 拦截delete操作
      if (isOwn && isDeleted) {
        console.log("deleteProperty: 拦截删除属性操作");
        trigger(target, key, typeMap.DEL);
      }
    },
    ownKeys(target) {
      // 解决: 使用惟一key拦截for in 操作
      track(target, ITER_KEY);

      console.log("ownKeys: 攔截for in操作");

      return Reflect.ownKeys(target);
    },
  });
};

const reactive = (originData) => {
  return createReactive(originData, false);
};

const shallowReactive = (originData) => {
  return createReactive(originData, true);
};

function effectFactory(effectFn, options = {}) {
  const wrappedEffectFn = () => {
    console.log("执行副作用函数,修改网页上的值", wrappedEffectFn.key);

    wrappedEffectFn.deps.map((dep) => {
      delete bucket[dep];
    });

    wrappedEffectFn.deps = [];

    effectStack.push(wrappedEffectFn);

    const res = effectFn();

    effectStack.pop();

    return res;
  };

  wrappedEffectFn.deps = [];
  wrappedEffectFn.effectFn = effectFn;
  wrappedEffectFn.options = options;

  // 解决: 懒执行,在需要的时候才执行并获取执行结果从而实现计算属性
  return options?.lazy ? wrappedEffectFn : wrappedEffectFn();
}

const computed = (getter) => {
  let value = null;
  let dirty = true;
  const effectFn = effectFactory(getter, {
    // 解决: 使用调度器,当副作用函数执行前先重设dirty,保证计算属性可以拿到最新值
    scheduler() {
      if (!dirty) {
        dirty = true;
        trigger(obj, "value");
      }
    },
    lazy: true,
  });

  const obj = {
    get value() {
      // 解决: 脏数据,多次获取计算属性值导致副作用函数重复执行的问题
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      // 解决: 嵌套的计算属性,当原始值发生变化后不会执行计算属性
      track(obj, "value");
      return value;
    },
  };

  return obj;
};

const traverse = (target, seen = new Set()) => {
  if (typeof target === "object" && target !== null && !seen.has(target)) {
    Object.keys(target).forEach((key) => {
      traverse(target[key], seen);
    });
  }

  seen.add(target);
};

const watch = (obj, cb, options = {}) => {
  const { immediate } = options;
  let wrappedEffect;
  let newValue;
  let oldValue;
  let cleanup;
  const onInvalided = (cb) => {
    cleanup = cb;
  };

  // 解决: 可同时监听对象和getter函数
  let fn = typeof obj === "function" ? obj : () => traverse(obj);

  let job = () => {
    // 解决: 使用过期函数,在后续执行副作用函数时,改变之前副作用中的值,从而避免竞态问题
    if (cleanup) {
      cleanup();
    }

    // 解决: 使用懒执行获取新旧值
    newValue = wrappedEffect();
    cb(newValue, oldValue, onInvalided);
    oldValue = newValue;
  };

  wrappedEffect = effectFactory(fn, {
    scheduler: () => {
      job();
    },
    lazy: true,
  });

  if (immediate) {
    job();
  } else {
    wrappedEffect();
  }
};

const obj = shallowReactive({ person: { name: "rww" } });

effectFactory(() => {
  console.log("name: ", obj.person.name);
});

obj.person.name = "rww2";
