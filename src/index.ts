const { effect, ref } = VueReactivity;
import { render, Fragment } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: Fragment,
    children: [
      { type: "p", children: "1" },
      { type: "p", children: "2" },
      { type: "p", children: "3" },
    ],
    props: {},
  },
  app
);

render(
  {
    type: Fragment,
    children: [
      { type: "p", children: "a" },
      { type: "p", children: "b" },
      { type: "p", children: "c" },
    ],
    props: {},
  },
  app
);
