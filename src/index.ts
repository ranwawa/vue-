const { effect, ref } = VueReactivity;
import { render, Text } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: Text,
    children: "文本节点",
    props: {},
  },
  app
);
