const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

const nums = 10000000;

const div = document.createElement("div");
div.textContent = "div";
app.appendChild(div);

console.time("先卸载再挂载");
for (let index = 0; index < nums; index++) {
  app.removeChild(div);
  app.appendChild(div);
}
console.timeEnd("先卸载再挂载");

console.time("只赋值文本节点");
for (let index = 0; index < nums; index++) {
  app.textContent = "h1-1";
}
console.timeEnd("只赋值文本节点");
