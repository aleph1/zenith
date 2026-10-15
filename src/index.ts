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
//   Called after component is rendered to DOM
//   isFirstDraw is true only on initial mount
//   Use for DOM manipulation, entry animations
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
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeHTML,
  VNodeNode,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeNodeAttributes,
  VNodeContainer,
} from './vnode.defs';

const DEBUG = window.DEBUG ?? false;

// ----------------------------------------
// Internal state
// ----------------------------------------

const boundNodes = new Map();
const redrawQueue = new Set<VNodeAny>();

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

const FLAG_IS_STALE = 1;      // needs redraw
const FLAG_IS_REMOVING = 2;   // being removed
const FLAG_REMOVE_CALLED = 4; // remove() called

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

const ALWAYS_EMPTY_ARRAY = DEBUG ? Object.freeze([]) : [];
const ALWAYS_EMPTY_OBJECT = DEBUG ? Object.freeze({}) : {};

// ----------------------------------------
// Flush pending updates
// ----------------------------------------
// Flushes the microtask queue to apply
// pending updates immediately.
// ----------------------------------------

export const sync = (): void => {
  let remaining = redrawQueue.size;
  let targetEl;
  if (remaining) {
    const active = document.activeElement as HTMLElement;
    for (const redrawNode of redrawQueue) {
      targetEl = boundNodes.has(redrawNode.el) 
        ? redrawNode.el 
        : (redrawNode.attrs && redrawNode.attrs.to) || (redrawNode.el && redrawNode.el.parentNode) || (redrawNode.up && redrawNode.up.el);
      redrawQueue.delete(redrawNode);
      if (targetEl) {
        _redrawComponent(redrawNode as VNodeComp, targetEl);
      }
      if (!--remaining) break;
    }
    if (redrawQueue.size) Promise.resolve().then(sync);
    if (active && document.activeElement === document.body) {
      active.focus();
    }
  }
};

// Redraw a node
// - Reuse current to avoid an additional variable declaration
// - Optimized for performance and minification
export const draw = (vNode: VNodeContainer, surgical?: boolean) => {
  if (surgical) {
    if (vNode.is === VNODE_COMP) {
      vNode.$t |= FLAG_IS_STALE;
    }
    redrawQueue.add(vNode);
  } else {
    let current;
    for (current = vNode; current.up; current = current.up);
    redrawQueue.add(current);
    for (current = vNode; current.up; current = current.up) {
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
const _flatten = (
  nodes: VNodeAnyOrArray | IArguments,
  offset: number = 0,
  arr: VNodeFlatArray = []
): VNodeFlatArray => {
  let node;
  if (!nodes || (nodes as ArrayLike<unknown>).length == null) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (offset; offset < (nodes as ArrayLike<unknown>).length; offset++) {
    node = nodes[offset];

    if (Array.isArray(node)) {
        _flatten(node, 0, arr);
    } else if (node != null && node !== true && node !== false) {
        if (!node.is) {
            node = {
                is: VNODE_TEXT,
                $t: node + '',
                $d: null,
                attrs: null,
                nodes: null,
                up: null,
                el: null,
            };
        }
        arr.push(node);
        if (arr.$keys == null) {
            arr.$keys = !!(node.attrs && '$key' in node.attrs);
        } else if (arr.$keys !== !!(node.attrs && '$key' in node.attrs)) {
            throw new Error(DEBUG ? 'Children have mixed keys...' : '$keys');
        }
    }
  }
  return arr;
};

const _lastRoot = (vNode: VNodeAny): Node | null => {
  if (vNode.is === VNODE_COMP && !vNode.attrs.to) {
    for (let i = vNode.nodes.length - 1; i >= 0; i--) {
      const root = _lastRoot(vNode.nodes[i]);
      if (root) return root;
    }
    return null;
  }
  return vNode.el;
};

const _place = (vNode: VNodeAny, parentEl: Element, next: Node | null): Node | null => {
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

const _updateNode = (parentNode: VNodeContainer, parentEl: Element, newNode: VNodeAny, oldNode: VNodeAny, xmlns: string): void => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    if (newNodeType === oldNode.is) {
      if (newNodeType === VNODE_ELEM) {
        newNode.up = parentNode;
        if (newNode.$t === oldNode.$t) {
          newNode.el = oldNode.el as Element;
          newNode.$h = oldNode.$h;
          const diff = newNode.attrs.$diff || DIFF_ALL;
          if (diff & DIFF_SELF) {
            _setElAttributes(newNode, oldNode.attrs);
          }
          if (diff & DIFF_NODES) {
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
        // Clear removal flag if updating a vnode that was being removed
        if ((oldNode as VNodeComp).$t & FLAG_IS_REMOVING) {
          (oldNode as VNodeComp).$t &= ~FLAG_IS_REMOVING;
        }
        newNode.up = parentNode;
        if (newNode.$d === oldNode.$d) {
          newNode.el = oldNode.el as Element;
          newNode.$h = oldNode.$h;
          newNode.nodes = (oldNode as VNodeComp).nodes;
          if (newNode.attrs.to !== oldNode.attrs.to) {
            const target = newNode.attrs.to as Element | undefined;

            if (DEBUG && target && !(target instanceof Element)) {
                throw new Error('For components that act as portals, "to" attribute must be an Element');
            }

            if (target && !oldNode.attrs.to) {
                newNode.el = document.createComment('');
                parentEl.insertBefore(newNode.el, oldNode.el);
            }

            let next = target ? null : oldNode.el;

            for (let i = newNode.nodes.length - 1; i >= 0; i--) {
                next = _place(newNode.nodes[i], target || parentEl, next);
            }

            if (oldNode.attrs.to && !target) {
                oldNode.el.remove();
                newNode.el = newNode.nodes[0] && newNode.nodes[0].el;
            }
        }
          if(
            ((oldNode as VNodeComp).$t & FLAG_IS_STALE)
            || !(newNode.$d.$memo &&
              (newNode.$d.$memo === true
                ? newNode.attrs === oldNode.attrs
                : newNode.$d.$memo(newNode.attrs, oldNode.attrs)))
          ) {
            newNode.$t &= ~FLAG_IS_STALE;
            _redrawComponent(newNode as VNodeComp, parentEl, xmlns);
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

const _updateNodes = (parentNode: VNodeContainer, parentEl: Element, newNodes:VNodeFlatArray, oldNodes:VNodeFlatArray, xmlns?: string): void => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if(newNodesLength) {
    let oldNode;
    let newNode;
    let i = 0;
    if(oldNodesLength) {

      // Determine if nodes require reconciling
      if (newNodes.$keys && oldNodes.$keys) {
        // Most renders don't change the order of keyed children.
        while (i < newNodesLength && i < oldNodesLength &&
          newNodes[i].attrs.$key === oldNodes[i].attrs.$key &&
          !(newNodes[i].is === VNODE_COMP && newNodes[i].attrs.$remove)) {
          _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
          i++;
        }
         if (i < newNodesLength || i < oldNodesLength) {
           const oldByKey = new Map();
           for (let k = i; k < oldNodesLength; k++) {
             oldByKey.set(oldNodes[k].attrs.$key, k);
           }
           const last = _lastRoot(oldNodes[oldNodesLength - 1]);
           let next: Node | null = last ? last.nextSibling : null;
           for (let k = newNodesLength - 1; k >= i; k--) {
             newNode = newNodes[k];
             const oldPos = oldByKey.get(newNode.attrs.$key);
             if (oldPos === undefined) {
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
                 if ((oldNode.$t & FLAG_IS_REMOVING) || !_remove(oldNode)) {
                   oldNode.up = parentNode;
                   newNodes[k] = oldNode;
                 } else {
                   newNodes.splice(k, 1);
                   continue;
                 }
               } else {
                 _updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
               }
             }

             // Only reposition inserted nodes or nodes whose original index changed.
             // For retained nodes, keep the first DOM root as the next anchor.
             next = oldPos === undefined || oldPos !== k || newNodes[k].el !== oldNode.el
               ? _place(newNodes[k], parentEl, next)
               : newNodes[k].el || next;
           }
           for (const oldPos of oldByKey.values()) _remove(oldNodes[oldPos]);
        }
      } else {
        
        for(let i = newNodesLength; i < oldNodesLength; i++) {
          _remove(oldNodes[i]);
        }

        for(let i = 0; i < newNodesLength; i++) {
          oldNode = oldNodes[i];
          newNode = newNodes[i];
          if(oldNode && oldNode.el) {
            _updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
          } else {
            _create(parentNode, parentEl, newNode, xmlns);
          }
        }
      }
    } else {
      for(i; i < newNodesLength; i++) {
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

const _setElAttributes = (newNode: VNodeElem, oldAttrs: VNodeElemAttributes = ALWAYS_EMPTY_OBJECT): void => {
  let attr;
  let valueType;
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  if (newNode.$t === 'input' && newAttrs.type) { //} && newAttrs.type !== oldAttrs.type) { // benchmark extra test
    el.setAttribute('type', newAttrs.type);
  }
  for (attr in newAttrs) {
    // value is kept in the loop as it may be a function,
    // with value.call() being used in the event handler
    const value = newAttrs[attr];
    if (attr[0] === 'o' && attr[1] === 'n') {
      if (value !== oldAttrs[attr]) {
        el[attr] = typeof value === 'function'
          ? e => {
            if (value.call(e.currentTarget, e) === false) {
              e.preventDefault();
              e.stopPropagation();
            }
            if (e.draw !== false) {
              draw(newNode);
            }
          }
          : null;
      }
    } else if (attr[0] !== '$' && (attr !== 'type' || newNode.$t !== 'input') && attr !== 'is' && attr !== 'xmlns') {
      valueType = typeof value;
      if (valueType === 'string' || valueType === 'number') {
        if (value !== oldAttrs[attr]) {
          if (attr === 'value') el.value = value;
          else el.setAttribute(attr, value + '');
        }
      } else if (value === true) {
        if (oldAttrs[attr] !== true) el.setAttribute(attr, attr);
      } else if (!value) {
        if (oldAttrs[attr]) el.removeAttribute(attr);
      } else if (attr === 'style') {
        if (typeof oldAttrs.style === 'string') {
          el.removeAttribute('style');
        } else if (oldAttrs.style) {
            for (const oldAttr in oldAttrs.style) {
                if (!(oldAttr in value)) {
                    el.style[oldAttr] = '';
                }
            }
        }
        Object.assign(el.style, value);
      }
    }
  }
  for (attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === 'o' && attr[1] === 'n') {
        el[attr] = null;
      } else {
        el.removeAttribute(attr);
      }
    }
  }
};

const _create = (parentNode: VNodeContainer, parentEl: Element, vNode: VNodeAny, xmlns?: string): void => {
  if(vNode.is === VNODE_ELEM) {
    vNode.up = parentNode;
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.$t] || xmlns;
    vNode.el = xmlns 
      ? document.createElementNS(xmlns, vNode.$t, vNode.attrs.is ? {is: vNode.attrs.is} : null)
      : document.createElement(vNode.$t, vNode.attrs.is ? {is: vNode.attrs.is} : null);
    _setElAttributes(vNode);
    for(let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_TEXT) {
    vNode = vNode as VNodeText;
    vNode.el = document.createTextNode(vNode.$t);
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_COMP) {
    vNode.up = parentNode;
    if (vNode.$d.init) vNode.$d.init(vNode);
    vNode.nodes = _flatten(vNode.$d.draw(vNode));
    if (vNode.$d.remove || vNode.$d.removed) {
      for (let current: VNodeContainer | null = vNode; current && !current.$h; current = current.up) {
        current.$h = true;
      }
    }
    if (vNode.attrs.to) {
      if(DEBUG && !(vNode.attrs.to instanceof Element)) {
        throw new Error('For components that act as portals, "to" attribute must be an Element');
      }
      vNode.el = document.createComment('');
      parentEl.insertBefore(vNode.el, null);
      parentEl = vNode.attrs.to as Element;
    }
    for(let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, parentEl, vNode.nodes[i], xmlns);
    }
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if (vNode.$d.drawn) vNode.$d.drawn(vNode, true);
  } else if (vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};

const _redrawComponent = (vNode: VNodeComp, parentEl: Element, xmlns?: string): void => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.$d.draw(vNode, oldChildren);
  vNode.$t &= ~FLAG_IS_STALE;
  if (newChildren !== oldChildren) {
    _updateNodes(vNode, (vNode.attrs.to || parentEl) as Element, _flatten(newChildren), oldChildren, xmlns);
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
  }
  if (vNode.$d.drawn) vNode.$d.drawn(vNode);
};

const _unmount = (node: VNodeAny): void => {
    redrawQueue.delete(node);

    if (node.is === VNODE_COMP) {
        if (node.$d.remove && !(node.$t & FLAG_REMOVE_CALLED)) {
            node.$d.remove(node);
        }
        if (node.$d.removed) {
            node.$d.removed(node);
        }
        node.$t = 0;
    }

    if ((node.$h || redrawQueue.size) && node.nodes) {
        for (let i = 0; i < node.nodes.length; i++) {
            _unmount(node.nodes[i]);
        }
    }
};

const _detach = (vNode: VNodeAny): void => {
  if (vNode.nodes) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(vNode.nodes[i]);
    }
  }
  if (vNode.is !== VNODE_COMP || vNode.attrs.to) {
    if (vNode.el) vNode.el.remove();
  }
};

const _destroy = (vNode: VNodeAny): void => {
  _detach(vNode);
  _unmount(vNode);
};

const _remove = (vNode: VNodeAny): boolean => {
  if (vNode.is === VNODE_COMP) {
    if (vNode.$d.remove) {
      if ((vNode as VNodeComp).$t & FLAG_IS_REMOVING) {
        return false;
      }
      // Mark _remove() as called before calling it
      (vNode as VNodeComp).$t |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
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
        const deferredDestroy = () => {
          if ((vNode as VNodeComp).$t & FLAG_IS_REMOVING) {
            const parent = vNode.up;
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
} = function(tag: string): VNodeElem {
  const first = arguments[1];
  const hasAttrs = first && typeof first === 'object' && !Array.isArray(first) && !('$t' in first);
  return {
    is: VNODE_ELEM,
    $t: tag,                    // string: element name
    $d: null,                   // always null for elem
    attrs: hasAttrs ? DEBUG ? Object.freeze(first) : first : ALWAYS_EMPTY_OBJECT,
    nodes: arguments.length > (hasAttrs ? 2 : 1) ? _flatten(arguments, hasAttrs ? 2 : 1) : ALWAYS_EMPTY_ARRAY,
    up: null,
    el: null,
  } as VNodeElem;
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
    is: VNODE_COMPDEF,
    ...componentDefinition,
  });
}

export const comp = (componentDefinition: VNodeCompDefinition, attrs: VNodeCompAttributes = ALWAYS_EMPTY_OBJECT): VNodeComp => {
  return {
    is: VNODE_COMP,
    $t: 0,  // number: flags
    $d: componentDefinition,           // object: component definition
    attrs: DEBUG ? attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) : attrs,
    nodes: ALWAYS_EMPTY_ARRAY as unknown as VNodeFlatArray,
    up: null,
    el: null,
  };
};

export const node = (el: Element): VNodeNode => {
  return {
    is: VNODE_NODE,
    $t: 0,
    $d: null,
    attrs: null,
    nodes: null,
    up: null,
    el,
  };
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
  boundNodes.set(root.el = el, root);
  draw(root);
  sync();
  return root;
};

// ----------------------------------------
// Additional exports
// ----------------------------------------

export { ns };