const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const count = ref(1);

effect(() => {
  render(
    {
      type: "h1",
      children: "hello",
    },
    document.getElementById("app")
  );
});
