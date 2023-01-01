interface Node {
  type: "string";
  props: Record<string, unknown>;
  children: string | Node[];
}

function createRenderer(params) {
  const { createElement, setElementText, insert } = params;

  function mountElement(node: Node, container) {
    const { props, type, children } = node;

    const ele = createElement(type);

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        ele.setAttribute(key, value);
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
});
