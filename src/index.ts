const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

render(
  {
    type: "div",
    children: "first",
  },
  document.getElementById("app")
);

render(
  {
    type: "div",
    children: "second",
  },
  document.getElementById("app")
);
