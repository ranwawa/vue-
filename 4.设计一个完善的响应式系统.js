/*
 * @Description:
 * 1. 手动执行副作用函数 -> 根据data的值修改网页
 * @Date: 2022-09-04 14:24:41
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const data = { name: "冉娃娃", age: 18 };

function effect() {
  console.log("执行副作用函数,修改网页上的值");

  document.querySelector("#text").innerHTML = data.name;
}

effect();

// TODO: 值变了,页面上的内容没有变?
setTimeout(() => {
  data.name = "帅气的冉娃娃";
}, 1000);
