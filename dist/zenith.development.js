/*! Zenith v1.0.0-beta.1 | MIT License | © 2022-2025 Daniel Barber */
const VNODE_ROOT = 1;
const VNODE_ELEM = 2;
const VNODE_TEXT = 3;
const VNODE_COMP = 4;
const VNODE_NODE = 5;

let scheduled;
const FLAG_STALE = 1;
const FLAG_REMOVED = 2;
const FLAG_REMOVE_CALLED = 4;
const mountedNodes = /* @__PURE__ */ new Map();
const redrawQueue = /* @__PURE__ */ new Set();
const ns = {
  math: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg"
};
const EMPTY_OBJECT = Object.freeze({}) ;
const slice = Array.prototype.slice;
const scheduleRedraw = (vNode) => {
  let root;
  for (root = vNode; root.up; root = root.up) ;
  if (root) {
    for (let current = vNode; current; current = current.up) {
      if (current.is === VNODE_COMP) {
        if (current.f & FLAG_STALE) break;
        current.f |= FLAG_STALE;
      }
    }
    redrawQueue.add(root);
    if (!scheduled) {
      scheduled = true;
      Promise.resolve().then(() => {
        scheduled = false;
        const active = document.activeElement;
        for (const rootNode of redrawQueue) {
          if (mountedNodes.has(rootNode.el)) {
            updateNodes(rootNode, rootNode.el, rootNode.nodes, rootNode.nodes);
          }
        }
        redrawQueue.clear();
        if (active) active.focus();
      });
    }
  }
};
const shallowEqual = (a, b) => {
  if (a !== b) {
    for (const k in a) if (a[k] !== b[k]) return false;
    for (const k in b) if (!(k in a)) return false;
  }
  return true;
};
const flatten = (nodes, arr = []) => {
  for (const node2 of Array.isArray(nodes) ? nodes : [nodes]) {
    if (Array.isArray(node2)) {
      flatten(node2, arr);
    } else if (node2 != null && node2 !== false && node2 !== true) {
      const hasKey = (node2.is === VNODE_ELEM || node2.is === VNODE_COMP) && node2.attrs && "key" in node2.attrs;
      if (arr.$keys === void 0) arr.$keys = hasKey;
      else if (hasKey !== arr.$keys) {
        throw new Error(`Mixed keyed/non-keyed children. Wrap text in elem('span', {key}, "My keyed string.")` );
      }
      arr.push(node2.is ? node2 : { is: VNODE_TEXT, tag: typeof node2 === "string" ? node2 : node2 + "" });
    }
  }
  return arr;
};
const wrapHandler = (vNode, handler) => (e) => {
  if (handler.call(e.currentTarget, e) === false) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (e.redraw !== false) {
    scheduleRedraw(vNode);
  }
};
const updateNode = (parentNode, parentEl, newNode, oldNode, xmlns, skipMemo) => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    newNode.up = oldNode.up;
    if (oldNode.is === VNODE_COMP && oldNode.f & FLAG_REMOVED) {
      oldNode.f &= ~FLAG_REMOVED;
    }
    if (newNodeType === oldNode.is) {
      if (newNodeType === VNODE_ELEM) {
        if (newNode.tag !== oldNode.tag) {
          createNode(parentNode, parentEl, newNode);
          removeNode(oldNode);
        } else {
          newNode.el = oldNode.el;
          newNode.events = oldNode.events;
          setElAttributes(newNode, oldNode);
          updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes, xmlns);
        }
      } else if (newNodeType === VNODE_TEXT) {
        newNode.el = oldNode.el;
        newNode.el.textContent = newNode.tag;
      } else if (newNodeType === VNODE_COMP) {
        if (newNode.tag !== oldNode.tag) {
          createNode(parentNode, parentEl, newNode, xmlns);
          removeNode(oldNode);
        } else {
          newNode.el = oldNode.el;
          newNode.nodes = oldNode.nodes;
          if (!skipMemo && !(oldNode.f & FLAG_STALE) && newNode.tag.memo && (newNode.tag.memo === true ? shallowEqual : newNode.tag.memo)(newNode.attrs, oldNode.attrs)) {
            newNode.f = oldNode.f;
          } else {
            newNode.f = oldNode.f & ~FLAG_STALE;
            redrawComponent(newNode, parentEl, xmlns);
          }
        }
      } else if (newNodeType === VNODE_NODE) {
        if (newNode.el !== oldNode.el) {
          parentEl.insertBefore(newNode.el, null);
          oldNode.el.remove();
        }
      }
    } else {
      createNode(parentNode, parentEl, newNode, xmlns);
      removeNode(oldNode);
    }
  } else {
    createNode(parentNode, parentEl, newNode, xmlns);
  }
};
const updateNodes = (parentNode, parentEl, newNodes, oldNodes, xmlns) => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if (newNodesLength > 0) {
    let oldNode;
    let newNode;
    let needsReconcile;
    let mergedIndex = 0;
    if (oldNodesLength > 0) {
      if (newNodes.$keys && oldNodes.$keys) {
        needsReconcile = newNodesLength !== oldNodesLength;
        for (let i = 0; !needsReconcile && i < newNodesLength; i++) {
          needsReconcile = newNodes[i].attrs.key !== oldNodes[i].attrs.key;
        }
        if (needsReconcile) {
          const oldPositions = /* @__PURE__ */ new Map();
          const mergedNodes = [];
          const movedKeys = /* @__PURE__ */ new Set();
          for (let i = 0; i < oldNodesLength; i++) {
            oldPositions.set(oldNodes[i].attrs.key, i);
          }
          for (newNode of newNodes) {
            const key = newNode.attrs.key;
            const oldPos = oldPositions.get(key);
            if (oldPos !== void 0) {
              oldNode = oldNodes[oldPos];
              oldPositions.delete(key);
              if (oldPos !== mergedIndex) {
                movedKeys.add(key);
              }
              if (newNode.is === VNODE_COMP) {
                if (newNode.attrs.$remove) {
                  if (oldNode.f & FLAG_REMOVED || removeNode(oldNode) === false) {
                    oldNode.up = parentNode;
                    mergedNodes.push(oldNode);
                    mergedIndex++;
                  }
                } else {
                  if (oldNode.f & FLAG_REMOVED) {
                    oldNode.f &= ~FLAG_REMOVED;
                  }
                  if (newNode.tag === oldNode.tag && !(oldNode.f & FLAG_STALE) && newNode.tag.memo && (newNode.tag.memo === true ? shallowEqual : newNode.tag.memo)(newNode.attrs, oldNode.attrs)) {
                    oldNode.attrs = newNode.attrs;
                    mergedNodes.push(oldNode);
                    mergedIndex++;
                  } else {
                    updateNode(parentNode, parentEl, newNode, oldNode, xmlns, true);
                    mergedNodes.push(newNode);
                    mergedIndex++;
                  }
                }
              } else {
                updateNode(parentNode, parentEl, newNode, oldNode, xmlns, true);
                mergedNodes.push(newNode);
                mergedIndex++;
              }
            } else if (!newNode.attrs.$remove) {
              movedKeys.add(key);
              createNode(parentNode, parentEl, newNode, xmlns);
              mergedNodes.push(newNode);
              mergedIndex++;
            }
          }
          for (const pos of oldPositions.values()) {
            removeNode(oldNodes[pos]);
          }
          newNodes = mergedNodes;
          newNodes.$keys = true;
          if (movedKeys.size > 0) {
            let expectedNext2 = null;
            for (let i = newNodes.length - 1; i >= 0; i--) {
              newNode = newNodes[i];
              if (newNode.el) {
                if (movedKeys.has(newNode.attrs.key) && newNode.el.nextSibling !== expectedNext2) {
                  parentEl.insertBefore(newNode.el, expectedNext2);
                }
                expectedNext2 = newNode.el;
              }
            }
          }
        } else {
          for (let i = 0; i < newNodesLength; i++) {
            updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
          }
          for (let i = newNodesLength; i < oldNodesLength; i++) {
            removeNode(oldNodes[i]);
          }
        }
      } else {
        for (let i = newNodesLength; i < oldNodesLength; i++) {
          oldNode = oldNodes[i];
          if (removeNode(oldNode) === false) {
            oldNode.up = parentNode;
            newNodes[i] = oldNode;
          }
        }
        for (let i = 0; i < newNodesLength; i++) {
          oldNode = oldNodes[i];
          newNode = newNodes[i];
          if (oldNode && oldNode.el && (oldNode.is !== VNODE_COMP || !(oldNode.f & FLAG_REMOVED))) {
            updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
          } else {
            createNode(parentNode, parentEl, newNode, xmlns);
          }
        }
      }
    } else {
      for (newNode of newNodes) {
        createNode(parentNode, parentEl, newNode, xmlns);
      }
    }
  } else {
    parentEl.textContent = "";
    for (const oldNode of oldNodes) {
      unmountNode(oldNode, true);
    }
  }
  parentNode.nodes = newNodes;
};
const setElAttributes = (newNode, oldNode) => {
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  const oldAttrs = oldNode ? oldNode.attrs : EMPTY_OBJECT;
  if (newNode.tag === "input" && typeof newAttrs.type === "string") {
    el.setAttribute("type", newAttrs.type);
  }
  for (const attr in newAttrs) {
    if (attr[0] === "o" && attr[1] === "n") {
      if (typeof newAttrs[attr] === "function") {
        newNode.events = true;
        el[attr] = wrapHandler(newNode, newAttrs[attr]);
      } else {
        el[attr] = null;
      }
    } else if (attr === "type" || attr === "key" || attr === "is" || attr === "xmlns") ; else if (!(attr in oldAttrs) || newAttrs[attr] !== oldAttrs[attr]) {
      const value = newAttrs[attr] === true ? attr : newAttrs[attr];
      const valueType = typeof value;
      if (valueType === "string" || valueType === "number") {
        if (attr === "value") {
          const valueStr = value + "";
          if (el.value !== valueStr) el.value = valueStr;
        } else {
          el.setAttribute(attr, value + "");
        }
      } else if (!value) {
        el.removeAttribute(attr);
      } else if (valueType === "object") {
        Object.assign(el[attr], value);
      }
    }
  }
  for (const attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === "o" && attr[1] === "n") {
        el[attr] = null;
      } else {
        el.removeAttribute(attr);
      }
    }
  }
};
const createNode = (parentNode, parentEl, vNode, xmlns) => {
  if (vNode.is === VNODE_ELEM) {
    vNode.up = parentNode;
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.tag] || xmlns;
    vNode.el = xmlns ? document.createElementNS(xmlns, vNode.tag, vNode.attrs.is ? { is: vNode.attrs.is } : null) : document.createElement(vNode.tag, vNode.attrs.is ? { is: vNode.attrs.is } : null);
    setElAttributes(vNode);
    for (const child of vNode.nodes) {
      createNode(vNode, vNode.el, child, xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_TEXT) {
    vNode = vNode;
    vNode.el = document.createTextNode(vNode.tag);
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_COMP) {
    vNode.up = parentNode;
    if (vNode.tag.init) vNode.tag.init(vNode);
    vNode.nodes = flatten(vNode.tag.draw(vNode));
    const drawToEl = typeof vNode.tag.drawTo === "function" ? vNode.tag.drawTo(vNode) : parentEl;
    if (drawToEl !== parentEl) {
      vNode.el = document.createComment();
      parentEl.insertBefore(vNode.el, null);
    }
    for (const child of vNode.nodes) {
      createNode(vNode, drawToEl, child, xmlns);
    }
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if (vNode.tag.drawn) vNode.tag.drawn(vNode, true);
  } else if (vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};
const redrawComponent = (vNode, parentEl, xmlns) => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.tag.draw(vNode, vNode.nodes);
  if (newChildren !== oldChildren) {
    updateNodes(vNode, parentEl, flatten(newChildren), oldChildren, xmlns);
    if (!vNode.el || vNode.el.nodeType !== 8) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    oldChildren.length = 0;
  }
  if (vNode.tag.drawn) vNode.tag.drawn(vNode);
};
const unmountNode = (vNode, detached) => {
  if (vNode.is === VNODE_ELEM) {
    if (!detached && vNode.events) {
      for (const attr in vNode.attrs) {
        if (attr[0] === "o" && attr[1] === "n") vNode.el[attr] = null;
      }
    }
    vNode.attrs = null;
  } else if (vNode.is === VNODE_COMP) {
    if (vNode.tag.remove && !(vNode.f & FLAG_REMOVE_CALLED)) {
      vNode.f |= FLAG_REMOVE_CALLED;
      vNode.tag.remove(vNode);
    }
    if (vNode.tag.removed) vNode.tag.removed(vNode);
    vNode.attrs = null;
  }
  if (vNode.nodes) {
    for (const child of vNode.nodes) {
      unmountNode(child, true);
    }
    vNode.nodes = null;
  }
  vNode.tag = vNode.el = vNode.up = null;
};
const destroyNode = (vNode) => {
  if (vNode.el) vNode.el.remove();
  unmountNode(vNode, true);
};
const removeNode = (vNode) => {
  if (vNode.is === VNODE_COMP) {
    if (typeof vNode.tag.remove === "function") {
      if (vNode.f & FLAG_REMOVED) {
        return false;
      }
      vNode.f |= FLAG_REMOVE_CALLED | FLAG_REMOVED;
      const deferred = vNode.tag.remove(vNode);
      if (deferred && deferred.then) {
        if (!("key" in vNode.attrs)) {
          throw new Error(
            "Component remove() returned a Promise but component has no key attribute.\nDeferred removal requires a key to track the component during exit.\nAdd a key and use $remove flag. Example:\ncomp(MyComponent, { key: item.id, $remove: item.deleted })"
          );
        }
        const destroy = () => {
          if (vNode.f & FLAG_REMOVED) {
            const parent = vNode.up;
            if (!parent) {
              console.warn(
                "Promise resolved but component was already removed.",
                "This usually means the component was removed without using $remove attribute."
              );
              return;
            }
            if (parent) parent.nodes.splice(parent.nodes.indexOf(vNode), 1);
            destroyNode(vNode);
            scheduleRedraw(parent);
          }
        };
        deferred.then(destroy, destroy);
        return false;
      }
    }
  }
  destroyNode(vNode);
  return true;
};
const draw = scheduleRedraw;
const elem = function(tag) {
  const first = arguments[1];
  const hasAttrs = first && typeof first === "object" && !first.tag && !Array.isArray(first);
  return {
    is: VNODE_ELEM,
    tag,
    attrs: hasAttrs ? Object.freeze(first)  : EMPTY_OBJECT,
    nodes: flatten(slice.call(arguments, hasAttrs ? 2 : 1))
    //el: null,
    //parent: null,
    //events: null,
  };
};
const comp = (componentDefinition, attrs) => {
  return {
    is: VNODE_COMP,
    tag: componentDefinition,
    attrs: attrs ? Object.freeze(attrs)  : EMPTY_OBJECT,
    nodes: null,
    //el: null,
    //parent: null,
    f: 0
    // flags
  };
};
const node = (el) => {
  return {
    is: VNODE_NODE,
    tag: el.nodeName.toLowerCase(),
    attrs: EMPTY_OBJECT,
    el
  };
};
const mount = (el, vNodeAnyOrArray) => {
  if (el == null) throw new Error("mount");
  for (let ancestor = el.parentNode; ancestor; ancestor = ancestor.parentNode) {
    if (mountedNodes.get(ancestor)) throw new Error("nested");
  }
  const mountedNode = mountedNodes.get(el) || mountedNodes.set(el, {
    is: VNODE_ROOT,
    tag: el.nodeName.toLowerCase(),
    attrs: EMPTY_OBJECT,
    el,
    nodes: []
  }).get(el);
  const active = document.activeElement;
  sync();
  if (vNodeAnyOrArray == null || vNodeAnyOrArray.length === 0) {
    el.textContent = "";
    unmountNode(mountedNode, true);
    mountedNodes.delete(el);
  } else {
    updateNodes(mountedNode, el, flatten(vNodeAnyOrArray), mountedNode.nodes);
  }
  if (active) active.focus();
  return mountedNode;
};
const sync = () => {
  if (scheduled) {
    scheduled = false;
    const active = document.activeElement;
    for (const rootNode of redrawQueue) {
      if (mountedNodes.has(rootNode.el)) {
        updateNodes(rootNode, rootNode.el, rootNode.nodes, rootNode.nodes);
      }
    }
    redrawQueue.clear();
    if (active) active.focus();
  }
};
const elemType = VNODE_ELEM;
const textType = VNODE_TEXT;
const compType = VNODE_COMP;
const nodeType = VNODE_NODE;

export { comp, compType, draw, elem, elemType, mount, node, nodeType, ns, sync, textType };
