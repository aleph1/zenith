/*! Zenith Helpers v1.0.0-beta.9 | MIT License | © 2022-2025 Daniel Barber */
import { node, draw } from './zenith.js';

const keep = () => true;

const VNODE_ELEM = 1;
const VNODE_TEXT = 2;
const VNODE_COMP = 3;
const VNODE_NODE = 4;
const VNODE_COMPDEF = 5;

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
  for (let current = vNode.up; current; current = current.up) {
    if (predicate(current)) return current;
  }
};

const inject = (vNode, ...keys) => {
  const result = {};
  const needed = new Set(keys);
  for (let current = vNode.up; current && needed.size > 0; current = current.up) {
    if (current.is === is.comp && current.provide) {
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
    init(vNode) {
      const matched = matchRoute(getPath());
      vNode.route = matched.component;
      vNode.params = matched.params;
      vNode.onroute = () => {
        const matched2 = matchRoute(getPath());
        vNode.route = matched2.component;
        vNode.params = matched2.params;
        draw(vNode, true);
      };
      window.addEventListener(eventType, vNode.onroute);
    },
    draw: (vNode) => {
      var _a;
      return (_a = vNode.route) == null ? void 0 : _a.call(vNode, vNode.params);
    },
    removed(vNode) {
      window.removeEventListener(eventType, vNode.onroute);
    }
  };
};

const Portal = {
  to: (vNode) => typeof vNode.attrs.to === "string" ? document.querySelector(vNode.attrs.to) : vNode.attrs.to,
  draw: (vNode) => vNode.attrs.children
};

export { Portal, closest, cls, derived, html, inject, is, keep, router, signal, slot };
