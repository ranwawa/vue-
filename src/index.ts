const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector("#app");
const times = 1000000;

console.time("setAttribute");

for (let index = 0; index < times; index++) {
  app.setAttribute("class", "setAttribute");
}

console.timeEnd("setAttribute");

console.time("className");

for (let index = 0; index < times; index++) {
  app.className = "className";
}

console.timeEnd("className");

console.time("classList");

for (let index = 0; index < times; index++) {
  app.classList = "className";
}

console.timeEnd("classList");
