interface Node {
  type: "string";
  props: Record<string, unknown>;
  children: string | Node[];
}

type ShouldSetAsProps = (ele: HTMLElement, key: string) => boolean;
interface Params {
  createElement: (type: string) => HTMLElement;
  setElementText: (ele: HTMLElement, text: string) => void;
  insert: (
    ele: HTMLElement,
    container: HTMLElement,
    anchor?: HTMLElement
  ) => void;
  patchProps: (
    ele: HTMLElement,
    key: string,
    nextValue: unknown,
    shouldSetAsProps: ShouldSetAsProps
  ) => void;
  shouldSetAsProps: ShouldSetAsProps;
}

function createRenderer(params: Params) {
  const {
    createElement,
    setElementText,
    insert,
    shouldSetAsProps,
    patchProps,
  } = params;

  function mountElement(node: Node, container) {
    const { props, type, children } = node;

    const ele = createElement(type);

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        patchProps(ele, key, value, shouldSetAsProps);
      });
    }

    if (typeof node.children === "string") {
      setElementText(ele, node.children);
    } else if (Array.isArray(node.children)) {
      node.children.forEach((childNode) => patch(null, childNode, ele));
    }

    insert(ele, container);
  }

  function patch(oldNode, newNode, container) {
    if (oldNode) {
    } else {
      mountElement(newNode, container);
    }
  }

  function render(node, container) {
    if (node) {
      patch(container._node, node, container);
    } else {
      if (!container._node) {
        container.innerHTML = "";
      }
    }

    container._node = container.node;
  }

  return {
    render,
  };
}

export const { render } = createRenderer({
  createElement(type) {
    return document.createElement(type);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor);
  },
  shouldSetAsProps(el, key) {
    if (key === "form" && el.tagName === "INPUT") return false;

    return key in el;
  },
  patchProps(
    ele: HTMLElement,
    key: string,
    nextValue: unknown,
    shouldSetAsProps
  ) {
    if (shouldSetAsProps(ele, key)) {
      const type = typeof ele[key];

      if (type === "boolean" && nextValue === "") {
        ele[key] = true;
      } else {
        ele[key] = nextValue;
      }
    } else {
      ele.setAttribute(key, nextValue as string);
    }
  },
});
