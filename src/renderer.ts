function createRenderer(params) {
  const { createElement, setElementText, insert } = params;

  function mountElement(node, container) {
    const ele = createElement(node.type);

    if (typeof node.children === "string") {
      setElementText(ele, node.children);
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
