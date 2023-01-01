const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const count = ref(1);

effect(() => {
  render(
    {
      type: "div",
      children: [
        {
          type: "h1",
          children: "h1",
        },
        {
          type: "h2",
          children: "h2",
        },
      ],
    },
    document.getElementById("app")
  );
});
