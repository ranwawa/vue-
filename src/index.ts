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
            onInput: (e) => {
              console.log(e.target.value);
            },
          },
        },
      ],
    },
    document.getElementById("app")
  );
});
