/*! Zenith Helpers 1.0.0-rc.1 | MIT License | ©2022-2025 Daniel Barber */
import { node, redraw as redraw$1 } from './zenith.js';

const keep = () => true;

const VNODE_ELEM = 1;
const VNODE_TEXT = 2;
const VNODE_COMP = 4;
const VNODE_NODE = 8;
const VNODE_COMPDEF = 16;
const VNODE_TYPE_MASK = 31;

const is = {
  elem: VNODE_ELEM,
  text: VNODE_TEXT,
  comp: VNODE_COMP,
  node: VNODE_NODE,
  compDef: VNODE_COMPDEF
};

const cls = (...args) => args.filter(Boolean).join(" ");

const slot = (content, attrs) => {
  if (content) {
    if (typeof content === "function") return content(attrs);
    return content;
  }
};

const html = (value) => {
  const container = document.createElement("div");
  container.innerHTML = value + "";
  const nodes = [...container.childNodes].map((child) => node(child));
  return nodes.length === 1 ? nodes[0] : nodes;
};

const closest = (vNode, predicate) => {
  for (let current = vNode.$p; current; current = current.$p) {
    if (predicate(current)) return current;
  }
};

const inject = (vNode, ...keys) => {
  const result = {};
  const needed = new Set(keys);
  for (let current = vNode.$p; current && needed.size > 0; current = current.$p) {
    if (current.is & VNODE_COMP && current.provide) {
      current = current;
      for (const key of needed) {
        if (current.provide[key] !== void 0) {
          result[key] = current.provide[key];
          needed.delete(key);
        }
      }
    }
  }
  return result;
};

const signal = (val) => {
  let _val = val;
  const _fns = /* @__PURE__ */ new Set();
  const notify = () => {
    for (const fn of _fns) fn(_val);
  };
  return {
    get val() {
      return _val;
    },
    set val(newVal) {
      if (_val !== newVal) {
        _val = newVal;
        notify();
      }
    },
    sub(fn) {
      _fns.add(fn);
      return () => _fns.delete(fn);
    },
    notify
  };
};

const derived = (fn, deps) => {
  const computed = signal(fn());
  const cleanups = deps.map((dep) => dep.sub(() => {
    computed.val = fn();
  }));
  computed.destroy = () => {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  };
  return computed;
};

const router = (routes, options = {}) => {
  const isHistory = options.mode === "history";
  const eventType = isHistory ? "popstate" : "hashchange";
  const getPath = () => isHistory ? location.pathname : location.hash.slice(1) || "/";
  const compiled = [];
  const matchRoute = (path) => {
    for (const route of compiled) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        for (let i = 0; i < route.keys.length; i++) {
          params[route.keys[i]] = match[i + 1];
        }
        return { component: route.component, params };
      }
    }
    return { component: routes["*"] || null, params: {} };
  };
  for (const pattern in routes) {
    const keys = [];
    const regexPattern = pattern.replace(/:[^/]+/g, (match) => {
      keys.push(match.slice(1));
      return "([^/]+)";
    }).replace(/\*/g, "(.*)");
    compiled.push({
      regex: new RegExp(`^${regexPattern}$`),
      keys,
      component: routes[pattern]
    });
  }
  return {
    init: (vNode) => {
      const node = vNode;
      const matched = matchRoute(getPath());
      node.route = matched.component;
      node.params = matched.params;
      node.onroute = () => {
        const matched2 = matchRoute(getPath());
        node.route = matched2.component;
        node.params = matched2.params;
        redraw$1(node, true);
      };
      window.addEventListener(eventType, node.onroute);
    },
    draw: (vNode) => {
      var _a;
      const node = vNode;
      return (_a = node.route) == null ? void 0 : _a.call(node, node.params);
    },
    removed: (vNode) => {
      const node = vNode;
      if (node.onroute) {
        window.removeEventListener(eventType, node.onroute);
      }
    }
  };
};

const boundNodes = /* @__PURE__ */ new WeakMap();
const externalOwners = /* @__PURE__ */ new WeakMap();
const redrawQueue = /* @__PURE__ */ new Set();
const drawnQueue = [];
let renderDepth = 0;
let flushingDrawn = false;
const ns = {
  math: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg"
};
const TYPE_MASK = VNODE_TYPE_MASK;
const FLAG_IS_STALE = 32;
const FLAG_IS_REMOVING = 64;
const FLAG_IS_ACTIVE = 128;
const FLAG_REMOVE_CALLED = 256;
const DIFF_SELF = 2;
const DIFF_NODES = 4;
const DIFF_ALL = DIFF_SELF | DIFF_NODES;
const ALWAYS_EMPTY_ARRAY = Object.freeze([]) ;
const ALWAYS_EMPTY_OBJECT = Object.freeze({}) ;
const sync = () => {
  renderDepth++;
  try {
    let remaining = redrawQueue.size;
    let targetEl;
    if (remaining) {
      const active = document.activeElement;
      for (const redrawNode of redrawQueue) {
        let current = redrawNode;
        for (; current.$p && current.is & VNODE_COMP; current = current.$p) ;
        targetEl = current.el;
        redrawQueue.delete(redrawNode);
        if (targetEl) {
          const namespace = targetEl.namespaceURI;
          _redrawComponent(
            redrawNode,
            targetEl,
            namespace === "http://www.w3.org/1999/xhtml" || namespace === ns.svg && targetEl.localName === "foreignObject" ? void 0 : namespace || void 0
          );
        }
        if (!--remaining) break;
      }
      if (redrawQueue.size) Promise.resolve().then(sync);
      if (active && active !== document.body && document.activeElement === document.body) {
        active.focus();
      }
    }
  } catch (error) {
    drawnQueue.length = 0;
    throw error;
  } finally {
    if (--renderDepth === 0 && !flushingDrawn) {
      flushingDrawn = true;
      try {
        for (let i = 0; i < drawnQueue.length; i++) {
          const vNode = drawnQueue[i++];
          if (vNode.is & FLAG_IS_ACTIVE) {
            vNode.$d.drawn(vNode, drawnQueue[i]);
          }
        }
      } finally {
        drawnQueue.length = 0;
        flushingDrawn = false;
      }
    }
  }
};
const redraw = (vNode, surgical = false) => {
  const wasEmpty = redrawQueue.size === 0;
  if (surgical) {
    if (!(vNode.is & VNODE_COMP)) {
      throw new Error("Surgical redraw requires a component vnode");
    }
    if (!(vNode.is & FLAG_IS_ACTIVE)) return;
    vNode.is |= FLAG_IS_STALE;
    redrawQueue.add(vNode);
  } else {
    if (vNode.is & VNODE_COMP && !(vNode.is & FLAG_IS_ACTIVE)) return;
    let current = vNode;
    for (; current.$p; current = current.$p) ;
    redrawQueue.add(current);
    for (current = vNode; current.$p; current = current.$p) {
      if (current.is & VNODE_COMP) {
        if (current.is & FLAG_IS_STALE) break;
        current.is |= FLAG_IS_STALE;
      }
    }
  }
  if (wasEmpty) Promise.resolve().then(sync);
};
const _vNode = (is, $t, $d, attrs, nodes, el = null) => ({
  is,
  $t,
  $d,
  attrs,
  nodes,
  el,
  $p: null
});
const _flattenReusableArray = [];
const _flatten = (nodes, offset = 0, arr = []) => {
  let node2;
  if (typeof nodes === "string" || !nodes || nodes.length == null) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (; offset < nodes.length; offset++) {
    node2 = nodes[offset];
    if (Array.isArray(node2)) {
      _flatten(node2, 0, arr);
    } else if (node2 != null && node2 !== true && node2 !== false) {
      if (!node2.is) {
        node2 = _vNode(
          VNODE_TEXT,
          "" + node2,
          null,
          null,
          null
        );
      } else if (node2.is & VNODE_NODE) {
        node2 = _vNode(VNODE_NODE, null, null, null, null, node2.el);
      }
      const keyed = !!(node2.attrs && "$key" in node2.attrs);
      if (arr.length && keyed !== !!arr.$keys) {
        throw new Error("Children have mixed keys..." );
      }
      if (keyed) arr.$keys = true;
      arr.push(node2);
    }
  }
  if (arr.$keys) {
    const seen = /* @__PURE__ */ new Set();
    for (const node3 of arr) {
      const key = node3.attrs.$key;
      if (seen.has(key)) {
        throw new Error("Duplicate sibling key: " + String(key));
      }
      seen.add(key);
    }
  }
  _flattenReusableArray[0] = null;
  return arr;
};
const _place = (vNode, parentEl, next) => {
  if (vNode.is & VNODE_COMP) {
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
const _anchor = (vNode, parentEl) => {
  let child = vNode;
  let parent = child.$p;
  for (; parent; parent = child.$p) {
    const siblings = parent.nodes;
    for (let i = siblings.indexOf(child) + 1; i < siblings.length; i++) {
      const root = siblings[i].el;
      if (root && root.parentNode === parentEl) return root;
    }
    if (!(parent.is & VNODE_COMP)) break;
    child = parent;
  }
  return null;
};
const _syncRoot = (vNode) => {
  let child = vNode;
  let parent = child.$p;
  for (; parent && parent.is & VNODE_COMP && parent.$p; parent = child.$p) {
    const first = _nextRoot(parent.nodes, 0, null);
    if (parent.el === first) break;
    parent.el = first;
    child = parent;
  }
};
const _nextRoot = (nodes, i, anchor) => {
  for (; i < nodes.length; i++) {
    const root = nodes[i].el;
    if (root) return root;
  }
  return anchor;
};
const _updateNode = (parentNode, parentEl, newNode, oldNode, xmlns, anchor = null) => {
  const newNodeType = newNode.is & oldNode.is & TYPE_MASK;
  if (newNodeType === VNODE_ELEM && newNode.$t === oldNode.$t) {
    newNode = newNode;
    newNode.$p = parentNode;
    newNode.el = oldNode.el;
    newNode.$h = oldNode.$h;
    const diffFlags = newNode.attrs.$diff || DIFF_ALL;
    if (diffFlags & DIFF_SELF) _setElAttributes(newNode, oldNode.attrs);
    if (diffFlags & DIFF_NODES) {
      _updateNodes(
        newNode,
        newNode.el,
        newNode.nodes,
        oldNode.nodes,
        newNode.$t === "foreignObject" ? void 0 : newNode.attrs.xmlns || ns[newNode.$t] || xmlns
      );
    } else {
      newNode.nodes = oldNode.nodes;
    }
    if (newNode.$t === "select" && diffFlags & DIFF_SELF) {
      _setSelectAttributes(newNode);
    }
    return newNode;
  } else if (newNodeType === VNODE_TEXT) {
    newNode.el = oldNode.el;
    if (newNode.$t !== oldNode.$t) newNode.el.nodeValue = newNode.$t;
    return newNode;
  } else if (newNodeType === VNODE_COMP && newNode.$d === oldNode.$d) {
    const oldAttrs = oldNode.attrs;
    const newAttrs = oldNode.attrs = newNode.attrs;
    oldNode = oldNode;
    oldNode.$p = parentNode;
    if (oldNode.is & FLAG_IS_REMOVING) {
      oldNode.$r = null;
      oldNode.is &= ~FLAG_IS_REMOVING;
    }
    if (oldNode.is & FLAG_IS_STALE || !(oldNode.$d.$memo && (oldNode.$d.$memo === true ? newAttrs === oldAttrs : oldNode.$d.$memo(newAttrs, oldAttrs)))) {
      _redrawComponent(oldNode, parentEl, xmlns, anchor);
    }
    return oldNode;
  } else if (newNodeType === VNODE_NODE) {
    if (newNode.el !== oldNode.el) {
      parentEl.insertBefore(newNode.el, oldNode.el);
      const oldExternal = oldNode;
      if (externalOwners.get(oldExternal.el) === oldExternal) {
        oldExternal.el.remove();
        externalOwners.delete(oldExternal.el);
      }
    }
    return newNode;
  }
  _create(parentNode, parentEl, newNode, xmlns, oldNode.el || anchor);
  _remove(oldNode);
  return newNode;
};
const _updateNodes = (parentNode, parentEl, newNodes, oldNodes, xmlns, anchor = null) => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  let hasExternal = false;
  for (let i = 0; i < newNodesLength; i++) {
    const vNode = newNodes[i];
    if (vNode.is & VNODE_NODE) {
      const external = vNode;
      externalOwners.set(external.el, external);
      hasExternal = true;
    }
  }
  if (newNodesLength) {
    let oldNode;
    let newNode;
    let i = 0;
    if (oldNodesLength) {
      if (newNodes.$keys && oldNodes.$keys) {
        for (; i < newNodesLength && i < oldNodesLength && newNodes[i].attrs.$key === oldNodes[i].attrs.$key && !(newNodes[i].is & VNODE_COMP && newNodes[i].attrs.$remove); i++) {
          newNodes[i] = _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns, _nextRoot(oldNodes, i + 1, anchor));
        }
        if (i < newNodesLength || i < oldNodesLength) {
          const oldByKey = /* @__PURE__ */ new Map();
          for (let k = i; k < oldNodesLength; k++) oldByKey.set(oldNodes[k].attrs.$key, k);
          let next = anchor;
          for (let k = newNodesLength - 1; k >= i; k--) {
            newNode = newNodes[k];
            const oldPos = oldByKey.get(newNode.attrs.$key);
            const oldEl = oldPos === k && oldNodes[oldPos].el;
            if (oldPos === void 0) {
              if (!newNode.attrs.$remove) {
                _create(parentNode, parentEl, newNode, xmlns, next);
              } else {
                newNodes.splice(k, 1);
                continue;
              }
            } else {
              oldNode = oldNodes[oldPos];
              oldByKey.delete(newNode.attrs.$key);
              if (newNode.is & VNODE_COMP && newNode.attrs.$remove) {
                if (oldNode.is & FLAG_IS_REMOVING || !_remove(oldNode)) {
                  oldNode.$p = parentNode;
                  newNodes[k] = oldNode;
                } else {
                  newNodes.splice(k, 1);
                  continue;
                }
              } else {
                newNodes[k] = _updateNode(parentNode, parentEl, newNode, oldNode, xmlns, next);
              }
            }
            const first = newNodes[k].el;
            next = oldPos === void 0 || oldPos !== k || first !== oldEl ? _place(newNodes[k], parentEl, next) : first || next;
          }
          for (const oldPos of oldByKey.values()) _remove(oldNodes[oldPos]);
        }
      } else {
        for (let i2 = 0; i2 < newNodesLength; i2++) {
          oldNode = oldNodes[i2];
          newNode = newNodes[i2];
          const next = _nextRoot(oldNodes, i2 + 1, anchor);
          if (oldNode) {
            newNodes[i2] = _updateNode(parentNode, parentEl, newNode, oldNode, xmlns, next);
          } else {
            _create(parentNode, parentEl, newNode, xmlns, next);
          }
        }
        for (let i2 = newNodesLength; i2 < oldNodesLength; i2++) _remove(oldNodes[i2]);
        if (hasExternal) {
          let next = anchor;
          for (let i2 = newNodesLength - 1; i2 >= 0; i2--) {
            next = _place(newNodes[i2], parentEl, next);
          }
        }
      }
    } else {
      for (; i < newNodesLength; i++) _create(parentNode, parentEl, newNodes[i], xmlns, anchor);
    }
  } else if (parentNode.is & VNODE_ELEM) {
    for (let i = 0; i < oldNodesLength; i++) _destroy(oldNodes[i]);
  } else {
    for (let i = 0; i < oldNodesLength; i++) _remove(oldNodes[i]);
  }
  parentNode.nodes = newNodes;
};
const _setElAttributes = (newNode, oldAttrs = ALWAYS_EMPTY_OBJECT) => {
  let attr;
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  for (attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === "o" && attr[1] === "n") {
        el[attr] = null;
      } else if (newNode.$t !== "select" || attr !== "value" && attr !== "selectedIndex") {
        el.removeAttribute(attr);
      }
    }
  }
  if (newNode.$t === "input") {
    if (newAttrs.type) {
      if (newAttrs.type !== oldAttrs.type) el.setAttribute("type", newAttrs.type);
    } else if ("type" in newAttrs && oldAttrs.type) {
      el.removeAttribute("type");
    }
  }
  for (attr in newAttrs) {
    const value = newAttrs[attr];
    if (value === void 0 && (attr === "checked" || attr === "selected" || attr === "value" && (newNode.$t === "input" || newNode.$t === "textarea"))) continue;
    if (value === oldAttrs[attr] && (!value || typeof value !== "object") && attr !== "value" && attr !== "checked" && attr !== "selected") continue;
    if (attr[0] === "o" && attr[1] === "n") {
      el[attr] = typeof value === "function" ? (e) => {
        if (value.call(e.currentTarget, e) === false) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.redraw !== false) redraw(newNode);
      } : null;
    } else if (attr[0] !== "$" && (attr !== "type" || newNode.$t !== "input") && attr !== "is" && attr !== "xmlns" && !(newNode.$t === "select" && (attr === "value" || attr === "selectedIndex"))) {
      if (typeof value === "string" || typeof value === "number") {
        if (attr === "value") {
          if (newNode.$t === "input" || newNode.$t === "textarea") {
            if (el.value !== "" + value && !(newNode.$t === "input" && el.type === "file" && value !== "")) {
              el.value = value;
            }
          } else if (value !== oldAttrs[attr]) {
            el.value = value;
          }
        } else {
          el.setAttribute(attr, value);
        }
      } else if (value === true || value === false) {
        if (attr === "checked" || attr === "selected") {
          if (el[attr] !== value) el[attr] = value;
        } else if (value) {
          el.setAttribute(attr, attr);
        } else if (oldAttrs[attr]) {
          el.removeAttribute(attr);
        }
      } else if (!value) {
        if (attr in oldAttrs) el.removeAttribute(attr);
      } else if (attr === "style") {
        if (typeof oldAttrs.style === "string") {
          el.removeAttribute("style");
        } else if (oldAttrs.style) {
          for (const oldAttr in oldAttrs.style) {
            if (!(oldAttr in value)) el.style[oldAttr] = "";
          }
        }
        Object.assign(el.style, value);
      }
    }
  }
};
const _setSelectAttributes = (vNode) => {
  const el = vNode.el;
  const attrs = vNode.attrs;
  const value = attrs.value;
  if (value !== void 0) {
    if (value === null) {
      if (el.selectedIndex !== -1) el.selectedIndex = -1;
    } else if (el.value !== "" + value || el.selectedIndex === -1) {
      el.value = value;
    }
  }
  if (attrs.selectedIndex != null && el.selectedIndex !== attrs.selectedIndex) {
    el.selectedIndex = attrs.selectedIndex;
  }
};
const _create = (parentNode, parentEl, vNode, xmlns, anchor = null) => {
  if (vNode.is & VNODE_ELEM) {
    vNode = vNode;
    vNode.$p = parentNode;
    xmlns = vNode.attrs.xmlns || ns[vNode.$t] || xmlns;
    vNode.el = xmlns ? vNode.attrs.is ? document.createElementNS(xmlns, vNode.$t, { is: vNode.attrs.is }) : document.createElementNS(xmlns, vNode.$t) : vNode.attrs.is ? document.createElement(vNode.$t, { is: vNode.attrs.is }) : document.createElement(vNode.$t);
    _setElAttributes(vNode);
    if (vNode.$t === "foreignObject") xmlns = void 0;
    for (let i = 0; i < vNode.nodes.length; i++) _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    if (vNode.$t === "select") _setSelectAttributes(vNode);
    parentEl.insertBefore(vNode.el, anchor);
  } else if (vNode.is & VNODE_TEXT) {
    vNode = vNode;
    vNode.el = parentEl.insertBefore(document.createTextNode(vNode.$t), anchor);
  } else if (vNode.is & VNODE_COMP) {
    vNode = vNode;
    vNode.$p = parentNode;
    vNode.is |= FLAG_IS_ACTIVE;
    if (vNode.$d.init) vNode.$d.init(vNode);
    vNode.nodes = _flatten(vNode.$d.draw(vNode));
    if (vNode.$d.remove || vNode.$d.removed) {
      for (let current = vNode; current && !current.$h; current = current.$p) current.$h = true;
    }
    for (let i = 0; i < vNode.nodes.length; i++) _create(vNode, parentEl, vNode.nodes[i], xmlns, anchor);
    vNode.el = _nextRoot(vNode.nodes, 0, null);
    if (vNode.$d.drawn) drawnQueue.push(vNode, true);
  } else if (vNode.is & VNODE_NODE) {
    const external = vNode;
    externalOwners.set(external.el, external);
    parentEl.insertBefore(external.el, anchor);
  }
};
const _redrawComponent = (vNode, parentEl, xmlns, anchor) => {
  const oldChildren = vNode.nodes;
  vNode.is &= ~FLAG_IS_STALE;
  const newChildren = vNode.$d.draw(vNode, oldChildren);
  if (newChildren !== oldChildren) {
    _updateNodes(
      vNode,
      parentEl,
      _flatten(newChildren),
      oldChildren,
      xmlns,
      anchor === void 0 ? vNode.$p ? _anchor(vNode, parentEl) : null : anchor
    );
    if (vNode.$p) {
      vNode.el = _nextRoot(vNode.nodes, 0, null);
      _syncRoot(vNode);
    }
  }
  if (vNode.$d.drawn) drawnQueue.push(vNode, false);
};
const _unmount = (vNode) => {
  redrawQueue.delete(vNode);
  if (vNode.is & VNODE_COMP) {
    vNode = vNode;
    if (vNode.$d.remove && !(vNode.is & FLAG_REMOVE_CALLED)) vNode.$d.remove(vNode);
    if (vNode.$d.removed) vNode.$d.removed(vNode);
    vNode.is &= TYPE_MASK;
  }
  if ((vNode.$h || redrawQueue.size) && vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _unmount(vNode.nodes[i]);
    }
  }
};
const _detach = (vNode, skipRemove) => {
  if (vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(vNode.nodes[i], skipRemove || !!(vNode.is & VNODE_ELEM));
    }
  }
  if (vNode.is & VNODE_NODE) {
    const external = vNode;
    if (externalOwners.get(external.el) === external) {
      externalOwners.delete(external.el);
      if (!skipRemove) external.el.remove();
    }
  } else if (!skipRemove && vNode.el && !(vNode.is & VNODE_COMP)) {
    vNode.el.remove();
  }
  if (vNode.is & VNODE_COMP) {
    vNode.is &= ~FLAG_IS_ACTIVE;
  }
};
const _destroy = (vNode) => {
  _detach(vNode);
  _unmount(vNode);
  vNode.$p = null;
};
const _remove = (vNode) => {
  if (vNode.is & VNODE_COMP && vNode.$d.remove) {
    if (vNode.is & FLAG_IS_REMOVING) {
      return false;
    }
    vNode = vNode;
    vNode.is |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
    const deferred = vNode.$d.remove(vNode);
    if (deferred && deferred.then) {
      if (!("$key" in vNode.attrs)) {
        throw new Error(
          "Component remove() returned a Promise but component has no $key attribute.\nDeferred removal requires a key to track the component during exit.\nAdd a $key and use $remove flag. Example:\ncomp(MyComponent, { $key: item.id, $remove: item.deleted })"
        );
      }
      const token = vNode.$r = {};
      const deferredDestroy = () => {
        if (vNode.$r === token && vNode.is & FLAG_IS_REMOVING) {
          vNode.$r = null;
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
          redraw(parent);
        }
      };
      deferred.then(deferredDestroy, deferredDestroy);
      return false;
    }
  }
  _destroy(vNode);
  return true;
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
    ...componentDefinition,
    is: VNODE_COMPDEF
  });
};
const comp = (componentDefinition, attrs = ALWAYS_EMPTY_OBJECT) => {
  return _vNode(
    VNODE_COMP,
    null,
    componentDefinition,
    attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) ,
    ALWAYS_EMPTY_ARRAY
  );
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
  root.is |= FLAG_IS_ACTIVE;
  boundNodes.set(root.el = el, root);
  redrawQueue.add(root);
  sync();
  return root;
};

const states = /* @__PURE__ */ new WeakMap();
const definition = {
  init(vNode) {
    states.set(vNode, {
      host: document.createElement("div"),
      active: true,
      pending: false
    });
  },
  draw: () => null,
  drawn(vNode) {
    const state = states.get(vNode);
    if (!state) return;
    const to = vNode.attrs.to;
    const target = typeof to === "string" ? document.querySelector(to) : to;
    if (target) {
      if (state.host.parentNode !== target) {
        target.appendChild(state.host);
      }
    } else {
      state.host.remove();
    }
    if (state.pending) return;
    state.pending = true;
    Promise.resolve().then(() => {
      state.pending = false;
      if (state.active && state.host.parentNode) {
        bind(state.host, vNode.attrs.children);
      }
    });
  },
  removed(vNode) {
    const state = states.get(vNode);
    if (!state) return;
    state.active = false;
    bind(state.host, null);
    state.host.remove();
    states.delete(vNode);
  }
};
const DetachedRoot = compDef(definition);

export { DetachedRoot, closest, cls, derived, html, inject, is, keep, router, signal, slot };
