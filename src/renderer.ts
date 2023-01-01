interface VNode {
  type: "string";
  props: Record<string, unknown>;
  children: string | VNode[];
  el: HTMLElement;
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

  function mountElement(vNode: VNode, container) {
    const { props, type, children } = vNode;

    const ele = createElement(type);
    vNode.el = ele;

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        patchProps(ele, key, value, shouldSetAsProps);
      });
    }

    if (typeof vNode.children === "string") {
      setElementText(ele, vNode.children);
    } else if (Array.isArray(vNode.children)) {
      vNode.children.forEach((childNode) => patch(null, childNode, ele));
    }

    insert(ele, container);
  }

  function patch(oldNode, newNode, container) {
    if (oldNode) {
    } else {
      mountElement(newNode, container);
    }
  }

  function render(vNode, container: HTMLElement & { _node?: VNode }) {
    if (vNode) {
      patch(container._node, vNode, container);
    } else {
      const { _node } = container;

      if (_node) {
        const { el } = _node;
        el.parentNode?.removeChild(el);
      }
    }

    container._node = vNode;
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

      if (key === "class") {
        ele.className = nextValue as string;
      } else if (type === "boolean" && nextValue === "") {
        ele[key] = true;
      } else {
        ele[key] = nextValue;
      }
    } else {
      ele.setAttribute(key, nextValue as string);
    }
  },
});
