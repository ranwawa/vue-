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

const data = { name: "冉娃娃", age: 18, showAge: true };

const bucket = new Map();
const effectStack = [];
let isFlushing = false;
const promise = Promise.resolve();

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

const trigger = (target, key) => {
  const currentDependenciesMap = bucket.get(target);

  if (!currentDependenciesMap) {
    return;
  }

  const currentDependencies = currentDependenciesMap.get(key);

  if (!currentDependencies) {
    return;
  }

  const waitToRunEffectList = new Set();

  currentDependencies.forEach((currentEffect) => {
    // 解决: 注册副作用函数时,同时读取设置对象值导致的死循环
    if (currentEffect !== effectStack[effectStack.length - 1]) {
      waitToRunEffectList.add(currentEffect);
    }
  });

  waitToRunEffectList.forEach((waitToRunEffect) => {
    const { scheduler } = waitToRunEffect.options;

    if (scheduler) {
      scheduler(waitToRunEffect);
    } else {
      waitToRunEffect();
    }
  });
};

const proxyData = new Proxy(data, {
  get(target, key) {
    track(target, key);

    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;

    trigger(target, key, newValue);
  },
});

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

let times = 1;

// 1秒后返回20, 2秒后返回10
const fakeApi = () => {
  const isFirst = times === 1;
  times += 1;

  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(isFirst ? "第一次请求,3秒后返回" : "第二次请求,1秒后返回");
      },
      isFirst ? 3000 : 1000
    );
  });
};

watch(
  () => proxyData.age,
  async (newValue, oldValue, onInvalided) => {
    let expired = false;

    onInvalided(() => {
      expired = true;
    });

    const res = await fakeApi();

    if (!expired) {
      document.querySelector("#text").innerHTML = res + newValue;
    }
  }
);

proxyData.age = 33;
proxyData.age = 34;
