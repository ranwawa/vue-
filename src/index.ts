const { effect, ref } = VueReactivity;
import { render, Fragment } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: Fragment,
    children: [
      { type: "p", children: "1", key: "p-1" },
      { type: "p", children: "2", key: "p-2" },
      { type: "p", children: "3", key: "p-3" },
    ],
    props: {},
  },
  app
);

render(
  {
    type: Fragment,
    children: [
      { type: "p", children: "3", key: "p-3" },
      { type: "p", children: "1", key: "p-1" },
      { type: "p", children: "key", key: "p-2" },
    ],
    props: {},
  },
  app
);
