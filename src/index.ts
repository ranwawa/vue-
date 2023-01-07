const { effect, ref } = VueReactivity;
import { render, Text } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: "comment",
    children: "这是一个注释",
    props: {},
  },
  app
);
