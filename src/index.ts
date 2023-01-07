const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: "text",
    children: "文本节点",
    props: {},
  },
  app
);
