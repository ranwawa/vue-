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

const bucket = {};
const effectStack = [];
let isFlushing = false;

// 解决: 使用刷新队列和set去重,让所有副作用函数在下一个微任务循环中执行,避免执行多次同样的副作用函数
const flushJob = (job) => {
  if (isFlushing) return;

  isFlushing = true;
  const promise = Promise.resolve();

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

  activeEffect.deps.push(key);

  // 解决: 同个属性绑定多个副作用,触发时只执行最后一个副作用函数的问题
  if (!bucket[key]) {
    bucket[key] = [];
  }

  bucket[key].push(activeEffect);
};

const trigger = (target, key, newValue) => {
  const currentEffectList = bucket[key];

  if (!currentEffectList?.length) {
    return;
  }

  const waitToRunEffectList = new Set();
  currentEffectList.forEach((currentEffect) => {
    // 解决: 注册副作用函数时,同时读取设置对象值导致的死循环
    if (currentEffect !== effectStack[effectStack.length - 1]) {
      waitToRunEffectList.add(currentEffect);
    }
  });

  waitToRunEffectList.forEach((waitToRunEffect) => {
    const { scheduler } = waitToRunEffect.options;

    if (scheduler) {
      scheduler(() => waitToRunEffect({ key }));
    } else {
      waitToRunEffect({ key });
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
  const wrappedEffectFn = ({ key } = {}) => {
    console.log("执行副作用函数,修改网页上的值", key);
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
      track(obj, "value");
      return value;
    },
  };

  return obj;
};

const age = computed(() => `age: ${proxyData.age}`);
effectFactory(() => console.log(age.value));

proxyData.age = 28;
