/*
 * @Description:
 * 1. 代理拦截data的get属性 -> 将key和副作用函数关联起来
 * 2. 代理拦截data的set属性 -> 给data赋值时,自动执行[对应key]的副作用函数
 * 3. 手动执行副作用函数 -> 执行get拦截器,根据data的值修改网页
 * 4. 修改data的值 -> 执行set拦截器
 * @Date: 2022-09-04 14:38:11
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const data = { name: "冉娃娃", age: 18 };

const bucket = {};

const proxyData = new Proxy(data, {
  get(target, key) {
    bucket[key] = effect;

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

function effect({ key } = {}) {
  console.log("执行副作用函数,修改网页上的值", key);

  document.querySelector("#text").innerHTML = proxyData.name;
}

effect();

setTimeout(() => {
  proxyData.name = "帅气的冉娃娃";
}, 1000);

// TODO 如果网页上要用到age怎么办?
setTimeout(() => {
  proxyData.age = 28;
}, 1000);
