const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

const nums = 10000000;

render(
  {
    type: "div",
    children: "div",
    props: {},
  },
  app
);

render(
  {
    type: "div",
    props: {
      id: 1,
    },
    children: "div2",
  },
  app
);
