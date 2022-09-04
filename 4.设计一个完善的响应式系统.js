/*
 * @Description:
 * 1. 代理拦截data的set属性 -> 给data赋值时,自动执行副作用函数
 * 2. 手动执行副作用函数 -> 根据data的值修改网页
 * 3. 修改data的值 -> 执行set拦截器
 * @Date: 2022-09-04 14:26:30
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const data = { name: "冉娃娃", age: 18 };

const proxyData = new Proxy(data, {
  set(target, key, newValue) {
    target[key] = newValue;

    effect({ key });

    return true;
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

// TODO age在网页上没有用到,也触发了副作用函数
setTimeout(() => {
  proxyData.age = 28;
}, 1000);
