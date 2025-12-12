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
// We use insertBefore(child, null)???

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
  VNODE_ROOT,
  VNODE_ELEM,
  VNODE_TEXT,
  VNODE_COMP,
  VNODE_NODE,
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

// ----------------------------------------
// For Queue
// ----------------------------------------

let scheduled;

// ----------------------------------------
// Bitwise flags
// ----------------------------------------

const FLAG_STALE = 1; // component needs redraw
const FLAG_REMOVED = 2; // component being removed
const FLAG_REMOVE_CALLED = 4; // component.remove() called

// ----------------------------------------
// Internal state
// ----------------------------------------

const DEBUG = window.DEBUG ?? false;
const mountedNodes = new Map();
const redrawQueue = new Set();

// ----------------------------------------
// Namespaces
// ----------------------------------------

const ns = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

// Used on nodes with no attrs to avoid
// creating new objects, minizes memory use
const EMPTY_OBJECT = DEBUG ? Object.freeze({}) : {};
const slice = Array.prototype.slice;

// Microtask batching
const scheduleRedraw = (vNode: VNodeComp) => {
  let root;
  for(root = vNode; root.up; root = root.up);
  if (root) {
    // Mark this component and all ancestors as stale
    for (let current: VNodeAny = vNode; current; current = current.up) {
      if (current.is === VNODE_COMP) {
        // Already stale, ancestors must be too
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
        if (active) (active as HTMLElement).focus();
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

//const oneNodeArr = [];

// Faster?
//const flatten = (nodes: VNodeAnyOrArray, arr: VNodeFlatArray = []): VNodeFlatArray => {
//  if(!Array.isArray(nodes)) {
//    oneChildArr[0] = nodes;
//    nodes = oneChildArr;
//  }
//  for (const child of nodes) {
//    if (Array.isArray(child)) {
//      flatten(child, arr);
//    } else if (child != null && child !== false && child !== true) {
//      if (child.is) {
//        if (arr.$keys === undefined) {
//          arr.$keys = (child.is === VNODE_ELEM || child.is === VNODE_COMP) && child.attrs && 'key' in child.attrs;
//        } else if (child.attrs && arr.$keys !== ('key' in child.attrs)) {
//          throw new Error('keys');
//        }
//        arr.push(child);
//      //} else if (nodeType === 'string' || nodeType === 'number' || nodeType === 'bigint') {
//      } else {
//        arr.push({ is: VNODE_TEXT, tag: typeof child === 'string' ? child : child + '' });
//      }
//    }
//  }
//  return arr;
//};

const flatten = (nodes: VNodeAnyOrArray, arr: VNodeFlatArray = []): VNodeFlatArray => {
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (Array.isArray(node)) {
      flatten(node, arr);
    } else if (node != null && node !== false && node !== true) {
      const hasKey = (node.is === VNODE_ELEM || node.is === VNODE_COMP) && node.attrs && 'key' in node.attrs;
      if (arr.$keys === undefined) arr.$keys = hasKey;
      else if(hasKey !== arr.$keys) {
        throw new Error(DEBUG ? 'Children have mixed keys. Wrap text in elem(\'span\', {key}, "My keyed string.")' : 'keys');
      }
      arr.push(node.is ? node : { is: VNODE_TEXT, tag: typeof node === 'string' ? node : node + '' });
    }
  }
  return arr;
};

const wrapHandler = (vNode, handler) => e => {
  if (handler.call(e.currentTarget, e) === false) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (e.redraw !== false) {
    scheduleRedraw(vNode);
  }
};

const updateNode = (parentNode: VNodeContainer, parentEl: Element, newNode: VNodeAny, oldNode: VNodeAny, xmlns: string, skipMemo?: boolean): void => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    newNode.up = oldNode.up;

    // Clear removal flag if updating a vnode that was being removed
    if(oldNode.is === VNODE_COMP && (oldNode as VNodeComp).f & FLAG_REMOVED) {
      (oldNode as VNodeComp).f &= ~FLAG_REMOVED;
    }

    if (newNodeType === oldNode.is) {
      if(newNodeType === VNODE_ELEM) {
        if(newNode.tag !== oldNode.tag) {
          createNode(parentNode, parentEl, newNode);
          removeNode(oldNode);
        } else {
          newNode.el = oldNode.el as Element;
          newNode.events = oldNode.events;
          setElAttributes(newNode, oldNode);
          updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes, xmlns);
        }
      } else if(newNodeType === VNODE_TEXT) {
        newNode.el = oldNode.el;
        newNode.el.textContent = newNode.tag;
      } else if(newNodeType === VNODE_COMP) {
        if (newNode.tag !== oldNode.tag) {
          createNode(parentNode, parentEl, newNode, xmlns);
          removeNode(oldNode);
        } else {
          newNode.el = oldNode.el as Element;
          newNode.nodes = (oldNode as VNodeComp).nodes;
          if(
            !skipMemo
            // AND not marked stale
            && !((oldNode as VNodeComp).f & FLAG_STALE)
            // AND has memo function
            && newNode.tag.memo
            // AND props unchanged
            && (newNode.tag.memo === true ? shallowEqual : newNode.tag.memo)(newNode.attrs, oldNode.attrs)
          ) {
            // Skip redraw - component unchanged
            newNode.f = (oldNode as VNodeComp).f;
          } else {
            // Props changed or stale - redraw component
            newNode.f = (oldNode as VNodeComp).f & ~FLAG_STALE;
            redrawComponent(newNode, parentEl, xmlns);
          }
        }
      } else if(newNodeType === VNODE_NODE) {
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

const updateNodes = (parentNode: VNodeContainer, parentEl: Element, newNodes:VNodeFlatArray, oldNodes:VNodeFlatArray, xmlns?: string): void => {
  const newNodesLength = newNodes.length;
  const oldNodesLength = oldNodes.length;
  
  if(newNodesLength > 0) {
    let oldNode;
    let newNode;
    let needsReconcile;
    let mergedIndex = 0;
    let expectedNext = null;
    if(oldNodesLength > 0) {

      // Determine if nodes require reconciling
      if(newNodes.$keys && oldNodes.$keys) {

        needsReconcile = newNodesLength !== oldNodesLength;
        for (let i = 0; !needsReconcile && i < newNodesLength; i++) {
          needsReconcile = newNodes[i].attrs.key !== oldNodes[i].attrs.key;
        }

        if (needsReconcile) {
          const oldPositions = new Map();
          const mergedNodes: VNodeFlatArray = [];
          const movedKeys = new Set();
          
          for(let i = 0; i < oldNodesLength; i++) {
            oldPositions.set(oldNodes[i].attrs.key, i);
          }
          
          for(newNode of newNodes) {
            const key = newNode.attrs.key;
            const oldPos = oldPositions.get(key);
            
            if(oldPos !== undefined) {
              oldNode = oldNodes[oldPos];
              oldPositions.delete(key);
              
              if(oldPos !== mergedIndex) {
                movedKeys.add(key);
              }
              
              if(newNode.is === VNODE_COMP) {
                if(newNode.attrs.$remove) {
                  // Deferred removal case
                  if((oldNode as VNodeComp).f & FLAG_REMOVED || removeNode(oldNode) === false) {
                    oldNode.up = parentNode;
                    mergedNodes.push(oldNode);
                    mergedIndex++;
                  }
                } else {
                  // Normal component update
                  if((oldNode as VNodeComp).f & FLAG_REMOVED) {
                    (oldNode as VNodeComp).f &= ~FLAG_REMOVED;
                  }
                  
                  // Early memo check avoids a potential call
                  // to updateNode, improving speef
                  if(newNode.tag === oldNode.tag 
                    && !((oldNode as VNodeComp).f & FLAG_STALE)
                    && newNode.tag.memo
                    && (newNode.tag.memo === true ? shallowEqual : newNode.tag.memo)(newNode.attrs, oldNode.attrs)
                  ) {
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
            } else if(!newNode.attrs.$remove) {
              movedKeys.add(key);
              createNode(parentNode, parentEl, newNode, xmlns);
              mergedNodes.push(newNode);
              mergedIndex++;
            }
          }

          for(const pos of oldPositions.values()) {
            removeNode(oldNodes[pos]);
          }
          
          newNodes = mergedNodes;
          newNodes.$keys = true;
          
          // Only reorder if something actually moved
          if (movedKeys.size > 0) {
            let expectedNext = null;
            for (let i = newNodes.length - 1; i >= 0; i--) {
              newNode = newNodes[i];
              if (newNode.el) {
                if (movedKeys.has(newNode.attrs.key) && newNode.el.nextSibling !== expectedNext) {
                  parentEl.insertBefore(newNode.el, expectedNext);
                }
                expectedNext = newNode.el;
              }
            }
          }
        } else {
          // Fast path: same order, just update in place
          for (let i = 0; i < newNodesLength; i++) {
            updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
          }
          
          // Remove any extra old nodes
          for (let i = newNodesLength; i < oldNodesLength; i++) {
            removeNode(oldNodes[i]);
          }
        }
      } else {
        // Non-keyed path
        //const reusedEls = new Set();
        //
        //for(let i = newNodesLength; i < oldNodesLength; i++) {
        //  oldNode = oldNodes[i];
        //  if(removeVNode(oldNode) === false) {
        //    oldNode.up = parentNode;
        //    //oldNode.root = parentNode.root;
        //    newNodes[i] = oldNode;
        //  }
        //}
        //
        //for(let i = 0; i < newNodesLength; i++) {
        //  oldNode = oldNodes[i];
        //  newNode = newNodes[i];
        //  if(oldNode && oldNode.el && !reusedEls.has(oldNode.el) && (oldNode.is !== VNODE_COMP || ((oldNode as VNodeComp).f & FLAG_REMOVED) === 0)) {
        //    updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
        //  } else {
        //    createVNode(parentNode, parentEl, newNode, xmlns);
        //  }
        //  reusedEls.add(newNode.el);
        //}
        
        for(let i = newNodesLength; i < oldNodesLength; i++) {
          oldNode = oldNodes[i];
          if(removeNode(oldNode) === false) {
            oldNode.up = parentNode;
            newNodes[i] = oldNode;
          }
        }
        
        for(let i = 0; i < newNodesLength; i++) {
          oldNode = oldNodes[i];
          newNode = newNodes[i];
          if(oldNode && oldNode.el && (oldNode.is !== VNODE_COMP || !((oldNode as VNodeComp).f & FLAG_REMOVED))) {
            updateNode(parentNode, parentEl, newNode, oldNode, xmlns);
          } else {
            createNode(parentNode, parentEl, newNode, xmlns);
          }
        }
      }
    } else {
      for(newNode of newNodes) {
        createNode(parentNode, parentEl, newNode, xmlns);
      }
    }
  } else {
    parentEl.textContent = '';
    for(const oldNode of oldNodes) {
      unmountNode(oldNode, true);
    }
  }
  parentNode.nodes = newNodes;
};

const setElAttributes = (newNode: VNodeElem, oldNode?: VNodeElem): void => {
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  const oldAttrs = oldNode ? oldNode.attrs : EMPTY_OBJECT;
  // ensure <input> has a type before additional attribute manipulation
  if (newNode.tag === 'input' && typeof newAttrs.type === 'string') {
    el.setAttribute('type', newAttrs.type);
  }
  for (const attr in newAttrs) {
    if (attr[0] === 'o' && attr[1] === 'n') {
      if(typeof newAttrs[attr] === 'function') {
        newNode.events = true;
        el[attr] = wrapHandler(newNode, newAttrs[attr]);
      } else {
        el[attr] = null;
      }
    } else if (attr === 'type' || attr === 'key' || attr === 'is' || attr === 'xmlns') {

    } else if (!(attr in oldAttrs) || newAttrs[attr] !== oldAttrs[attr]) {
      const value = newAttrs[attr] === true ? attr : newAttrs[attr];
      const valueType = typeof value;
      
      if (valueType === 'string' || valueType === 'number') {
        if (attr === 'value') {
          const valueStr = value + '';
          if (el.value !== valueStr) el.value = valueStr;
        } else {
          el.setAttribute(attr, value + '');
        }
      } else if (!value) {
        el.removeAttribute(attr);
      } else if (valueType === 'object') {
        Object.assign(el[attr], value);
      }
    }
  }
  for (const attr in oldAttrs) {
    if (!(attr in newAttrs)) {
      if (attr[0] === 'o' && attr[1] === 'n') {
        el[attr] = null;
      } else {
        el.removeAttribute(attr);
      }
    }
  }
};

const createNode = (parentNode: VNodeContainer, parentEl: Element, vNode: VNodeAny, xmlns?: string): void => {
  if(vNode.is === VNODE_ELEM) {
    vNode.up = parentNode;
    xmlns = vNode.attrs && vNode.attrs.xmlns || ns[vNode.tag] || xmlns;
    vNode.el = xmlns 
      ? document.createElementNS(xmlns, vNode.tag, vNode.attrs.is ? {is: vNode.attrs.is} : null)
      : document.createElement(vNode.tag, vNode.attrs.is ? {is: vNode.attrs.is} : null);
    setElAttributes(vNode);
    for(const child of vNode.nodes) {
      createNode(vNode, vNode.el, child, xmlns);
    }
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_TEXT) {
    vNode = vNode as VNodeText;
    vNode.el = document.createTextNode(vNode.tag);
    parentEl.insertBefore(vNode.el, null);
  } else if(vNode.is === VNODE_COMP) {
    vNode.up = parentNode;
    if (vNode.tag.init) vNode.tag.init(vNode);
    vNode.nodes = flatten(vNode.tag.draw(vNode));
    const drawToEl = typeof vNode.tag.drawTo === 'function' ? vNode.tag.drawTo(vNode) : parentEl;
    if (drawToEl !== parentEl) {
      vNode.el = document.createComment();
      parentEl.insertBefore(vNode.el, null);
    }
    for(const child of vNode.nodes) {
      createNode(vNode, drawToEl, child, xmlns);
    }
    if(!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if(vNode.tag.drawn) vNode.tag.drawn(vNode, true);
  } else if(vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};

const redrawComponent = (vNode: VNodeComp, parentEl: Element, xmlns: string): void => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.tag.draw(vNode, vNode.nodes);
  if (newChildren !== oldChildren) {
    updateNodes(vNode, parentEl, flatten(newChildren), oldChildren, xmlns);
    if(!vNode.el || vNode.el.nodeType !== 8) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    oldChildren.length = 0;
  }
  if(vNode.tag.drawn) vNode.tag.drawn(vNode);
};

const unmountNode = (vNode: VNodeAny, detached?: boolean): void => {
  if(vNode.is === VNODE_ELEM) {
    if(!detached && vNode.events) {
      for(const attr in vNode.attrs) {
        if (attr[0] === 'o' && attr[1] === 'n') vNode.el[attr] = null;
      }
    }
    vNode.attrs = null;
  } else if(vNode.is === VNODE_COMP) {
    // Only call remove() if not already called
    if(vNode.tag.remove && !(vNode.f & FLAG_REMOVE_CALLED)) {
      vNode.f |= FLAG_REMOVE_CALLED;
      vNode.tag.remove(vNode);
    }
    // Always call removed()
    if(vNode.tag.removed) vNode.tag.removed(vNode);
    vNode.attrs = null;
  }
  // Common child iteration (works for types elem, comp, and root)
  if(vNode.nodes) {
    for(const child of vNode.nodes) {
      unmountNode(child, true);
    }
    vNode.nodes = null;
  }
  
  vNode.tag = vNode.el = vNode.up = null;
};

const destroyNode = (vNode: VNodeAny): void => {
  if(vNode.el) vNode.el.remove();
  unmountNode(vNode, true);
};

const removeNode = (vNode: VNodeAny): boolean => {
  if(vNode.is === VNODE_COMP) {
    if(typeof vNode.tag.remove === 'function') {
      if((vNode as VNodeComp).f & FLAG_REMOVED) {
        return false;
      }
      // Mark remove() as called before calling it
      (vNode as VNodeComp).f |= FLAG_REMOVE_CALLED | FLAG_REMOVED;
      const deferred = vNode.tag.remove(vNode);
      if(deferred && deferred.then) {
        if(DEBUG && !('key' in vNode.attrs)) {
          throw new Error(
            'Component remove() returned a Promise but component has no key attribute.\n' +
            'Deferred removal requires a key to track the component during exit.\n' +
            'Add a key and use $remove flag. Example:\n' +
            'comp(MyComponent, { key: item.id, $remove: item.deleted })'
          );
        }
        const destroy = () => {
          if((vNode as VNodeComp).f & FLAG_REMOVED) {
            const parent = vNode.up;
            if(DEBUG && !parent) {
              console.warn(
                'Promise resolved but component was already removed.',
                'This usually means the component was removed without using $remove attribute.'
              );
              return;
            }
            if(parent) parent.nodes.splice(parent.nodes.indexOf(vNode), 1);
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

// ----------------------------------------
// VNode creation
// ----------------------------------------

export const draw = scheduleRedraw;

export const elem: {
    (tag: string): VNodeElem
    (tag: string, attrs:VNodeElemAttributes, ...args:VNodeArray): VNodeElem
    (tag: string, ...args:VNodeArray): VNodeElem;
} = function(tag: string): VNodeElem {
  const first = arguments[1];
  const hasAttrs = first && typeof first === 'object' && !first.tag && !Array.isArray(first);
  return {
    is: VNODE_ELEM,
    tag,
    attrs: hasAttrs ? DEBUG ? Object.freeze(first) : first : EMPTY_OBJECT,
    nodes: flatten(slice.call(arguments, hasAttrs ? 2 : 1)),
    //el: null,
    //parent: null,
    //events: null,
  } as VNodeElem;
};

export const comp = (componentDefinition: VNodeCompDefinition, attrs?: VNodeCompAttributes): VNodeComp => {
  return {
    is: VNODE_COMP,
    tag: componentDefinition,
    attrs: attrs ? DEBUG ? Object.freeze(attrs) : attrs : EMPTY_OBJECT,
    nodes: null,
    //el: null,
    //parent: null,
    f: 0, // flags
  };
};

export const node = (el: Element): VNodeNode => {
  return {
    is: VNODE_NODE,
    tag: el.nodeName.toLowerCase(),
    attrs: EMPTY_OBJECT,
    el,
  };
};

export const mount = (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeElem => {
  if(DEBUG && el == null) throw new Error('mount');
  // nesting would all a lot of complexity to zenith
  for(let ancestor = el.parentNode; ancestor; ancestor = ancestor.parentNode) {
    if(mountedNodes.get(ancestor)) throw new Error('nested');
  }

  // wrapping the node allows access to its previous nodes
  const mountedNode = mountedNodes.get(el) || mountedNodes.set(el, {
    is: VNODE_ROOT,
    tag: el.nodeName.toLowerCase(),
    attrs: EMPTY_OBJECT,
    el,
    nodes: [],
  }).get(el);

  const active = document.activeElement;

  sync();

  if(vNodeAnyOrArray == null || (vNodeAnyOrArray as VNodeArray).length === 0) {
    el.textContent = '';
    unmountNode(mountedNode, true);
    mountedNodes.delete(el);
  } else {
    updateNodes(mountedNode, el, flatten(vNodeAnyOrArray), mountedNode.nodes);
  }
  if (active) (active as HTMLElement).focus();
  return mountedNode;
};

// ----------------------------------------
// Flush pending updates
// ----------------------------------------
// Flushes the microtask queue to apply
// pending updates immediately.
// ----------------------------------------

export const sync = (): void => {
  if (scheduled) {
    scheduled = false;
    const active = document.activeElement;
    for (const rootNode of redrawQueue) {
      if (mountedNodes.has(rootNode.el)) {
        updateNodes(rootNode, rootNode.el, rootNode.nodes, rootNode.nodes);
      }
    }
    redrawQueue.clear();
    if (active) (active as HTMLElement).focus();
  }
};

// ----------------------------------------
// Exported constants
// ----------------------------------------

export const elemType = VNODE_ELEM;
export const textType = VNODE_TEXT;
export const compType = VNODE_COMP;
export const nodeType = VNODE_NODE;

export { ns };