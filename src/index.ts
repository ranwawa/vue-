const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const count = ref(1);

effect(() => {
  render(
    {
      type: "div",
      children: [
        {
          type: "button",
          props: {
            disabled: true,
          },
          children: "禁用的按钮",
        },
        {
          type: "button",
          props: {
            disabled: "",
          },
          children: "禁用的按钮",
        },
        {
          type: "button",
          props: {
            disabled: false,
          },
          children: "可以点的按钮",
        },
      ],
    },
    document.getElementById("app")
  );
});
