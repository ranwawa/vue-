const { effect, ref } = VueReactivity;
import { render, Comment } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: Comment,
    children: "这是一个注释",
    props: {},
  },
  app
);
