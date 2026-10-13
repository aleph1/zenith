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
const redrawQueue = new Set();

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

const FLAG_IS_DEFINED = 1;     // component from compDef()
const FLAG_IS_STALE = 2;       // needs redraw
const FLAG_IS_REMOVING = 4;    // being removed
const FLAG_HAS_LIFECYCLE = 8;  // has remove OR removed (optimization flag)
const FLAG_HAS_REMOVE = 16;    // has remove function
const FLAG_HAS_REMOVED = 32;   // has removed function
const FLAG_REMOVE_CALLED = 64; // remove() called

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
const ALWAYS_EMPTY_MAP = new Map();

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
    const active = document.activeElement;
    for (const redrawNode of redrawQueue) {
      targetEl = boundNodes.has(redrawNode.el) 
        ? redrawNode.el 
        : (redrawNode.attrs && redrawNode.attrs.to) || (redrawNode.el && redrawNode.el.parentNode) || (redrawNode.up && redrawNode.up.el);
      redrawQueue.delete(redrawNode);
      if (targetEl) {
        _redrawComponent(redrawNode, targetEl);
      }
      if (!--remaining) break;
    }
    if (redrawQueue.size) Promise.resolve().then(sync);
    if (active && active !== document.activeElement && typeof active.focus === 'function') {
      (active as HTMLElement).focus();
    }
  }
};

// Redraw a node
// - Reuse current to avoid an additional variable declaration
// - Optimized for performance and minification
export const draw = (vNode: VNodeComp, surgical?: boolean) => {
  if (surgical) {
    if (vNode.is === VNODE_COMP) {
      vNode.$tag |= FLAG_IS_STALE;
    }
    redrawQueue.add(vNode);
  } else {
    let current;
    for (current = vNode; current.up; current = current.up);
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
const _flatten = (nodes: VNodeAnyOrArray, offset: number = 0, arr: VNodeFlatArray = []): VNodeFlatArray => {
  let node;
  if (!(nodes && typeof nodes === 'object' && nodes.length != null)) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (offset; offset < nodes.length; offset++) {
    node = nodes[offset];
    if (Array.isArray(node)) {
      _flatten(node, 0, arr);
    } else if (node != null) {
      if (node.is) {
        if (arr.$keys === undefined) {
          arr.$keys = node.attrs && '$key' in node.attrs ? ALWAYS_EMPTY_MAP : null;
        } else if ((!arr.$keys) !== !(node.attrs && '$key' in node.attrs)) {
          throw new Error(DEBUG ? 'Children have mixed keys...' : '$keys');
        }
        arr.push(node);
      } else if (node !== true && node !== false) {
        if (arr.$keys === undefined) {
          arr.$keys = null;
        } else if (arr.$keys) {
          throw new Error(DEBUG ? 'Children have mixed keys. Wrap strings in elem(\'span\', {$key}, "My keyed string.")' : '$keys');
        }
        arr.push({
          is: VNODE_TEXT,
          $tag: node + '',
          $def: null,
          attrs: null,
          nodes: null,
          up: null,
          el: null,
        });
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
    if (vNode.el.nextSibling !== next) parentEl.insertBefore(vNode.el, next);
    next = vNode.el;
  }
  return next;
};

const _updateNode = (parentNode: VNodeContainer, parentEl: Element, newNode: VNodeAny, oldNode: VNodeAny, xmlns: string, skipMemo?: boolean): void => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    if (newNodeType === oldNode.is) {
      if (newNodeType === VNODE_ELEM) {
        newNode.up = parentNode;
        if (newNode.$tag === oldNode.$tag) {
          newNode.el = oldNode.el as Element;
          newNode.$h = oldNode.$h;
          const diff = newNode.attrs.$diff || DIFF_ALL;
          if (diff & DIFF_SELF) {
            _setElAttributes(newNode, oldNode.attrs);
          }
          if (diff & DIFF_NODES) {
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
        // Clear removal flag if updating a vnode that was being removed
        if ((oldNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
          (oldNode as VNodeComp).$tag &= ~FLAG_IS_REMOVING;
        }
        newNode.up = parentNode;
        if (newNode.$def === oldNode.$def) {
          newNode.el = oldNode.el as Element;
          newNode.$h = oldNode.$h;
          newNode.nodes = (oldNode as VNodeComp).nodes;
          if(
            skipMemo
            || ((oldNode as VNodeComp).$tag & FLAG_IS_STALE)
            || !newNode.$def.$memo
            || (newNode.$def.$memo === true 
              ? newNode.attrs !== oldNode.attrs 
              : !newNode.$def.$memo(newNode.attrs, oldNode.attrs))
          ) {
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

const _updateNodes = (parentNode: VNodeContainer, parentEl: Element, newNodes:VNodeFlatArray, oldNodes:VNodeFlatArray, xmlns?: string, depth = 0): void => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  if(newNodesLength) {
    let oldNode;
    let newNode;
    let oldPos;
    let i = 0;
    if(oldNodesLength) {

      // Determine if nodes require reconciling
      if (newNodes.$keys && oldNodes.$keys) {
        // Most renders don't change the order of keyed children.
         while (i < newNodesLength && i < oldNodesLength &&
                newNodes[i].attrs.$key === oldNodes[i].attrs.$key) {
           _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
           i++;
         }
         if (i < newNodesLength || i < oldNodesLength) {
           const oldByKey = new Map();
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
                 if ((oldNode.$tag & FLAG_IS_REMOVING) || !_remove(oldNode)) {
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
          for (const oldNode of oldByKey.values()) _remove(oldNode);
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
      for(; i < newNodesLength; i++) {
        _create(parentNode, parentEl, newNodes[i], xmlns);
      }
    }
  } else {
    if (parentNode.is === VNODE_ELEM) {
      parentEl.textContent = '';
      _unmount(oldNodes);
    } else {
      for (let i = 0; i < oldNodesLength; i++) _remove(oldNodes[i]);
    }
  }
  parentNode.nodes = newNodes;
};

const _setElAttributes = (newNode: VNodeElem, oldAttrs: VNodeElemAttributes = ALWAYS_EMPTY_OBJECT): void => {
  let attr;
  let valueType;
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  if (newNode.$tag === 'input' && newAttrs.type) { //} && newAttrs.type !== oldAttrs.type) { // benchmark extra test
    el.setAttribute('type', newAttrs.type);
  }
  for (attr in newAttrs) {
    // value is kept in the loop as it may be a function,
    // with value.call() being used in the event handler
    const value = newAttrs[attr];
    if (attr[0] === 'o' && attr[1] === 'n') {
      if (value !== oldAttrs[attr]) {
        //const captured = value;
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
    } else if (attr[0] !== '$' && (attr !== 'type' || newNode.$tag !== 'input') && attr !== 'is' && attr !== 'xmlns') {
      valueType = typeof value;
      if (valueType === 'string' || valueType === 'number') {
        if (attr === 'value') {
          if (value !== oldAttrs[attr]) el.value = value;
        } else if (value !== oldAttrs[attr]) {
          el.setAttribute(attr, value + '');
        }
      } else if (value === true) {
        if (oldAttrs[attr] !== true) el.setAttribute(attr, attr);
      } else if (!value) {
        if (oldAttrs[attr]) el.removeAttribute(attr);
      } else if (attr === 'style') {
        if (typeof oldAttrs.style === 'string') {
          el.removeAttribute('style');
        } else {
          for (const oldAttr in (oldAttrs.style || ALWAYS_EMPTY_OBJECT)) {
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
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.$tag] || xmlns;
    vNode.el = xmlns 
      ? document.createElementNS(xmlns, vNode.$tag, vNode.attrs.is ? {is: vNode.attrs.is} : null)
      : document.createElement(vNode.$tag, vNode.attrs.is ? {is: vNode.attrs.is} : null);
    _setElAttributes(vNode);
    //for(const child of vNode.nodes) {
    for(let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.el, vNode.nodes[i], xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_TEXT) {
    vNode = vNode as VNodeText;
    vNode.el = document.createTextNode(vNode.$tag);
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_COMP) {
    vNode.up = parentNode;
    if (vNode.$def.init) vNode.$def.init(vNode);
    vNode.nodes = _flatten(vNode.$def.draw(vNode));
    if (vNode.$tag & FLAG_HAS_LIFECYCLE) {
      for (let current = vNode; current && !current.$h; current = current.up) {
        current.$h = true;
      }
    }
    if (vNode.attrs.to) {
      if(DEBUG && !(vNode.attrs.to instanceof Element)) {
        throw new Error('For components that act as portals, "to" attribute must be an Element');
      }
      vNode.el = document.createComment('');
      parentEl.insertBefore(vNode.el, null);
      //for(const child of vNode.nodes) {
    }
    for(let i = 0; i < vNode.nodes.length; i++) {
      _create(vNode, vNode.attrs.to || parentEl, vNode.nodes[i], xmlns);
    }
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if (vNode.$def.drawn) vNode.$def.drawn(vNode, true);
  } else if (vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};

const _redrawComponent = (vNode: VNodeComp, parentEl: Element, xmlns?: string): void => {
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

const _unmount = (nodes: VNodeAnyOrArray): void => {
  if (!Array.isArray(nodes)) {
    _unmountReusableArray[0] = nodes;
    nodes = _unmountReusableArray;
  }
  //let node;
  for(let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.is === VNODE_COMP) {
      if ((node.$tag & FLAG_HAS_REMOVE) || node.$def.remove) {
        if (!(node.$tag & FLAG_REMOVE_CALLED)) {
          node.$def.remove(node);
        }
      }
      if ((node.$tag & FLAG_HAS_REMOVED) || node.$def.removed) {
        node.$def.removed(node);
      }
    }
    if (node.$h && node.nodes.length) {
      _unmount(node.nodes);
      node.nodes = null;
    }
    node.attrs = node.nodes = node.$tag = node.$def = node.el = node.up = null;
  }
};

const _detach = (vNode: VNodeAny): void => {
  if (vNode.is === VNODE_COMP) {
    for (let i = 0; i < vNode.nodes.length; i++) {
      _detach(vNode.nodes[i]);
    }
    if (vNode.attrs.to && vNode.el) vNode.el.remove();
  } else if (vNode.el) {
    vNode.el.remove();
  }
};

const _destroy = (vNode: VNodeAny): void => {
  _detach(vNode);
  _unmount(vNode);
};

const _remove = (vNode: VNodeAny): boolean => {
  if (vNode.is === VNODE_COMP) {
    if (vNode.$tag & FLAG_HAS_REMOVE || vNode.$def.remove) {
      if ((vNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
        return false;
      }
      // Mark _remove() as called before calling it
      (vNode as VNodeComp).$tag |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
      const deferred = vNode.$def.remove(vNode);
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
          if ((vNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
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
  const hasAttrs = first && typeof first === 'object' && !Array.isArray(first) && !('$tag' in first);
  return {
    is: VNODE_ELEM,
    $tag: tag,                    // string: element name
    $def: null,                   // always null for elem
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
    $tag: FLAG_IS_DEFINED
      | (componentDefinition.remove ? FLAG_HAS_REMOVE : 0)
      | (componentDefinition.removed ? FLAG_HAS_REMOVED : 0)
      | (componentDefinition.remove || componentDefinition.removed ? FLAG_HAS_LIFECYCLE : 0),
    ...componentDefinition,
  });
}

export const comp = (componentDefinition: VNodeCompDefinition, attrs: VNodeCompAttributes = ALWAYS_EMPTY_OBJECT): VNodeComp => {
  return {
    is: VNODE_COMP,
    $tag: componentDefinition.$tag || 0,  // number: flags
    $def: componentDefinition,           // object: component definition
    attrs: DEBUG ? attrs === ALWAYS_EMPTY_OBJECT ? attrs : Object.freeze(attrs) : attrs,
    nodes: ALWAYS_EMPTY_ARRAY,
    up: null,
    el: null,
  };
};

export const node = (el: Element): VNodeNode => {
  return {
    is: VNODE_NODE,
    $tag: el.nodeName.toLowerCase(),    // string: element name
    $def: null,                          // always null for node
    attrs: null,
    nodes: null,
    up: null,
    el,
  };
};

const RootWrapper = compDef({
  draw: (vNode) => vNode.attrs.$nodes,
});

export const bind = (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeComp => {
  if (DEBUG && el == null) throw new Error('mount');
  const rootComp = boundNodes.get(el) || comp(RootWrapper);
  rootComp.attrs = { $nodes: vNodeAnyOrArray };
  boundNodes.set(rootComp.el = el, rootComp);
  draw(rootComp);
  sync();
  return rootComp;
};

// ----------------------------------------
// Additional exports
// ----------------------------------------

export { ns };