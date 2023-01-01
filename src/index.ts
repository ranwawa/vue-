const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const count = ref(1);

effect(() => {
  render(
    {
      type: "div",
      children: [
        {
          type: "input",
          props: {
            form: "form1",
          },
        },
      ],
    },
    document.getElementById("app")
  );
});

setTimeout(() => {
  render(null, document.getElementById("app"));
}, 3000);
