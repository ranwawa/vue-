const { effect, ref } = VueReactivity;
import { render, Fragment } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: Fragment,
    children: [
      { type: "h1", children: "h1", props: {} },
      { type: "h2", children: "h2", props: {} },
      { type: "h2", children: "h2", props: {} },
    ],
    props: {},
  },
  app
);
