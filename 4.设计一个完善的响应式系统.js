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

const proxyData = new Proxy(data, {
  get(target, key) {
    const activeEffect = effectStack[effectStack.length - 1];
    activeEffect.deps.push(key);

    // 解决: 同个属性绑定多个副作用,触发时只执行最后一个副作用函数的问题
    let effectList = bucket[key] || [];

    if (effectList.length === 0) {
      bucket[key] = effectList;
    }

    effectList.push(activeEffect);

    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;

    const currentEffectList = bucket[key];

    if (!currentEffectList.length === 0) {
      return true;
    }

    currentEffectList.forEach((currentEffect) => {
      // 解决: 注册副作用函数时,同时读取设置对象值导致的死循环
      if (currentEffect !== effectStack[effectStack.length - 1]) {
        currentEffect({ key });
      }
    });
  },
});

function effectFactory(effectFn) {
  const wrappedEffectFn = ({ key } = {}) => {
    console.log("执行副作用函数,修改网页上的值", key);

    wrappedEffectFn.deps.map((dep) => {
      delete bucket[dep];
    });

    wrappedEffectFn.deps = [];

    effectStack.push(wrappedEffectFn);
    effectFn();
    effectStack.pop();
  };

  wrappedEffectFn.deps = [];

  wrappedEffectFn();
}

effectFactory(() => {
  document.querySelector("#age").innerHTML = proxyData.age;
});

effectFactory(() => {
  document.querySelector("#text").innerHTML =
    proxyData.age > 17 ? "成年" : "未成年";
});

proxyData.age = 17;
