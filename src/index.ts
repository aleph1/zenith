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

const FLAG_IS_DEFINED = 1;     // component from defc()
const FLAG_IS_STALE = 2;       // needs redraw
const FLAG_IS_REMOVING = 4;    // being removed
const FLAG_HAS_LIFECYCLE = 8;  // has remove OR removed (optimization flag)
const FLAG_HAS_REMOVE = 16;    // has remove function
const FLAG_HAS_REMOVED = 32;   // has removed function
const FLAG_REMOVE_CALLED = 64; // remove() called

// ----------------------------------------
// Internal state
// ----------------------------------------

const DEBUG = window.DEBUG ?? false;
const boundNodes = new Map();
const redrawQueue = new Set();

// ----------------------------------------
// Namespaces
// ----------------------------------------

const ns = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

// Used on nodes with no attrs or nodes,
// helping minimize memory use
const EMPTY_ARRAY = DEBUG ? Object.freeze([]) : [];
const EMPTY_OBJECT = DEBUG ? Object.freeze({}) : {};
const EMPTY_MAP = new Map();

const DIFF_NONE = 1;  // Skip everything
const DIFF_SELF = 2;  // Only diff attributes
const DIFF_NODES = 4; // Only diff children
const DIFF_ALL = DIFF_SELF | DIFF_NODES; // default ()
export const DIFF = {
  NONE: DIFF_NONE,
  SELF: DIFF_SELF,
  NODES: DIFF_NODES,
  ALL: DIFF_ALL
};

// ----------------------------------------
// Shallow equality
// with optional keys to skip
// ----------------------------------------

//export const eq = (a: Record<string, any>, b: Record<string, any>): boolean => {
//  let count = 0;
//  for (const k in a) {
//    if (a[k] !== b[k]) return false;
//    count++;
//  }
//  for (const k in b) {
//    count--;
//  }
//  return count === 0;
//};

// ----------------------------------------
// Flush pending updates
// ----------------------------------------
// Flushes the microtask queue to apply
// pending updates immediately.
// ----------------------------------------

export const sync = (): void => {
  if (redrawQueue.size) {
    const active = document.activeElement;
    for (const redrawNode of redrawQueue) {
      const targetEl = boundNodes.has(redrawNode.el) 
        ? redrawNode.el 
        : (redrawNode.attrs && redrawNode.attrs.to) || (redrawNode.up && redrawNode.up.el);
      if (targetEl) {
        _redrawComponent(redrawNode, targetEl);
      }
    }
    redrawQueue.clear();
    if (active) (active as HTMLElement).focus();
  }
};

// Microtask batching
// Reuse current to avoid an additional variable declaration 
export const draw = (vNode: VNodeComp, doSync: boolean = false) => {
  let current;
  for(current = vNode; current.up; current = current.up);
  if (current) {
    redrawQueue.add(current);
    for(current = vNode; current.up; current = current.up) {
      if (current.is === VNODE_COMP) {
        if (current.$tag & FLAG_IS_STALE) break;
        current.$tag |= FLAG_IS_STALE;
      }
    }
    if(doSync) {
      sync();
    } else if(redrawQueue.size === 1) {
      Promise.resolve().then(sync);
    }
  }
};

export const edit = (vNode: VNodeComp) => {
  if(DEBUG && vNode.is !== VNODE_COMP) throw new Error('vNode must be comp() instance')
  vNode.$tag |= FLAG_IS_STALE;
  redrawQueue.add(vNode);
  sync();
}

//export const cull = (parentComponent: VNodeComp, key: string | number): boolean => {
//  const nodes = parentComponent.nodes;
//  if (!nodes || !nodes.$keys) return false;
//  
//  const index = nodes.$keys.get(key);
//  if (index === undefined) return false;
//  
//  const vNode = nodes[index];
//  
//  // Remove from array
//  nodes.splice(index, 1);
//  
//  // Update keys map
//  nodes.$keys.delete(key);
//  for (let i = index; i < nodes.length; i++) {
//    const node = nodes[i];
//    if (node.attrs && node.attrs.$key) {
//      nodes.$keys.set(node.attrs.$key, i);
//    }
//  }
//  
//  // Destroy
//  if(vNode.is === VNODE_COMP) {
//    _remove(vNode);
//  } else {
//    _destroy(vNode);
//  }
//  
//  return true;
//};

// benchmark
const _flattenReusableArray = [];
const _flatten = (nodes: VNodeAnyOrArray, offset: number = 0, arr: VNodeFlatArray = []): VNodeFlatArray => {
  let node;
  if (!(nodes && typeof nodes === 'object' && nodes.length !== undefined)) {
    _flattenReusableArray[0] = nodes;
    nodes = _flattenReusableArray;
  }
  for (offset; offset < nodes.length; offset++) {
    node = nodes[offset];
    if (Array.isArray(node)) {
      _flatten(node, 0, arr);
    } else if(node != null) {
      if(node.is) {
        if (arr.$keys === undefined) {
          arr.$keys = node.attrs && '$key' in node.attrs ? EMPTY_MAP : null;
        } else if ((!arr.$keys) !== !(node.attrs && '$key' in node.attrs)) {
          throw new Error(DEBUG ? 'Children have mixed keys...' : '$keys');
        }
        arr.push(node);
      } else if(node !== true && node !== false) {
        if (arr.$keys === undefined) {
          arr.$keys = null;
        } else if(arr.$keys) {
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

const _updateNode = (parentNode: VNodeContainer, parentEl: Element, newNode: VNodeAny, oldNode: VNodeAny, xmlns: string, skipMemo?: boolean): void => {
  if (oldNode.el) {
    const newNodeType = newNode.is;
    if (newNodeType === oldNode.is) {
      if(newNodeType === VNODE_ELEM) {
        newNode.up = parentNode;
        if(newNode.$tag === oldNode.$tag) {
          newNode.el = oldNode.el as Element;
          
          const diff = newNode.attrs.$diff || DIFF.ALL;
          
          if (diff & DIFF.SELF) {
            _setElAttributes(newNode, oldNode.attrs);
          }
          
          if (diff & DIFF.NODES) {
            _updateNodes(newNode, newNode.el, newNode.nodes, oldNode.nodes, xmlns);
          }
        } else {
          _create(parentNode, parentEl, newNode);
          _remove(oldNode);
        }
      } else if(newNodeType === VNODE_TEXT) {
        newNode.el = oldNode.el;
        if (newNode.$tag !== oldNode.$tag) newNode.el.textContent = newNode.$tag;
        //newNode.el.textContent = newNode.$tag;
      } else if(newNodeType === VNODE_COMP) {
        // Clear removal flag if updating a vnode that was being removed
        if((oldNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
          (oldNode as VNodeComp).$tag &= ~FLAG_IS_REMOVING;
        }
        newNode.up = parentNode;
        if (newNode.$def === oldNode.$def) {
          newNode.el = oldNode.el as Element;
          newNode.nodes = (oldNode as VNodeComp).nodes;
          if(
            !skipMemo
            && !((oldNode as VNodeComp).$tag & FLAG_IS_STALE)
            && newNode.$def.$memo
            && (newNode.$def.$memo === true 
              ? newNode.attrs === oldNode.attrs 
              : newNode.$def.$memo(newNode.attrs, oldNode.attrs))
          ) {
            // Skip redraw - component unchanged
            // Copy flags from old node
          } else {
            // Props changed or stale - redraw component
            newNode.$tag &= ~FLAG_IS_STALE;
            _redrawComponent(newNode, parentEl, xmlns);
          }
        } else {
          _create(parentNode, parentEl, newNode, xmlns);
          _remove(oldNode);
        }
      } else if(newNodeType === VNODE_NODE) {
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
    let needsReconcile;
    let key;
    let oldPos;
    if(oldNodesLength) {

      // Determine if nodes require reconciling
      if(newNodes.$keys && oldNodes.$keys) {

        needsReconcile = newNodesLength !== oldNodesLength;
        for (let i = 0; !needsReconcile && i < newNodesLength; i++) {
          needsReconcile = newNodes[i].attrs.$key !== oldNodes[i].attrs.$key;
        }

        if (needsReconcile) {
          const mergedNodes: VNodeFlatArray = [];
          const movedNodes: VNodeFlatArray = [];
          const newNodesKeys = new Map();
          
          // Build old keys map: Map<key, oldIndex>
          let oldNodesKeys;
          if(oldNodes.$keys === EMPTY_MAP) {
            oldNodesKeys = new Map();
            for(let i = 0; i < oldNodesLength; i++) {
              oldNodesKeys.set(oldNodes[i].attrs.$key, i);
            }
          } else {
            oldNodesKeys = oldNodes.$keys;
          }
          
          // Process all new nodes
          for(let i = 0; i < newNodesLength; i++) {
            newNode = newNodes[i];
            key = newNode.attrs.$key;
            oldPos = oldNodesKeys.get(key);
            
            if(oldPos !== undefined) {
              oldNode = oldNodes[oldPos];
              oldNodesKeys.delete(key); // Mark as matched
              
              let nodeToAdd;
              
              if(newNode.is === VNODE_COMP) {
                if(newNode.attrs.$remove) {
                  if((oldNode as VNodeComp).$tag & FLAG_IS_REMOVING || _remove(oldNode) === false) {
                    oldNode.up = parentNode;
                    nodeToAdd = oldNode;
                  }
                } else {
                  if((oldNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
                    (oldNode as VNodeComp).$tag &= ~FLAG_IS_REMOVING;
                  }
                  
                  if(newNode.$def === oldNode.$def 
                    && !((oldNode as VNodeComp).$tag & FLAG_IS_STALE)
                    && newNode.$def.$memo
                    && (newNode.$def.$memo === true 
                      ? newNode.attrs === oldNode.attrs 
                      : newNode.$def.$memo(newNode.attrs, oldNode.attrs))
                  ) {
                    oldNode.attrs = newNode.attrs;
                    nodeToAdd = oldNode;
                  } else {
                    _updateNode(parentNode, parentEl, newNode, oldNode, xmlns, true);
                    nodeToAdd = newNode;
                  }
                }
              } else {
                _updateNode(parentNode, parentEl, newNode, oldNode, xmlns, true);
                nodeToAdd = newNode;
              }
              
              if(nodeToAdd) {
                mergedNodes.push(nodeToAdd);
                newNodesKeys.set(key, mergedNodes.length - 1);
                
                // Only track as moved if position changed
                if(oldPos !== i) {
                  movedNodes.push(nodeToAdd);
                }
              }
              
            } else if(!newNode.attrs.$remove) {
              _create(parentNode, parentEl, newNode, xmlns);
              newNodesKeys.set(key, mergedNodes.length);
              mergedNodes.push(newNode);
            }
          }
          
          // Remove nodes that weren't matched
          for(const pos of oldNodesKeys.values()) {
            oldNode = oldNodes[pos];
            if(oldNode.is === VNODE_COMP && (oldNode.$tag & FLAG_HAS_LIFECYCLE)) {
              _remove(oldNode);
            } else {
              if(oldNode.is === VNODE_COMP && oldNode.attrs.to) {
                oldNode.attrs.to.textContent = '';
              }
              if(oldNode.el) oldNode.el.remove();
              _unmount(oldNode);
            }
          }
          
          newNodes = mergedNodes;
          newNodes.$keys = newNodesKeys;
          
          // Reorder moved nodes backward
          for (let i = movedNodes.length - 1; i >= 0; i--) {
            oldNode = movedNodes[i];
            newNode = newNodes[newNodesKeys.get(oldNode.attrs.$key) + 1];
            const expectedNext = newNode ? newNode.el : null;
            if (oldNode.el.nextSibling !== expectedNext) {
              parentEl.insertBefore(oldNode.el, expectedNext);
            }
          }
        } else {
          // Fast path: same order, just update in place
          const keysMap = oldNodes.$keys === EMPTY_MAP ? new Map() : oldNodes.$keys;
          // process existing nodes in order
          for (let i = 0; i < newNodesLength; i++) {
            _updateNode(parentNode, parentEl, newNodes[i], oldNodes[i], xmlns);
            keysMap.set(newNodes[i].attrs.$key, i);
          }

          // remove extra old nodes
          for (let i = newNodesLength; i < oldNodesLength; i++) {
            keysMap.delete(oldNodes[i].attrs.$key);
            _remove(oldNodes[i]);
          }

          newNodes.$keys = keysMap;
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
      //for(newNode of newNodes) {
      for(let i = 0; i < newNodes.length; i++) {
        _create(parentNode, parentEl, newNodes[i], xmlns);
      }
    }
    parentNode.nodes = newNodes;
  } else {
    parentEl.textContent = '';
    _unmount(oldNodes);
    parentNode.nodes = newNodes;
  }
};

const _setElAttributes = (newNode: VNodeElem, oldAttrs: VNodeElemAttributes = EMPTY_OBJECT): void => {
  const el = newNode.el;
  const newAttrs = newNode.attrs;
  let attr;
  if (newAttrs !== EMPTY_OBJECT) {
    if (newNode.$tag === 'input' && typeof newAttrs.type === 'string') {
      el.setAttribute('type', newAttrs.type);
    }
    for (attr in newAttrs) {
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
      } else if (attr[0] !== '$' && attr !== 'type' && attr !== 'is' && attr !== 'xmlns') {
        const valueType = typeof value;
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
        } else {
          Object.assign(el[attr], value);
        }
      }
    }
  }
  if(oldAttrs !== EMPTY_OBJECT) {
    for (attr in oldAttrs) {
      if (!(attr in newAttrs)) {
        if (attr[0] === 'o' && attr[1] === 'n') {
          el[attr] = null;
        } else {
          el.removeAttribute(attr);
        }
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
      for(let i = 0; i < vNode.nodes.length; i++) {
        _create(vNode, vNode.attrs.to, vNode.nodes[i], xmlns);
      }
    } else {
      //for(const child of vNode.nodes) {
      for(let i = 0; i < vNode.nodes.length; i++) {
        _create(vNode, parentEl, vNode.nodes[i], xmlns);
      }
      vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    }
    //if(!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
    if(vNode.$def.drawn) vNode.$def.drawn(vNode, true);
  } else if(vNode.is === VNODE_NODE) {
    parentEl.insertBefore(vNode.el, null);
  }
};

const _redrawComponent = (vNode: VNodeComp, parentEl: Element, xmlns?: string): void => {
  const oldChildren = vNode.nodes;
  const newChildren = vNode.$def.draw(vNode, oldChildren);
  if (newChildren !== oldChildren) {
    _updateNodes(vNode, vNode.attrs.to || parentEl, _flatten(newChildren), oldChildren, xmlns);
    if (!vNode.el) vNode.el = vNode.nodes[0] && vNode.nodes[0].el;
  }
  if(vNode.$def.drawn) vNode.$def.drawn(vNode);
};

const _unmountReusableArray = [];

const _unmount = (nodes: VNodeAnyOrArray): void => {
  if(!Array.isArray(nodes)) {
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

const _destroy = (vNode: VNodeAny): void => {
  if (vNode.is === VNODE_COMP && vNode.attrs.to) {
    vNode.attrs.to.textContent = '';
  }
  if(vNode.el) vNode.el.remove();
  _unmount(vNode);
};

const _remove = (vNode: VNodeAny): boolean => {
  if(vNode.is === VNODE_COMP) {
    if(vNode.$tag & FLAG_HAS_REMOVE || vNode.$def.remove) {
      if((vNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
        return false;
      }
      // Mark _remove() as called before calling it
      (vNode as VNodeComp).$tag |= FLAG_REMOVE_CALLED | FLAG_IS_REMOVING;
      const deferred = vNode.$def.remove(vNode);
      if(deferred && deferred.then) {
        if(DEBUG && !('$key' in vNode.attrs)) {
          throw new Error(
            'Component remove() returned a Promise but component has no $key attribute.\n' +
            'Deferred removal requires a key to track the component during exit.\n' +
            'Add a $key and use $remove flag. Example:\n' +
            'comp(MyComponent, { $key: item.id, $remove: item.deleted })'
          );
        }
        const deferredDestroy = () => {
          if((vNode as VNodeComp).$tag & FLAG_IS_REMOVING) {
            const parent = vNode.up;
            if(DEBUG && !parent) {
              console.warn(
                'Promise resolved but component was already removed.',
                'This usually means the component was removed without using $remove attribute.'
              );
              return;
            }
            if(parent) parent.nodes.splice(parent.nodes.indexOf(vNode), 1);
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
  const hasAttrs = first && typeof first === 'object' && !first.is && !Array.isArray(first);
  return {
    is: VNODE_ELEM,
    $tag: tag,                    // string: element name
    $def: null,                   // always null for elem
    attrs: hasAttrs ? DEBUG ? Object.freeze(first) : first : EMPTY_OBJECT,
    nodes: arguments.length > (hasAttrs ? 2 : 1) ? _flatten(arguments, hasAttrs ? 2 : 1) : EMPTY_ARRAY,
    up: null,
    el: null,
  } as VNodeElem;
};

export const defc = (componentDefinition: VNodeCompDefinition): VNodeCompDefinition => {
  if(DEBUG) {
    if(!componentDefinition.draw) {
      throw new Error('Component definition must have a draw function');
    }
    if(typeof componentDefinition.draw !== 'function') {
      throw new Error('draw must be a function');
    }
    if(componentDefinition.init && typeof componentDefinition.init !== 'function') {
      throw new Error('init must be a function');
    }
    if(componentDefinition.drawn && typeof componentDefinition.drawn !== 'function') {
      throw new Error('drawn must be a function');
    }
    if(componentDefinition.remove && typeof componentDefinition.remove !== 'function') {
      throw new Error('remove must be a function');
    }
    if(componentDefinition.removed && typeof componentDefinition.removed !== 'function') {
      throw new Error('removed must be a function');
    }
    if(componentDefinition.$memo !== undefined && 
       typeof componentDefinition.$memo !== 'boolean' && 
       typeof componentDefinition.$memo !== 'function') {
      throw new Error('$memo must be a boolean or function');
    }
  }
  // Only copy known component properties
  return Object.freeze({
    ...componentDefinition,
    $tag: FLAG_IS_DEFINED
      | (componentDefinition.remove ? FLAG_HAS_REMOVE : 0)
      | (componentDefinition.removed ? FLAG_HAS_REMOVED : 0)
      | (componentDefinition.remove || componentDefinition.removed ? FLAG_HAS_LIFECYCLE : 0),
  });
}

export const comp = (componentDefinition: VNodeCompDefinition, attrs: VNodeCompAttributes = EMPTY_OBJECT): VNodeComp => {
  return {
    is: VNODE_COMP,
    $tag: componentDefinition.$tag || 0,  // number: flags
    $def: componentDefinition,           // object: component definition
    attrs: DEBUG ? attrs === EMPTY_OBJECT ? attrs : Object.freeze(attrs) : attrs,
    nodes: EMPTY_ARRAY,
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

const RootWrapper = {
  draw: (vNode) => vNode.nodes.slice(),
};

export const bind = (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeComp => {
  if(DEBUG && el == null) throw new Error('mount');
  const rootComp = boundNodes.get(el) || comp(RootWrapper);
  rootComp.nodes = _flatten(vNodeAnyOrArray);
  boundNodes.set(rootComp.el = el, rootComp);
  draw(rootComp);
  sync();
  return rootComp;
};

// ----------------------------------------
// Additional exports
// ----------------------------------------

export const keep = () => true;

export { ns };