interface VNode {
  type: string;
  children: string | VNode[];
  props?: Record<string, unknown>;
  el?: HTMLElement & { _node?: VNode };
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
    nextValue: unknown | EventListenerOrEventListenerObject,
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

  function patch(oldNode: VNode, newNode: VNode, container: HTMLElement) {
    if (oldNode) {
      unmount(oldNode);
      oldNode = null;
    }

    mountElement(newNode, container);
  }

  function unmount(oldVNode: VNode) {
    const { el } = oldVNode;

    if (el) {
      el.parentNode?.removeChild(el);
    }
  }

  function render(vNode: VNode, container: HTMLElement & { _node?: VNode }) {
    if (vNode) {
      patch(container._node, vNode, container);
    } else {
      unmount(container._node);
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
    if (/^on/.test(key)) {
      const eventType = key.slice(2).toLowerCase();
      const eventHandler = Array.isArray(nextValue)
        ? (event) => nextValue.forEach((handler) => handler(event))
        : (nextValue as EventListenerOrEventListenerObject);

      ele.addEventListener(eventType, eventHandler);
    } else if (shouldSetAsProps(ele, key)) {
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
