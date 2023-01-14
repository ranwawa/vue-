type EventListenerList = (event: Event) => EventListenerOrEventListenerObject[];

type VEI = {
  value: EventListenerOrEventListenerObject | EventListenerList;
  attached: number;
};

type ELExtra = {
  _node?: VNode;
  _vei?: VEI;
};
type ELHtml = HTMLElement & ELExtra;
type ELText = Text & ELExtra;
type ELComment = Comment & ELExtra;

interface VNode {
  type: string | symbol;
  children: string | VNode[];
  props?: Record<string, unknown>;
  el?: ELHtml | ELText | ELComment;
  key?: string;
}

type ShouldSetAsProps = (ele: HTMLElement, key: string) => boolean;

interface Params {
  createElement: (type: string) => HTMLElement;
  unmount: (type: VNode) => void;
  setElementText: (ele: HTMLElement, text: string) => void;
  createText: (text: string) => Text;
  setText: (ele: Text, text: string) => void;
  createComment: (text: string) => Comment;
  insert: (
    ele: VNode["el"],
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

export const Text = Symbol("text");
export const Comment = Symbol("comment");
export const Fragment = Symbol("fragment");

const domOperation = {
  createElement: 0,
  unmount: 0,
  setElementText: 0,
  createText: 0,
  setText: 0,
  createComment: 0,
  insert: 0,
};
const renderQueue = [];

const stat = () => {
  let counts = 0;
  const item = Object.entries(domOperation).filter(([, value]) => value);
  const detail = JSON.stringify(item);

  renderQueue.push(detail);

  item.forEach(([key, value]) => {
    counts += value;
    domOperation[key] = 0;
  });

  console.log(`第${renderQueue.length}次渲染,DOM操作次数:`, counts, detail);
};

function createRenderer(params: Params) {
  const {
    createElement,
    unmount,
    setElementText,
    createText,
    setText,
    insert,
    createComment,
    shouldSetAsProps,
    patchProps,
  } = params;

  function mountElement(vNode: VNode, container) {
    const { props, type } = vNode;

    const ele = createElement(type as string);
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

  function patchChildren(oldNode: VNode, newNode: VNode, container: ELHtml) {
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

    let newChildren = newNode.children;
    let oldChildren = oldNode.children;
    const newChildrenType = getChildrenType(newChildren);
    const oldChildrenType = getChildrenType(oldChildren);

    switch (newChildrenType) {
      case ChildrenType.string:
        if (oldChildrenType === ChildrenType.array) {
          (oldChildren as VNode[]).forEach((child) => {
            unmount(child);
          });
        } else {
          console.log(oldChildren, newChildren);

          oldChildren !== newChildren &&
            setElementText(container, newChildren as string);
        }
        break;
      case ChildrenType.array:
        const isArray = oldChildrenType === ChildrenType.array;
        const oldLen = oldChildren.length;
        const newLen = newChildren.length;
        const minLen = Math.min(oldLen, newLen);

        if (!isArray) {
          setElementText(container, "");
        } else {
          newChildren = newChildren as VNode[];
          oldChildren = oldChildren as VNode[];

          for (let i = 0; i < newLen; i++) {
            const newChild = newChildren[i];

            for (let j = 0; j < oldLen; j++) {
              const oldChild = oldChildren[j];

              if (oldChild.key === newChild.key) {
                patch(oldChild, newChild, container);
                break;
              }
            }
          }
        }

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
    const ele = (newNode.el = oldNode.el) as ELHtml;
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
      case "symbol":
        const newChildren = newNode.children;

        if (newType === Text) {
          if (oldNode) {
            oldNode.children !== newChildren &&
              setText(oldNode.el as ELText, newChildren as string);
          } else {
            const el = createText(newChildren as string);
            newNode.el = el;
            insert(el, container);
          }
        } else if (newType === Comment) {
          if (oldNode) {
            oldNode.children !== newChildren &&
              setText(oldNode.el as ELText, newChildren as string);
          } else {
            const el = createComment(newChildren as string);
            newNode.el = el;
            insert(el, container);
          }
        } else if (newType === Fragment) {
          if (!oldNode) {
            (newChildren as VNode[]).forEach((child) => {
              patch(null, child, container);
            });
          } else {
            patchChildren(oldNode, newNode, container);
          }
        }
        break;
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

  function render(vNode: VNode, container: HTMLElement & { _node?: VNode }) {
    if (vNode) {
      patch(container._node, vNode, container);
    } else {
      unmount(container._node);
    }

    container._node = vNode;

    stat();
  }

  return {
    render,
  };
}

export const { render } = createRenderer({
  createElement(type) {
    domOperation.createElement += 1;
    return document.createElement(type);
  },
  unmount(oldVNode: VNode) {
    const { el } = oldVNode;
    domOperation.unmount += 1;
    if (el) {
      el.parentNode?.removeChild(el);
    }
  },
  setElementText(el, text) {
    domOperation.setElementText += 1;
    el.textContent = text;
  },
  createText(text) {
    domOperation.createText += 1;
    return document.createTextNode(text);
  },
  setText(el, text) {
    domOperation.setText += 1;
    el.nodeValue = text;
  },
  createComment(text) {
    domOperation.createComment += 1;
    return document.createComment(text);
  },
  insert(el, parent, anchor) {
    domOperation.insert += 1;
    parent.insertBefore(el, anchor);
  },
  shouldSetAsProps(el, key) {
    if (key === "form" && el.tagName === "INPUT") return false;

    return key in el;
  },
  patchProps(
    ele: ELHtml,
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
