/*! Zenith 1.0.0-beta.17 | MIT License | ©2022-2025 Daniel Barber */
const VNODE_ELEM = 1;
const VNODE_TEXT = 2;
const VNODE_COMP = 3;
const VNODE_NODE = 4;
const VNODE_COMPDEF = 5;

const boundNodes = /* @__PURE__ */ new Map();
const redrawQueue = /* @__PURE__ */ new Set();
const ns = {
  math: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg"
};
const FLAG_IS_STALE = 1;
const FLAG_IS_REMOVING = 2;
const FLAG_REMOVE_CALLED = 4;
const DIFF_NONE = 1;
const DIFF_SELF = 2;
const DIFF_NODES = 4;
const DIFF_ALL = DIFF_SELF | DIFF_NODES;
const diff = {
  none: DIFF_NONE,
  self: DIFF_SELF,
  nodes: DIFF_NODES,
  all: DIFF_ALL
};
const ALWAYS_EMPTY_ARRAY = Object.freeze([]) ;
const ALWAYS_EMPTY_OBJECT = Object.freeze({}) ;
const sync = () => {
  let remaining = redrawQueue.size;
  let targetEl;
  if (remaining) {
    const active = document.activeElement;
    for (const redrawNode of redrawQueue) {
      targetEl = boundNodes.has(redrawNode.el) ? redrawNode.el : redrawNode.attrs && redrawNode.attrs.to || redrawNode.el && redrawNode.el.parentNode || redrawNode.$p && redrawNode.$p.el;
      redrawQueue.delete(redrawNode);
      if (targetEl) {
        _redrawComponent(redrawNode, targetEl);
      }
      if (!--remaining) break;
    }
    if (redrawQueue.size) Promise.resolve().then(sync);
    if (active && document.activeElement === document.body) {
      active.focus();
    }
  }
};
const draw = (vNode, surgical) => {
  if (surgical) {
    if (vNode.is === VNODE_COMP) {
      vNode.$t |= FLAG_IS_STALE;
    }
    redrawQueue.add(vNode);
  } else {
    let current;
    for (current = vNode; current.$p; current = current.$p) ;
    redrawQueue.add(current);
    for (current = vNode; current.$p; current = current.$p) {
      if (current.is === VNODE_COMP) {
        if (current.$t & FLAG_IS_STALE) break;
        current.$t |= FLAG_IS_STALE;
      }
    }
  }
  if (redrawQueue.size === 1) {
    Promise.resolve().then(sync);
  }
};
const _flattenReusableArray = [];
const _flatten = (nodes, offset = 0, arr = []) => {
  let node2;
  if (!nodes || nodes.length == null) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (offset; offset < nodes.length; offset++) {
    node2 = nodes[offset];
    if (Array.isArray(node2)) {
      _flatten(node2, 0, arr);
    } else if (node2 != null && node2 !== true && node2 !== false) {
      if (!node2.is) {
        node2 = {
          is: VNODE_TEXT,
          $t: node2 + "",
          $d: null,
          attrs: null,
          nodes: null,
          $p: null,
          el: null
        };
      }
      arr.push(node2);
      if (arr.$keys == null) {
        arr.$keys = !!(node2.attrs && "$key" in node2.attrs);
      } else if (arr.$keys !== !!(node2.attrs && "$key" in node2.attrs)) {
        throw new Error("Children have mixed keys..." );
      }
    }
  }
  return arr;
};
const _lastRoot = (vNode) => {
  if (vNode.is === VNODE_COMP && !vNode.attrs.to) {
    for (let i = vNode.nodes.length - 1; i >= 0; i--) {
      const root = _lastRoot(vNode.nodes[i]);
      if (root) return root;
    }
    return null;
  }
  return vNode.el;
};
const _place = (vNode, parentEl, next) => {
  if (vNode.is === VNODE_COMP && !vNode.attrs.to) {
    for (let i = vNode.nodes.length - 1; i >= 0; i--) {
      next = _place(vNode.nodes[i], parentEl, next);
    }
  } else if (vNode.el) {
    if (vNode.el.parentNode !== parentEl || vNode.el.nextSibling !== next) {
      parentEl.insertBefore(vNode.el, next);
    }
    next = vNode.el;
  }
  return next;
};
const _updateNode = (parentNode, parentEl, newNode, oldNode, xmlns) => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    if (newNodeType === oldNode.is) {
      if (newNodeType === VNODE_ELEM) {
        newNode.$p = parentNode;
        if (newNode.$t === oldNode.$t) {
          newNode.el = oldNode.el;
          newNode.$h = oldNode.$h;
          const diff2 = newNode.attrs.$diff || DIFF_ALL;
          if (diff2 & DIFF_SELF) {
            _setElAttributes(newNode, oldNode.attrs);
          }
          if (diff2 & DIFF_NODES) {
            _updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes, newNode.attrs.xmlns || ns[newNode.$t] || xmlns);
          } else {
            newNode.nodes = oldNode.nodes;
          }
        } else {
          _create(parentNode, parentEl, newNode, xmlns);
          parentEl.insertBefore(newNode.el, oldNode.el);
          _remove(oldNode);
        }
      } else if (newNodeType === VNODE_TEXT) {
        newNode.el = oldNode.el;
        if (newNode.$t !== oldNode.$t) newNode.el.textContent = newNode.$t;
      } else if (newNodeType === VNODE_COMP) {
        if (oldNode.$t & FLAG_IS_REMOVING) {
          oldNode.$t &= ~FLAG_IS_REMOVING;
        }
        newNode.$p = parentNode;
        if (newNode.$d === oldNode.$d) {
          newNode.el = oldNode.el;
          newNode.$h = oldNode.$h;
          newNode.nodes = oldNode.nodes;
          if (newNode.attrs.to !== oldNode.attrs.to) {
            const target = newNode.attrs.to;
            if (target && !(target instanceof Element)) {
              throw new Error('For components that act as portals, "to" attribute must be an Element');
            }
            if (target && !oldNode.attrs.to) {
              newNode.el = document.createComment("");
              parentEl.insertBefore(newNode.el, oldNode.el);
            }
            let next = target ? null : oldNode.el;
            for (let i = newNode.nodes.length - 1; i >= 0; i--) {
              next = _place(newNode.nodes[i], target || parentEl, next);
            }
            if (oldNode.attrs.to && !target) {
              newNode.el = newNode.nodes[0] && newNode.nodes[0].el;
              oldNode.el.remove();
            }
          }
          if (oldNode.$t & FLAG_IS_STALE || !(newNode.$d.$memo && (newNode.$d.$memo === true ? newNode.attrs === oldNode.attrs : newNode.$d.$memo(newNode.attrs, oldNode.attrs)))) {
            newNode.$t &= ~FLAG_IS_STALE;
            _redrawComponent(newNode, parentEl, xmlns);
          }
        } else {
          _create(parentNode, parentEl, newNode, xmlns);
          _remove(oldNode);
        }
      } else if (newNodeType === VNODE_NODE) {
        if (newNode.el !== oldNode.el) {
          parentEl.insertBefore(newNode.el, oldNode.el);
          oldNode.el.remove();
        }
      }
    } else {
      _create(parentNode, parentEl, newNode, xmlns);
      _remove(oldNode);
    }
  } else {
    _create(parentNode, parentEl, newNode, xmlns);
  }
};
const _updateNodes = (parentNode, parentEl, newNodes, oldNodes, xmlns) => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if (newNodesLength) {
    let oldNode;
    let newNode;
    let i = 0;
    if (oldNodesLength) {
      if (newNodes.$keys && oldNodes.$keys) {
        while (i < newNodesLength && i < oldNodesLength && newNodes[i].attrs.$key === oldNodes[i].attrs.$key && !(newNodes[i].is === VNODE_COMP && newNodes[i].attrs.$remove)) {
          _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
          i++;
        }
        if (i < newNodesLength || i < oldNodesLength) {
          const oldByKey = /* @__PURE__ */ new Map();
          for (let k = i; k < oldNodesLength; k++) {
            oldByKey.set(oldNodes[k].attrs.$key, k);
          }
          const last = _lastRoot(oldNodes[oldNodesLength - 1]);
          let next = last ? last.nextSibling : null;
          for (let k = newNodesLength - 1; k >= i; k--) {
            newNode = newNodes[k];
            const oldPos = oldByKey.get(newNode.attrs.$key);
            if (oldPos === void 0) {
              if (!newNode.attrs.$remove) {
                _create(parentNode, parentEl, newNode, xmlns);
              } else {
                newNodes.splice(k, 1);
                continue;
              }
            } else {
              oldNode = oldNodes[oldPos];
              oldByKey.delete(newNode.attrs.$key);
              if (newNode.is === VNODE_COMP && newNode.attrs.$remove) {
                if (oldNode.$t & FLAG_IS_REMOVING || !_remove(oldNode)) {
                  oldNode.$p = parentNode;
                  newNodes[k] = oldNode;
                } else {
                  newNodes.splice(k, 1);
                  continue;
                }
              } else {
                _updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
              }
            }
            next = oldPos === void 0 || oldPos !== k || newNodes[k].el !== oldNode.el ? _place(newNodes[k], parentEl, next) : newNodes[k].el || next;
          }
          for (const oldPos of oldByKey.values()) _remove(oldNodes[oldPos]);
        }
      } else {
        for (let i2 = newNodesLength; i2 < oldNodesLength; i2++) {
          _remove(oldNodes[i2]);
        }
        for (let i2 = 0; i2 < newNodesLength; i2++) {
          oldNode = oldNodes[i2];
          newNode = newNodes[i2];
          if (oldNode && oldNode.el) {
            _updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
          } else {
            _create(parentNode, parentEl, newNode, xmlns);
          }
        }
      }
    } else {
      for (i; i < newNodesLength; i++) {
        _create(parentNode, parentEl, newNodes[i], xmlns);
      }
    }
  } else if (parentNode.is === VNODE_ELEM) {
    for (let i = 0; i < oldNodesLength; i++) _destroy(oldNodes[i]);
  } else {
    for (let i = 0; i < oldNodesLength; i++) _remove(oldNodes[i]);
  }
  parentNode.nodes = newNodes;
};
const _setElAttributes = (newNode, oldAttrs = ALWAYS_EMPTY_OBJECT) => {
  let attr;
  let valueType;
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  if (newNode.$t === "input" && newAttrs.type) {
    el.setAttribute("type", newAttrs.type);
  }
  for (attr in newAttrs) {
    const value = newAttrs[attr];
    if (attr[0] === "o" && attr[1] === "n") {
      if (value !== oldAttrs[attr]) {
        el[attr] = typeof value === "function" ? (e) => {
          if (value.call(e.currentTarget, e) === false) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (e.draw !== false) {
            draw(newNode);
          }
        } : null;
      }
    } else if (attr[0] !== "$" && (attr !== "type" || newNode.$t !== "input") && attr !== "is" && attr !== "xmlns") {
      valueType = typeof value;
      if (valueType === "string" || valueType === "number") {
        if (value !== oldAttrs[attr]) {
          if (attr === "value") el.value = value;
          else el.setAttribute(attr, value + "");
        }
      } else if (value === true) {
        if (oldAttrs[attr] !== true) el.setAttribute(attr, attr);
      } else if (!value) {
        if (oldAttrs[attr]) el.removeAttribute(attr);
      } else if (attr === "style") {
        if (typeof oldAttrs.style === "string") {
          el.removeAttribute("style");
        } else if (oldAttrs.style) {
          for (const oldAttr in oldAttrs.style) {
            if (!(oldAttr in value)) {
              el.style[oldAttr] = "";
            }
          }
        }
        Object.assign(el.style, value);
      }
    }
  }
  for (attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === "o" && attr[1] === "n") {
        el[attr] = null;
      } else {
        el.removeAttribute(attr);
      }
    }
  }
};
const _create = (parentNode, parentEl, vNode, xmlns) => {
  if (vNode.is === VNODE_ELEM) {
    vNode.$p = parentNode;
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.$t] || xmlns;
    vNode.el = xmlns ? document.createElementNS(xmlns, vNode.$t, vNode.attrs.is ? { is: vNode.attrs.is } : null) : document.createElement(vNode.$t, vNode.attrs.is ? { is: vNode.attrs.is } : null);
    _setElAttributes(vNode);
    for (let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_TEXT) {
    vNode = vNode;
    vNode.el = document.createTextNode(vNode.$t);
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_COMP) {
    vNode.$p = parentNode;
    if (vNode.$d.init) vNode.$d.init(vNode);
    vNode.nodes = _flatten(vNode.$d.draw(vNode));
    if (vNode.$d.remove || vNode.$d.removed) {
      for (let current = vNode; current && !current.$h; current = current.$p) {
        current.$h = true;
      }
    }
    if (vNode.attrs.to) {
      if (!(vNode.attrs.to instanceof Element)) {
        throw new Error('For components that act as portals, "to" attribute must be an Element');
      }
      vNode.el = document.createComment("");
      parentEl.insertBefore(vNode.el, null);
      parentEl = vNode.attrs.to;
    }
    for (let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, parentEl, vNode.nodes[i], xmlns);
    }
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if (vNode.$d.drawn) vNode.$d.drawn(vNode, true);
  } else if (vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};
const _redrawComponent = (vNode, parentEl, xmlns) => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.$d.draw(vNode, oldChildren);
  vNode.$t &= ~FLAG_IS_STALE;
  if (newChildren !== oldChildren) {
    _updateNodes(vNode, vNode.attrs.to || parentEl, _flatten(newChildren), oldChildren, xmlns);
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
  }
  if (vNode.$d.drawn) vNode.$d.drawn(vNode);
};
const _unmount = (node2) => {
  redrawQueue.delete(node2);
  if (node2.is === VNODE_COMP) {
    node2.$d.remove && !(node2.$t & FLAG_REMOVE_CALLED) && node2.$d.remove(node2);
    node2.$d.removed && node2.$d.removed(node2);
    node2.$t = 0;
  }
  if ((node2.$h || redrawQueue.size) && node2.nodes) {
    for (let i = 0; i < node2.nodes.length; i++) {
      _unmount(node2.nodes[i]);
    }
  }
};
const _detach = (vNode, skipRemove) => {
  const portal = vNode.is === VNODE_COMP && vNode.attrs.to;
  if (vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(
        vNode.nodes[i],
        // null resets skipRemove for portals while compressing better than false
        portal ? null : skipRemove || vNode.is === VNODE_ELEM
      );
    }
  }
  if (!skipRemove && vNode.el && (vNode.is !== VNODE_COMP || portal)) {
    vNode.el.remove();
  }
};
const _destroy = (vNode) => {
  _detach(vNode);
  _unmount(vNode);
};
const _remove = (vNode) => {
  if (vNode.is === VNODE_COMP) {
    if (vNode.$d.remove) {
      if (vNode.$t & FLAG_IS_REMOVING) {
        return false;
      }
      vNode.$t |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
      const deferred = vNode.$d.remove(vNode);
      if (deferred && deferred.then) {
        if (!("$key" in vNode.attrs)) {
          throw new Error(
            "Component remove() returned a Promise but component has no $key attribute.\nDeferred removal requires a key to track the component during exit.\nAdd a $key and use $remove flag. Example:\ncomp(MyComponent, { $key: item.id, $remove: item.deleted })"
          );
        }
        const deferredDestroy = () => {
          if (vNode.$t & FLAG_IS_REMOVING) {
            const parent = vNode.$p;
            if (!parent) {
              console.warn(
                "Promise resolved but component was already removed.",
                "This usually means the component was removed without using $remove attribute."
              );
              return;
            }
            if (parent) {
              const i = parent.nodes.indexOf(vNode);
              if (i !== -1) parent.nodes.splice(i, 1);
            }
            _destroy(vNode);
            draw(parent);
          }
        };
        deferred.then(deferredDestroy, deferredDestroy);
        return false;
      }
    }
  }
  _destroy(vNode);
  return true;
};
const elem = function(tag) {
  const first = arguments[1];
  const hasAttrs = first && typeof first === "object" && !Array.isArray(first) && !("$t" in first);
  return {
    is: VNODE_ELEM,
    $t: tag,
    // string: element name
    $d: null,
    // always null for elem
    attrs: hasAttrs ? Object.freeze(first)  : ALWAYS_EMPTY_OBJECT,
    nodes: arguments.length > (hasAttrs ? 2 : 1) ? _flatten(arguments, hasAttrs ? 2 : 1) : ALWAYS_EMPTY_ARRAY,
    $p: null,
    el: null
  };
};
const compDef = (componentDefinition) => {
  {
    if (!componentDefinition.draw) {
      throw new Error("Component definition must have a draw function");
    }
    if (typeof componentDefinition.draw !== "function") {
      throw new Error("draw must be a function");
    }
    if (componentDefinition.init && typeof componentDefinition.init !== "function") {
      throw new Error("init must be a function");
    }
    if (componentDefinition.drawn && typeof componentDefinition.drawn !== "function") {
      throw new Error("drawn must be a function");
    }
    if (componentDefinition.remove && typeof componentDefinition.remove !== "function") {
      throw new Error("remove must be a function");
    }
    if (componentDefinition.removed && typeof componentDefinition.removed !== "function") {
      throw new Error("removed must be a function");
    }
    if (componentDefinition.$memo !== void 0 && typeof componentDefinition.$memo !== "boolean" && typeof componentDefinition.$memo !== "function") {
      throw new Error("$memo must be a boolean or function");
    }
  }
  return Object.freeze({
    is: VNODE_COMPDEF,
    ...componentDefinition
  });
};
const comp = (componentDefinition, attrs = ALWAYS_EMPTY_OBJECT) => {
  return {
    is: VNODE_COMP,
    $t: 0,
    // number: flags
    $d: componentDefinition,
    // object: component definition
    attrs: attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) ,
    nodes: ALWAYS_EMPTY_ARRAY,
    $p: null,
    el: null
  };
};
const node = (el) => {
  return {
    is: VNODE_NODE,
    $t: 0,
    $d: null,
    attrs: null,
    nodes: null,
    $p: null,
    el
  };
};
const RootWrapper = compDef({
  draw: (vNode) => vNode.attrs.$nodes
});
const bind = (el, vNodeAnyOrArray) => {
  if (el == null) throw new Error("mount");
  let root = boundNodes.get(el);
  if (vNodeAnyOrArray === null) {
    if (root) {
      _destroy(root);
      boundNodes.delete(el);
    }
    return null;
  }
  root = root || comp(RootWrapper);
  root.attrs = { $nodes: vNodeAnyOrArray };
  boundNodes.set(root.el = el, root);
  draw(root);
  sync();
  return root;
};

export { bind, comp, compDef, diff, draw, elem, node, ns, sync };
