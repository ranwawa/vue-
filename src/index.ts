const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

render(
  {
    type: "h1",
    children: "h1",
    props: {
      onClick: [() => console.log(1), () => console.log(2)],
    },
  },
  app
);
