type EventListenerList = (event: Event) => EventListenerOrEventListenerObject[];

type VEI = {
  value: EventListenerOrEventListenerObject | EventListenerList;
  attached: number;
};

interface VNode {
  type: string;
  children: string | VNode[];
  props: Record<string, unknown>;
  el?: HTMLElement & {
    _node?: VNode;
    _vei?: VEI;
  };
}

type EL = VNode["el"];

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

  function patchChildren(oldNode: VNode, newNode: VNode, container: EL) {
    enum ChildrenType {
      "string" = "string",
      "array" = "array",
      "null" = "null",
      "unknown" = "unknown",
    }

    const getChildrenType = (children: VNode["children"]) => {
      if (typeof newChildren === "string") {
        return ChildrenType.string;
      }

      if (Array.isArray(children)) {
        return ChildrenType.array;
      }

      if (children === null) {
        return ChildrenType.null;
      }

      return ChildrenType.unknown;
    };

    const newChildren = newNode.children;
    const oldChildren = oldNode.children;
    const newChildrenType = getChildrenType(newChildren);
    const oldChildrenType = getChildrenType(oldChildren);

    switch (newChildrenType) {
      case ChildrenType.string:
        if (oldChildrenType === ChildrenType.array) {
          (oldChildren as VNode[]).forEach((child) => {
            unmount(child);
          });
        } else {
          setElementText(container, newChildren as string);
        }
        break;
      case ChildrenType.array:
        if (oldChildrenType === ChildrenType.array) {
          (oldChildren as VNode[]).forEach((child) => {
            unmount(child);
          });
        }

        (newChildren as VNode[]).forEach((child) => {
          mountElement(child, container);
        });
        break;
      case ChildrenType.null:
        if (oldChildrenType === ChildrenType.array) {
          (oldChildren as VNode[]).forEach((child) => {
            unmount(child);
          });
        } else {
          setElementText(container, "");
        }
        break;
      default:
        console.log("不知道的虚拟节点类型");
        break;
    }
  }

  function patchElement(oldNode: VNode, newNode: VNode) {
    const ele = (newNode.el = oldNode.el);
    const oldProps = oldNode.props;
    const newProps = newNode.props;

    // 更新props
    for (const key in newProps) {
      const newValue = newProps[key];
      const oldValue = oldProps[key];

      newValue !== oldValue && patchProps(ele, key, newValue, shouldSetAsProps);
    }

    for (const key in oldProps) {
      const newValue = newProps[key];
      const oldValue = oldProps[key];

      newValue !== oldValue && patchProps(ele, key, null, shouldSetAsProps);
    }

    // 更新子节点
    patchChildren(oldNode, newNode, ele);
  }

  function patch(oldNode: VNode, newNode: VNode, container: HTMLElement) {
    const newType = newNode.type;

    if (oldNode && oldNode.type !== newType) {
      unmount(oldNode);
      oldNode = null;
    }

    switch (typeof newType) {
      // html标签
      case "string":
        oldNode
          ? patchElement(oldNode, newNode)
          : mountElement(newNode, container);
        break;
      // 组件
      case "object":
        break;
      // 其他类型,比如Fragment
      default:
        break;
    }
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
    ele: EL,
    key: string,
    nextValue: unknown | EventListenerOrEventListenerObject,
    shouldSetAsProps
  ) {
    if (/^on/.test(key)) {
      const eventType = key.slice(2).toLowerCase();

      function invokeEventHandler(
        handler: EventListenerOrEventListenerObject,
        event: Event
      ) {
        "handleEvent" in handler ? handler.handleEvent(event) : handler(event);
      }

      if (!ele._vei) {
        ele._vei = ele._vei = {
          value: () => {},
          attached: -1,
        };
      }

      ele._vei = {
        value: (event: Event) => {
          if (ele._vei.attached > event.timeStamp) {
            return;
          }

          if (Array.isArray(nextValue)) {
            nextValue.forEach((handler) => invokeEventHandler(handler, event));
          } else {
            invokeEventHandler(nextValue, event);
          }
        },
        attached: performance.now(),
      };

      ele.addEventListener(eventType, ele._vei.value);
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
