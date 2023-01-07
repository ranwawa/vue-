const { effect, ref } = VueReactivity;
import { render } from "./renderer.js";

const app = document.querySelector<HTMLElement>("#app");

const bool = ref(false);

effect(() =>
  render(
    {
      type: "h1",
      props: bool.value && {
        onClick: [() => console.log(1), () => console.log(2)],
      },
      children: [
        {
          type: "div",
          props: {
            onClick: () => {
              console.log("将bool修改为true");
              bool.value = true;
            },
          },
          children: "点我",
        },
      ],
    },
    app
  )
);
