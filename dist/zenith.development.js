/*! Zenith v1.0.0-beta.10 | MIT License | © 2022-2025 Daniel Barber */
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
const FLAG_IS_DEFINED = 1;
const FLAG_IS_STALE = 2;
const FLAG_IS_REMOVING = 4;
const FLAG_HAS_LIFECYCLE = 8;
const FLAG_HAS_REMOVE = 16;
const FLAG_HAS_REMOVED = 32;
const FLAG_REMOVE_CALLED = 64;
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
const ALWAYS_EMPTY_MAP = /* @__PURE__ */ new Map();
const sync = () => {
  let remaining = redrawQueue.size;
  let targetEl;
  if (remaining) {
    const active = document.activeElement;
    for (const redrawNode of redrawQueue) {
      targetEl = boundNodes.has(redrawNode.el) ? redrawNode.el : redrawNode.attrs && redrawNode.attrs.to || redrawNode.el && redrawNode.el.parentNode || redrawNode.up && redrawNode.up.el;
      redrawQueue.delete(redrawNode);
      if (targetEl) {
        _redrawComponent(redrawNode, targetEl);
      }
      if (!--remaining) break;
    }
    if (redrawQueue.size) Promise.resolve().then(sync);
    if (active && active !== document.activeElement && typeof active.focus === "function") {
      active.focus();
    }
  }
};
const draw = (vNode, surgical) => {
  if (surgical) {
    if (vNode.is === VNODE_COMP) {
      vNode.$tag |= FLAG_IS_STALE;
    }
    redrawQueue.add(vNode);
  } else {
    let current;
    for (current = vNode; current.up; current = current.up) ;
    redrawQueue.add(current);
    for (current = vNode; current.up; current = current.up) {
      if (current.is === VNODE_COMP) {
        if (current.$tag & FLAG_IS_STALE) break;
        current.$tag |= FLAG_IS_STALE;
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
  if (!(nodes && typeof nodes === "object" && nodes.length != null)) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (offset; offset < nodes.length; offset++) {
    node2 = nodes[offset];
    if (Array.isArray(node2)) {
      _flatten(node2, 0, arr);
    } else if (node2 != null) {
      if (node2.is) {
        if (arr.$keys === void 0) {
          arr.$keys = node2.attrs && "$key" in node2.attrs ? ALWAYS_EMPTY_MAP : null;
        } else if (!arr.$keys !== !(node2.attrs && "$key" in node2.attrs)) {
          throw new Error("Children have mixed keys..." );
        }
        arr.push(node2);
      } else if (node2 !== true && node2 !== false) {
        if (arr.$keys === void 0) {
          arr.$keys = null;
        } else if (arr.$keys) {
          throw new Error(`Children have mixed keys. Wrap strings in elem('span', {$key}, "My keyed string.")` );
        }
        arr.push({
          is: VNODE_TEXT,
          $tag: node2 + "",
          $def: null,
          attrs: null,
          nodes: null,
          up: null,
          el: null
        });
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
    if (vNode.el.nextSibling !== next) parentEl.insertBefore(vNode.el, next);
    next = vNode.el;
  }
  return next;
};
const _updateNode = (parentNode, parentEl, newNode, oldNode, xmlns, skipMemo) => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    if (newNodeType === oldNode.is) {
      if (newNodeType === VNODE_ELEM) {
        newNode.up = parentNode;
        if (newNode.$tag === oldNode.$tag) {
          newNode.el = oldNode.el;
          newNode.$h = oldNode.$h;
          const diff2 = newNode.attrs.$diff || DIFF_ALL;
          if (diff2 & DIFF_SELF) {
            _setElAttributes(newNode, oldNode.attrs);
          }
          if (diff2 & DIFF_NODES) {
            _updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes, newNode.attrs.xmlns || ns[newNode.$tag] || xmlns);
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
        if (newNode.$tag !== oldNode.$tag) newNode.el.textContent = newNode.$tag;
      } else if (newNodeType === VNODE_COMP) {
        if (oldNode.$tag & FLAG_IS_REMOVING) {
          oldNode.$tag &= ~FLAG_IS_REMOVING;
        }
        newNode.up = parentNode;
        if (newNode.$def === oldNode.$def) {
          newNode.el = oldNode.el;
          newNode.$h = oldNode.$h;
          newNode.nodes = oldNode.nodes;
          if (skipMemo || oldNode.$tag & FLAG_IS_STALE || !newNode.$def.$memo || (newNode.$def.$memo === true ? newNode.attrs !== oldNode.attrs : !newNode.$def.$memo(newNode.attrs, oldNode.attrs))) {
            newNode.$tag &= ~FLAG_IS_STALE;
            _redrawComponent(newNode, parentEl, xmlns);
          }
        } else {
          _create(parentNode, parentEl, newNode, xmlns);
          _remove(oldNode);
        }
      } else if (newNodeType === VNODE_NODE) {
        if (newNode.el !== oldNode.el) {
          parentEl.insertBefore(newNode.el, null);
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
const _updateNodes = (parentNode, parentEl, newNodes, oldNodes, xmlns, depth = 0) => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if (newNodesLength) {
    let oldNode;
    let newNode;
    let i = 0;
    if (oldNodesLength) {
      if (newNodes.$keys && oldNodes.$keys) {
        while (i < newNodesLength && i < oldNodesLength && newNodes[i].attrs.$key === oldNodes[i].attrs.$key) {
          _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
          i++;
        }
        if (i < newNodesLength || i < oldNodesLength) {
          const oldByKey = /* @__PURE__ */ new Map();
          for (let k = i; k < oldNodesLength; k++) {
            oldByKey.set(oldNodes[k].attrs.$key, oldNodes[k]);
          }
          const last = _lastRoot(oldNodes[oldNodesLength - 1]);
          let next = last ? last.nextSibling : null;
          for (let k = newNodesLength - 1; k >= i; k--) {
            newNode = newNodes[k];
            oldNode = oldByKey.get(newNode.attrs.$key);
            if (oldNode) {
              oldByKey.delete(newNode.attrs.$key);
              if (newNode.is === VNODE_COMP && newNode.attrs.$remove) {
                if (oldNode.$tag & FLAG_IS_REMOVING || !_remove(oldNode)) {
                  oldNode.up = parentNode;
                  newNodes[k] = oldNode;
                } else {
                  newNodes.splice(k, 1);
                  continue;
                }
              } else {
                _updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
              }
            } else if (!newNode.attrs.$remove) {
              _create(parentNode, parentEl, newNode, xmlns);
            } else {
              newNodes.splice(k, 1);
              continue;
            }
            next = _place(newNodes[k], parentEl, next);
          }
          for (const oldNode2 of oldByKey.values()) _remove(oldNode2);
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
      for (; i < newNodesLength; i++) {
        _create(parentNode, parentEl, newNodes[i], xmlns);
      }
    }
  } else {
    if (parentNode.is === VNODE_ELEM) {
      parentEl.textContent = "";
      _unmount(oldNodes);
    } else {
      for (let i = 0; i < oldNodesLength; i++) _remove(oldNodes[i]);
    }
  }
  parentNode.nodes = newNodes;
};
const _setElAttributes = (newNode, oldAttrs = ALWAYS_EMPTY_OBJECT) => {
  let attr;
  let valueType;
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  if (newNode.$tag === "input" && newAttrs.type) {
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
    } else if (attr[0] !== "$" && (attr !== "type" || newNode.$tag !== "input") && attr !== "is" && attr !== "xmlns") {
      valueType = typeof value;
      if (valueType === "string" || valueType === "number") {
        if (attr === "value") {
          if (value !== oldAttrs[attr]) el.value = value;
        } else if (value !== oldAttrs[attr]) {
          el.setAttribute(attr, value + "");
        }
      } else if (value === true) {
        if (oldAttrs[attr] !== true) el.setAttribute(attr, attr);
      } else if (!value) {
        if (oldAttrs[attr]) el.removeAttribute(attr);
      } else {
        Object.assign(el[attr], value);
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
    vNode.up = parentNode;
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.$tag] || xmlns;
    vNode.el = xmlns ? document.createElementNS(xmlns, vNode.$tag, vNode.attrs.is ? { is: vNode.attrs.is } : null) : document.createElement(vNode.$tag, vNode.attrs.is ? { is: vNode.attrs.is } : null);
    _setElAttributes(vNode);
    for (let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_TEXT) {
    vNode = vNode;
    vNode.el = document.createTextNode(vNode.$tag);
    parentEl.insertBefore(vNode.el, null);
  } else if (vNode.is === VNODE_COMP) {
    vNode.up = parentNode;
    if (vNode.$def.init) vNode.$def.init(vNode);
    vNode.nodes = _flatten(vNode.$def.draw(vNode));
    if (vNode.$tag & FLAG_HAS_LIFECYCLE) {
      for (let current = vNode; current && !current.$h; current = current.up) {
        current.$h = true;
      }
    }
    if (vNode.attrs.to) {
      if (!(vNode.attrs.to instanceof Element)) {
        throw new Error('For components that act as portals, "to" attribute must be an Element');
      }
      vNode.el = document.createComment("");
      parentEl.insertBefore(vNode.el, null);
    }
    for (let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.attrs.to || parentEl, vNode.nodes[i], xmlns);
    }
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if (vNode.$def.drawn) vNode.$def.drawn(vNode, true);
  } else if (vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};
const _redrawComponent = (vNode, parentEl, xmlns) => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.$def.draw(vNode, oldChildren);
  vNode.$tag &= ~FLAG_IS_STALE;
  if (newChildren !== oldChildren) {
    _updateNodes(vNode, vNode.attrs.to || parentEl, _flatten(newChildren), oldChildren, xmlns);
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
  }
  if (vNode.$def.drawn) vNode.$def.drawn(vNode);
};
const _unmountReusableArray = [];
const _unmount = (nodes) => {
  if (!Array.isArray(nodes)) {
    _unmountReusableArray[0] = nodes;
    nodes = _unmountReusableArray;
  }
  for (let i = 0; i < nodes.length; i++) {
    const node2 = nodes[i];
    if (node2.is === VNODE_COMP) {
      if (node2.$tag & FLAG_HAS_REMOVE || node2.$def.remove) {
        if (!(node2.$tag & FLAG_REMOVE_CALLED)) {
          node2.$def.remove(node2);
        }
      }
      if (node2.$tag & FLAG_HAS_REMOVED || node2.$def.removed) {
        node2.$def.removed(node2);
      }
    }
    if (node2.$h && node2.nodes.length) {
      _unmount(node2.nodes);
      node2.nodes = null;
    }
    node2.attrs = node2.nodes = node2.$tag = node2.$def = node2.el = node2.up = null;
  }
};
const _detach = (vNode) => {
  if (vNode.is === VNODE_COMP) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(vNode.nodes[i]);
    }
    if (vNode.attrs.to && vNode.el) vNode.el.remove();
  } else if (vNode.el) {
    vNode.el.remove();
  }
};
const _destroy = (vNode) => {
  _detach(vNode);
  _unmount(vNode);
};
const _remove = (vNode) => {
  if (vNode.is === VNODE_COMP) {
    if (vNode.$tag & FLAG_HAS_REMOVE || vNode.$def.remove) {
      if (vNode.$tag & FLAG_IS_REMOVING) {
        return false;
      }
      vNode.$tag |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
      const deferred = vNode.$def.remove(vNode);
      if (deferred && deferred.then) {
        if (!("$key" in vNode.attrs)) {
          throw new Error(
            "Component remove() returned a Promise but component has no $key attribute.\nDeferred removal requires a key to track the component during exit.\nAdd a $key and use $remove flag. Example:\ncomp(MyComponent, { $key: item.id, $remove: item.deleted })"
          );
        }
        const deferredDestroy = () => {
          if (vNode.$tag & FLAG_IS_REMOVING) {
            const parent = vNode.up;
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
  const hasAttrs = first && typeof first === "object" && !Array.isArray(first) && !("$tag" in first);
  return {
    is: VNODE_ELEM,
    $tag: tag,
    // string: element name
    $def: null,
    // always null for elem
    attrs: hasAttrs ? Object.freeze(first)  : ALWAYS_EMPTY_OBJECT,
    nodes: arguments.length > (hasAttrs ? 2 : 1) ? _flatten(arguments, hasAttrs ? 2 : 1) : ALWAYS_EMPTY_ARRAY,
    up: null,
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
    $tag: FLAG_IS_DEFINED | (componentDefinition.remove ? FLAG_HAS_REMOVE : 0) | (componentDefinition.removed ? FLAG_HAS_REMOVED : 0) | (componentDefinition.remove || componentDefinition.removed ? FLAG_HAS_LIFECYCLE : 0),
    ...componentDefinition
  });
};
const comp = (componentDefinition, attrs = ALWAYS_EMPTY_OBJECT) => {
  return {
    is: VNODE_COMP,
    $tag: componentDefinition.$tag || 0,
    // number: flags
    $def: componentDefinition,
    // object: component definition
    attrs: attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) ,
    nodes: ALWAYS_EMPTY_ARRAY,
    up: null,
    el: null
  };
};
const node = (el) => {
  return {
    is: VNODE_NODE,
    $tag: el.nodeName.toLowerCase(),
    // string: element name
    $def: null,
    // always null for node
    attrs: null,
    nodes: null,
    up: null,
    el
  };
};
const RootWrapper = compDef({
  draw: (vNode) => vNode.attrs.$nodes
});
const bind = (el, vNodeAnyOrArray) => {
  if (el == null) throw new Error("mount");
  const rootComp = boundNodes.get(el) || comp(RootWrapper);
  rootComp.attrs = { $nodes: vNodeAnyOrArray };
  boundNodes.set(rootComp.el = el, rootComp);
  draw(rootComp);
  sync();
  return rootComp;
};

export { bind, comp, compDef, diff, draw, elem, node, ns, sync };
