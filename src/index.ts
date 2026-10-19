// ----------------------------------------
// Component lifecycle hooks
// ----------------------------------------
// init(vNode): 
//   Called once during component creation, before first draw
//   Use for initialization, setting up state
//
// draw(vNode, oldChildren): 
//   Called to render component content, must return vnodes
//   Called on mount and every update
//
// drawn(vNode, isFirstDraw): 
//   Called after DOM insertion/reconciliation completes
//   vNode.el is current, and connected if the bound container is connected
//   isFirstDraw is true only on initial mount
//   Use for DOM measurement, manipulation, entry animations
//
// remove(vNode): 
//   Called when component is being removeda
//   Return Promise to defer destruction (for exit animations)
//   Return nothing for immediate removal
//
// removed(vNode): 
//   Called when component is fully removed from DOM
//   Use for cleanup (timers, listeners, etc.)

// ----------------------------------------
// Notes
// ----------------------------------------
// We use insertBefore() instead of append() whenever adding
// an element to the DOM to reduce Zenith's bundle size.

// ----------------------------------------
// Globals
// ----------------------------------------

declare global {
  interface Window {
    DEBUG?: boolean;
  }
}

// ----------------------------------------
// Type definitions
// ----------------------------------------

import {
  VNODE_ELEM,
  VNODE_TEXT,
  VNODE_COMP,
  VNODE_NODE,
  VNODE_COMPDEF,
  VNODE_TYPE_MASK,
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeNode,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeContainer,
} from './vnode.defs';

const DEBUG = window.DEBUG ?? false;

// ----------------------------------------
// Internal state
// ----------------------------------------

const boundNodes = new WeakMap();
const redrawQueue = new Set<VNodeAny>();
const drawnQueue: (VNodeComp | boolean)[] = [];
let renderDepth = 0;
let flushingDrawn = false;

// ----------------------------------------
// Namespaces
// ----------------------------------------

const ns = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

// ----------------------------------------
// Bitwise flags
// ----------------------------------------

// VNODE_* values must be distinct bits: 1, 2, 4, 8, 16.
const TYPE_MASK = VNODE_TYPE_MASK;
const FLAG_IS_STALE = 32;       // needs redraw
const FLAG_IS_REMOVING = 64;    // being removed
const FLAG_IS_ACTIVE = 128;     // to avoid stale redraws
const FLAG_REMOVE_CALLED = 256; // remove() called

const DIFF_NONE = 1;  // Skip everything
const DIFF_SELF = 2;  // Only diff attributes
const DIFF_NODES = 4; // Only diff children
const DIFF_ALL = DIFF_SELF | DIFF_NODES; // default ()
export const diff = {
  none: DIFF_NONE,
  self: DIFF_SELF,
  nodes: DIFF_NODES,
  all: DIFF_ALL
};

// ----------------------------------------
// Empty data structures
// ----------------------------------------
// Used on nodes with no attrs, children,
// or keys, to help minimize memory use,
// and to keep object shape consistent
// ----------------------------------------

const ALWAYS_EMPTY_ARRAY = (DEBUG ? Object.freeze([]) : []) as unknown as VNodeFlatArray;
const ALWAYS_EMPTY_OBJECT = DEBUG ? Object.freeze({}) : {};

// ----------------------------------------
// Flush pending updates
// ----------------------------------------
// Flushes the microtask queue to apply
// pending updates immediately.
// ----------------------------------------

export const sync = (): void => {
  renderDepth++;

  try {
    let remaining = redrawQueue.size;
    let targetEl;
    if (remaining) {
      const active = document.activeElement as HTMLElement;

      for (const redrawNode of redrawQueue) {
        // Resolve the real DOM container from the logical tree.
        let current = redrawNode as VNodeContainer;
        for (; current.$p && (current.is & VNODE_COMP); current = current.$p);
        targetEl = current.el;
        redrawQueue.delete(redrawNode);
        if (targetEl) {
          const namespace = targetEl.namespaceURI;
          _redrawComponent(
            redrawNode as VNodeComp,
            targetEl,
            namespace === 'http://www.w3.org/1999/xhtml' ||
            (namespace === ns.svg && targetEl.localName === 'foreignObject')
              ? undefined : namespace || undefined
          );
        }
        if (!--remaining) break;
      }
      if (redrawQueue.size) Promise.resolve().then(sync);
      if (active && active !== document.body &&
          document.activeElement === document.body) {
        active.focus();
      }
    }
  } catch (error) {
    // Discard callbacks from an incomplete reconciliation
    drawnQueue.length = 0;
    throw error;
  } finally {
    if (--renderDepth === 0 && !flushingDrawn) {
      flushingDrawn = true;
      try {
        for (let i = 0; i < drawnQueue.length; i++) {
          const vNode = drawnQueue[i++] as VNodeComp;
          if (vNode.is & FLAG_IS_ACTIVE) {
            vNode.$d.drawn(vNode, drawnQueue[i] as boolean);
          }
        }
      } finally {
        drawnQueue.length = 0;
        flushingDrawn = false;
      }
    }
  }
};

// Redraw from the root, or redraw a specific component subtree.
export const draw: {
  (vNode: VNodeContainer, surgical?: false): void;
  (vNode: VNodeComp, surgical: true): void;
} = (vNode: VNodeContainer, surgical = false): void => {
  if (surgical) {
    if (!(vNode.is & VNODE_COMP)) {
      if (DEBUG) throw new Error('Surgical redraw requires a component vnode');
      return;
    }

    if (!(vNode.is & FLAG_IS_ACTIVE)) return;

    vNode.is |= FLAG_IS_STALE;
    redrawQueue.add(vNode);
  } else {
    if ((vNode.is & VNODE_COMP) && !(vNode.is & FLAG_IS_ACTIVE)) return;

    let current = vNode;
    for (; current.$p; current = current.$p);
    redrawQueue.add(current);

    for (current = vNode; current.$p; current = current.$p) {
      if (current.is & VNODE_COMP) {
        if (current.is & FLAG_IS_STALE) break;
        current.is |= FLAG_IS_STALE;
      }
    }
  }
  if (redrawQueue.size === 1) {
    Promise.resolve().then(sync);
  }
};

const _vNode = <T extends VNodeAny>(
  is: T['is'],
  $t: T['$t'],
  $d: T['$d'],
  attrs: T['attrs'],
  nodes: T['nodes'],
  el: Element | null = null,
): T => ({
  is,
  $t,
  $d,
  attrs,
  nodes,
  el,
  $p: null,
} as T);

const _flattenReusableArray = [];
const _flatten = (
  nodes: VNodeAnyOrArray | IArguments,
  offset: number = 0,
  arr: VNodeFlatArray = []
): VNodeFlatArray => {
  let node;
  if (typeof nodes === 'string' || !nodes || (nodes as ArrayLike<unknown>).length == null) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (; offset < (nodes as ArrayLike<unknown>).length; offset++) {
    node = nodes[offset];

    if (Array.isArray(node)) {
        _flatten(node, 0, arr);
    } else if (node != null && node !== true && node !== false) {
      if (!node.is) {
        node = _vNode<VNodeText>(
          VNODE_TEXT, '' + node, null, null, null
        );
      }
      const keyed = !!(node.attrs && '$key' in node.attrs);
      if (arr.length && keyed !== !!arr.$keys) {
        throw new Error(DEBUG ? 'Children have mixed keys...' : '$keys');
      }
      if (keyed) arr.$keys = true;
      arr.push(node);
    }
  }
  // catch duplicate keys in debug mode
  if (DEBUG && arr.$keys) {
    const seen = new Set();
    for (const node of arr) {
      const key = node.attrs.$key;
      if (seen.has(key)) {
        throw new Error('Duplicate sibling key: ' + String(key));
      }
      seen.add(key);
    }
  }
  _flattenReusableArray[0] = null;
  return arr;
};

const _place = (vNode: VNodeAny, parentEl: Element, next: Node | null): Node | null => {
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

// Look past empty siblings, then ascend through components to find
// the next node sharing this DOM parent. Stop at elements.
const _anchor = (vNode: VNodeAny, parentEl: Element): Node | null => {
  let child: VNodeAny = vNode;
  let parent = child.$p;
  for(; parent; parent = child.$p) {
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

// The first DOM root is an API-visible cached reference. Keep it in sync when
// a targeted child redraw changes the root of a chain of component ancestors.
const _syncRoot = (vNode: VNodeComp): void => {
  let child: VNodeContainer = vNode;
  let parent = child.$p;
  for(; parent && (parent.is & VNODE_COMP) && parent.$p; parent = child.$p) {
    const first = _nextRoot(parent.nodes, 0, null);
    if (parent.el === first) break;
    parent.el = first;
    child = parent;
  }
};

const _nextRoot = (nodes: VNodeFlatArray, i: number, anchor: Node | null): Node | null => {
  for (; i < nodes.length; i++) {
    const root = nodes[i].el;
    if (root) return root;
  }
  return anchor;
};

const _updateNode = (parentNode: VNodeContainer, parentEl: Element, newNode: VNodeAny, oldNode: VNodeAny, xmlns?: string, anchor: Node | null = null): VNodeAny => {
  const newNodeType = newNode.is & oldNode.is & TYPE_MASK;
  if (newNodeType === VNODE_ELEM && newNode.$t === oldNode.$t) {
    newNode = newNode as VNodeElem;
    newNode.$p = parentNode;
    newNode.el = oldNode.el as Element;
    newNode.$h = oldNode.$h;
    const diffFlags = newNode.attrs.$diff || DIFF_ALL;
    if (diffFlags & DIFF_SELF) _setElAttributes(newNode, oldNode.attrs);
    if (diffFlags & DIFF_NODES) {
      _updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes,
        newNode.$t === 'foreignObject' ? undefined : newNode.attrs.xmlns || ns[newNode.$t] || xmlns);
    } else {
      newNode.nodes = oldNode.nodes;
    }
    if (newNode.$t === 'select' && (diffFlags & DIFF_SELF)) {
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
    oldNode = oldNode as VNodeComp;
    oldNode.$p = parentNode;
    if (oldNode.is & FLAG_IS_REMOVING) {
      oldNode.$r = null;
      oldNode.is &= ~FLAG_IS_REMOVING;
    }
    if (oldNode.is & FLAG_IS_STALE ||
        !(oldNode.$d.$memo && (oldNode.$d.$memo === true
           ? newAttrs === oldAttrs : oldNode.$d.$memo(newAttrs, oldAttrs)))) {
      _redrawComponent(oldNode, parentEl, xmlns, anchor);
    }
    return oldNode;
  } else if (newNodeType === VNODE_NODE) {
    if (newNode.el !== oldNode.el) {
      parentEl.insertBefore(newNode.el, oldNode.el);
      oldNode.el.remove();
    }
    return newNode;
  }
  // A replacement may have no previous DOM root at all.
  _create(parentNode, parentEl, newNode, xmlns, oldNode.el || anchor);
  _remove(oldNode);
  return newNode;
};

const _updateNodes = (parentNode: VNodeContainer, parentEl: Element, newNodes: VNodeFlatArray, oldNodes: VNodeFlatArray, xmlns?: string, anchor: Node | null = null): void => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if (newNodesLength) {
    let oldNode;
    let newNode;
    let i = 0;
    if (oldNodesLength) {
      if (newNodes.$keys && oldNodes.$keys) {
        // Fast path for stable keyed prefix.
        for(;
          i < newNodesLength && i < oldNodesLength &&
          newNodes[i].attrs.$key === oldNodes[i].attrs.$key &&
          !((newNodes[i].is & VNODE_COMP) && newNodes[i].attrs.$remove); i++) {
          newNodes[i] = _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns, _nextRoot(oldNodes, i + 1, anchor));
        }
        if (i < newNodesLength || i < oldNodesLength) {
          const oldByKey = new Map();
          for (let k = i; k < oldNodesLength; k++) oldByKey.set(oldNodes[k].attrs.$key, k);
          let next: Node | null = anchor;
          for (let k = newNodesLength - 1; k >= i; k--) {
            newNode = newNodes[k];
            const oldPos = oldByKey.get(newNode.attrs.$key);
            const oldEl = oldPos === k && oldNodes[oldPos].el;
            if (oldPos === undefined) {
              if (!newNode.attrs.$remove) {
                _create(parentNode, parentEl, newNode, xmlns, next);
              } else {
                newNodes.splice(k, 1);
                continue;
              }
            } else {
              oldNode = oldNodes[oldPos];
              oldByKey.delete(newNode.attrs.$key);
              if ((newNode.is & VNODE_COMP) && newNode.attrs.$remove) {
                if ((oldNode.is & FLAG_IS_REMOVING) || !_remove(oldNode)) {
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
            next = oldPos === undefined || oldPos !== k || first !== oldEl
              ? _place(newNodes[k], parentEl, next)
              : first || next;
          }
          for (const oldPos of oldByKey.values()) _remove(oldNodes[oldPos]);
        }
      } else {
        for (let i = 0; i < newNodesLength; i++) {
          oldNode = oldNodes[i];
          newNode = newNodes[i];
          const next = _nextRoot(oldNodes, i + 1, anchor);
          if (oldNode) {
            newNodes[i] = _updateNode(parentNode, parentEl, newNode, oldNode, xmlns, next);
          } else {
            _create(parentNode, parentEl, newNode, xmlns, next);
          }
        }
        for (let i = newNodesLength; i < oldNodesLength; i++) _remove(oldNodes[i]);
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

const _setElAttributes = (newNode: VNodeElem, oldAttrs: VNodeElemAttributes = ALWAYS_EMPTY_OBJECT): void => {
  let attr;
  let valueType;
  const el = newNode.el;
  const newAttrs = newNode.attrs;

  // Remove first: HTML attribute names can be case-insensitive.
  for (attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === 'o' && attr[1] === 'n') {
        el[attr] = null;
      } else if (
        newNode.$t !== 'select' ||
        (attr !== 'value' && attr !== 'selectedIndex')
      ) {
        el.removeAttribute(attr);
      }
    }
  }

  // Set input type before value, including a transition away from type=file.
  if (newNode.$t === 'input') {
    if (newAttrs.type) {
      if (newAttrs.type !== oldAttrs.type) el.setAttribute('type', newAttrs.type);
    } else if ('type' in newAttrs && oldAttrs.type) {
      el.removeAttribute('type');
    }
  }

  for (attr in newAttrs) {
    const value = newAttrs[attr];

    // Explicit undefined relinquishes control of live form state.
    if (value === undefined &&
        (attr === 'checked' || attr === 'selected' ||
        (attr === 'value' && (newNode.$t === 'input' || newNode.$t === 'textarea')))) continue;

    // Controlled properties must still inspect the live DOM.
    // Object styles can be mutated in place.
    if (value === oldAttrs[attr] && (!value || typeof value !== 'object') &&
        attr !== 'value' && attr !== 'checked' && attr !== 'selected') continue;

    if (attr[0] === 'o' && attr[1] === 'n') {
      el[attr] = typeof value === 'function'
        ? e => {
          if (value.call(e.currentTarget, e) === false) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (e.draw !== false) draw(newNode);
        }
        : null;
    } else if (
      attr[0] !== '$' &&
      (attr !== 'type' || newNode.$t !== 'input') &&
      attr !== 'is' &&
      attr !== 'xmlns' &&
      !(newNode.$t === 'select' && (attr === 'value' || attr === 'selectedIndex'))
    ) {
      if (typeof value === 'string' || typeof value === 'number') {
        if (attr === 'value') {
          if (newNode.$t === 'input' || newNode.$t === 'textarea') {
            if (el.value !== '' + value &&
                !(newNode.$t === 'input' && el.type === 'file' && value !== '')) {
              el.value = value;
            }
          } else if (value !== oldAttrs[attr]) {
            // Preserve an explicit empty option value before children exist.
            el.value = value;
          }
        } else {
          el.setAttribute(attr, value as string);
        }
      } else if (value === true || value === false) {
        if (attr === 'checked' || attr === 'selected') {
          if (el[attr] !== value) el[attr] = value;
        } else if (value) {
          el.setAttribute(attr, attr);
        } else if (oldAttrs[attr]) {
          el.removeAttribute(attr);
        }
      } else if (!value) {
        // 0 and '' were real attribute values; truthiness is insufficient.
        if (attr in oldAttrs) el.removeAttribute(attr);
      } else if (attr === 'style') {
        if (typeof oldAttrs.style === 'string') {
          el.removeAttribute('style');
        } else if (oldAttrs.style) {
          for (const oldAttr in oldAttrs.style) {
            if (!(oldAttr in value)) el.style[oldAttr] = '';
          }
        }
        Object.assign(el.style, value);
      }
    }
  }
};

// Select values must be applied after options are created or updated.
// Unlike ordinary attributes, selection is browser-managed state:
// undefined leaves it unchanged, null clears it, and selectedIndex
// takes precedence over value when both are provided.
const _setSelectAttributes = (vNode: VNodeElem): void => {
  const el = vNode.el as HTMLSelectElement;
  const attrs = vNode.attrs;
  const value = attrs.value;
  if (value !== undefined) {
    if (value === null) {
      if (el.selectedIndex !== -1) el.selectedIndex = -1;
    } else if (el.value !== '' + value || el.selectedIndex === -1) {
      el.value = value;
    }
  }
  if (attrs.selectedIndex != null &&
    el.selectedIndex !== attrs.selectedIndex) {
    el.selectedIndex = attrs.selectedIndex;
  }
};

const _create = (parentNode: VNodeContainer, parentEl: Element, vNode: VNodeAny, xmlns?: string, anchor: Node | null = null): void => {
  if (vNode.is & VNODE_ELEM) {
    vNode.$p = parentNode;
    xmlns = vNode.attrs.xmlns || ns[vNode.$t] || xmlns;
    vNode.el = xmlns
      ? vNode.attrs.is
        ? document.createElementNS(xmlns, vNode.$t, { is: vNode.attrs.is })
        : document.createElementNS(xmlns, vNode.$t)
      : vNode.attrs.is
        ? document.createElement(vNode.$t, { is: vNode.attrs.is })
        : document.createElement(vNode.$t);
    _setElAttributes(vNode);
    if (vNode.$t === 'foreignObject') xmlns = undefined;
    for (let i = 0; i < vNode.nodes.length; i++) _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    if (vNode.$t === 'select') _setSelectAttributes(vNode);
    parentEl.insertBefore(vNode.el, anchor);
  } else if (vNode.is & VNODE_TEXT) {
    vNode = vNode as VNodeText;
    vNode.el = parentEl.insertBefore(document.createTextNode(vNode.$t), anchor);
  } else if (vNode.is & VNODE_COMP) {
    vNode = vNode as VNodeComp;
    vNode.$p = parentNode;
    vNode.is |= FLAG_IS_ACTIVE;
    if (vNode.$d.init) vNode.$d.init(vNode);
    vNode.nodes = _flatten(vNode.$d.draw(vNode));
    if (vNode.$d.remove || vNode.$d.removed) {
      for (let current: VNodeContainer | null = vNode; current && !current.$h; current = current.$p) current.$h = true;
    }
    for (let i = 0; i < vNode.nodes.length; i++) _create(vNode, parentEl, vNode.nodes[i], xmlns, anchor);
    vNode.el = _nextRoot(vNode.nodes, 0, null);
    if (vNode.$d.drawn) drawnQueue.push(vNode, true);
  } else if (vNode.is & VNODE_NODE) {
    parentEl.insertBefore(vNode.el, anchor);
  }
};

const _redrawComponent = (vNode: VNodeComp, parentEl: Element, xmlns?: string, anchor?: Node | null): void => {
  const oldChildren = vNode.nodes;
  // Clearing before drawing preserves a redraw requested during draw().
  vNode.is &= ~FLAG_IS_STALE;
  const newChildren = vNode.$d.draw(vNode, oldChildren);
  if (newChildren !== oldChildren) {
    _updateNodes(vNode, parentEl, _flatten(newChildren), oldChildren, xmlns,
      anchor === undefined ? (vNode.$p ? _anchor(vNode, parentEl) : null) : anchor);
    if (vNode.$p) {
      vNode.el = _nextRoot(vNode.nodes, 0, null);
      _syncRoot(vNode);
    }
  }
  if (vNode.$d.drawn) drawnQueue.push(vNode, false);
};

const _unmount = (vNode: VNodeAny): void => {
  redrawQueue.delete(vNode);
  if (vNode.is & VNODE_COMP) {
    vNode = vNode as VNodeComp;
    if(vNode.$d.remove && !(vNode.is & FLAG_REMOVE_CALLED)) vNode.$d.remove(vNode);
    if(vNode.$d.removed) vNode.$d.removed(vNode);
    vNode.is &= TYPE_MASK;
  }
  if ((vNode.$h || redrawQueue.size) && vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _unmount(vNode.nodes[i]);
    }
  }
};

const _detach = (vNode: VNodeAny, skipRemove?: boolean): void => {
  if (vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(vNode.nodes[i], skipRemove || (vNode.is & VNODE_ELEM));
    }
  }
  if (!skipRemove && vNode.el && !(vNode.is & VNODE_COMP)) {
    vNode.el.remove();
  }
  if (vNode.is & VNODE_COMP) {
    (vNode as VNodeComp).is &= ~FLAG_IS_ACTIVE;
  }
};

const _destroy = (vNode: VNodeAny): void => {
  _detach(vNode);
  _unmount(vNode);
  vNode.$p = null;
};

const _remove = (vNode: VNodeAny): boolean => {
  if ((vNode.is & VNODE_COMP) && vNode.$d.remove) {
    if ((vNode as VNodeComp).is & FLAG_IS_REMOVING) {
      return false;
    }
    vNode = (vNode as VNodeComp);
    // Mark _remove() as called before calling it
    vNode.is |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
    const deferred = vNode.$d.remove(vNode);
    if (deferred && deferred.then) {
      if (DEBUG && !('$key' in vNode.attrs)) {
        throw new Error(
          'Component remove() returned a Promise but component has no $key attribute.\n' +
          'Deferred removal requires a key to track the component during exit.\n' +
          'Add a $key and use $remove flag. Example:\n' +
          'comp(MyComponent, { $key: item.id, $remove: item.deleted })'
        );
      }
      const token = vNode.$r = {};
      const deferredDestroy = () => {
        if (vNode.$r === token && vNode.is & FLAG_IS_REMOVING) {
          vNode.$r = null;
          const parent = vNode.$p;
          if (DEBUG && !parent) {
            console.warn(
              'Promise resolved but component was already removed.',
              'This usually means the component was removed without using $remove attribute.'
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
  _destroy(vNode);
  return true;
};

// ----------------------------------------
// VNode creation
// ----------------------------------------

export const elem: {
    (tag: string): VNodeElem
    (tag: string, attrs:VNodeElemAttributes, ...args:VNodeArray): VNodeElem
    (tag: string, ...args:VNodeArray): VNodeElem;
} = (tag: string, ...args): VNodeElem => {
  const attrs = args[0];
  const hasAttrs = attrs && typeof attrs === 'object' && !Array.isArray(attrs) && !('$t' in attrs);
  return _vNode<VNodeElem>(
    VNODE_ELEM, tag, null,
    hasAttrs ? DEBUG ? Object.freeze(attrs) : attrs : ALWAYS_EMPTY_OBJECT,
    args.length > (hasAttrs ? 1 : 0)
      ? _flatten(args, hasAttrs ? 1 : 0)
      : ALWAYS_EMPTY_ARRAY
  );
};

export const compDef = (componentDefinition: VNodeCompDefinition): VNodeCompDefinition => {
  if (DEBUG) {
    if (!componentDefinition.draw) {
      throw new Error('Component definition must have a draw function');
    }
    if (typeof componentDefinition.draw !== 'function') {
      throw new Error('draw must be a function');
    }
    if (componentDefinition.init && typeof componentDefinition.init !== 'function') {
      throw new Error('init must be a function');
    }
    if (componentDefinition.drawn && typeof componentDefinition.drawn !== 'function') {
      throw new Error('drawn must be a function');
    }
    if (componentDefinition.remove && typeof componentDefinition.remove !== 'function') {
      throw new Error('remove must be a function');
    }
    if (componentDefinition.removed && typeof componentDefinition.removed !== 'function') {
      throw new Error('removed must be a function');
    }
    if (componentDefinition.$memo !== undefined && 
       typeof componentDefinition.$memo !== 'boolean' && 
       typeof componentDefinition.$memo !== 'function') {
      throw new Error('$memo must be a boolean or function');
    }
  }
  // Only copy known component properties
  return Object.freeze({
    ...componentDefinition,
    is: VNODE_COMPDEF,
  });
}

export const comp = (componentDefinition: VNodeCompDefinition, attrs: VNodeCompAttributes = ALWAYS_EMPTY_OBJECT): VNodeComp => {
  return _vNode<VNodeComp>(
    VNODE_COMP,
    null,
    componentDefinition,
    DEBUG ? attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) : attrs,
    ALWAYS_EMPTY_ARRAY
  );
};

export const node = (el: Element): VNodeNode => {
  return _vNode<VNodeNode>(VNODE_NODE, null, null, null, null, el);
};

const RootWrapper = compDef({
  draw: (vNode) => vNode.attrs.$nodes,
});

export const bind = (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray | null): VNodeComp => {
  if (DEBUG && el == null) throw new Error('mount');
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
  draw(root);
  sync();
  return root;
};

// ----------------------------------------
// Additional exports
// ----------------------------------------

export { ns };