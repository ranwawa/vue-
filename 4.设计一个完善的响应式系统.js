/*
 * @Description:
 * 1. 代理拦截data的get属性 -> 将key和副作用函数关联起来
 * 2. 代理拦截data的set属性 -> 给data赋值时,自动执行[对应key]的副作用函数
 * 3. 创建工厂函数 -> 利用全局变量自定义每个key的副作用函数,执行副作用函数前,先断开它与其他key的关联
 * 4. 手动执行副作用函数 -> 执行get拦截器,根据data的值修改网页
 * 5. 修改data的值 -> 执行set拦截器
 * @Date: 2022-09-04 14:38:11
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const data = { name: "冉娃娃", age: 18, showAge: true };

let activeEffect = undefined;
const bucket = {};

const proxyData = new Proxy(data, {
  get(target, key) {
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
    activeEffect = wrappedEffectFn;

    effectFn();
  };

  wrappedEffectFn.deps = [];

  wrappedEffectFn();
}

effectFactory(() => {
  document.querySelector("#text").innerHTML = proxyData.name;
});

effectFactory(() => {
  document.querySelector("#age").innerHTML = proxyData.showAge
    ? proxyData.age
    : "不显示年龄";
});

setTimeout(() => {
  proxyData.name = "帅气的冉娃娃";
  proxyData.showAge = false;
}, 1000);

setTimeout(() => {
  // TODO showAge是false,不应该执行副作用函数
  proxyData.age = 28;
}, 2000);
