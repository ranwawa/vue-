/*
 * @Description:
 * 1. 代理拦截data的get属性 -> 将key和副作用函数关联起来
 * 2. 代理拦截data的set属性 -> 给data赋值时,自动执行[对应key]的副作用函数
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
    bucket[key] = activeEffect;
    activeEffect.deps.push(key);

    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;

    if (!bucket[key]) {
      return true;
    }

    bucket[key]({ key });
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
  // TODO 同时读取和设置data-导致死循环
  document.querySelector("#age").innerHTML = ++proxyData.age;
});
