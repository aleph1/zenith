// ----------------------------------------
// WORKFLOW
// ----------------------------------------
// Creating vnodes:
// 
// Component lifecycle:
// - init (called once on vnode creation)
// - draw
// - drawn
// - tick
// - remove
// - destroy

// ----------------------------------------
// GLOBALS
// ----------------------------------------

declare global {
  // used to specify debug or production build
  // eslint-disable-next-line
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

// ----------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------

import {
  //DrawModes,
  VNodeTypes,
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeHTML,
  VNodeNode,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeDom,
  VNodeDrawable,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeNodeAttributes,
  VNodeContainer,
  VNodeRoot,
} from './vnode.defs';

//import {
//  grow,
//  pools,
//  poolSizes
//} from './pool';

// ----------------------------------------
// CONSTANTS
// ----------------------------------------

//let drawMode = DrawModes.raf;
let tickCount = 0;
//let keepCount = 0;

const mountedNodes = new Map();
const tickQueue = new Map();
//const propSetters = {};

// for createElementNS calls
const ELEMENT_NAMESPACES = Object.freeze({
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
});

const ELEMENT_CLONERS = {};

// used on elements with no attrs to avoid creating new objects
const FROZEN_EMPTY_OBJECT = Object.freeze({});

// used to queue component updates when drawMode is DRAW_MODE_RAF
//const redrawableUpdateQueue = new Map();

//const keepVNodes: Map<number, VNodeAny> = new Map();

const normalizeChildren = (children:VNodeArray): VNodeFlatArray => {
  const normalizedChildren:VNodeFlatArray = children.flat(Infinity) as VNodeFlatArray;
  const firstChild = normalizedChildren[0];
  const isKeyed = firstChild != null && typeof firstChild !== 'boolean' && (firstChild.type === VNodeTypes.elem || firstChild.type === VNodeTypes.comp) && 'key' in firstChild.attrs;
  for(const [index, child] of normalizedChildren.entries()) {
    // convert all falsy children to null
    // if (!child || child as unknown as boolean === true) {
    if (child == null || typeof child === 'boolean') {
      normalizedChildren[index] = null;
    } else {
      if((child.type === VNodeTypes.elem || child.type === VNodeTypes.comp) && isKeyed !== 'key' in child.attrs) throw new Error('children mixed keys');
    }
  }
  return normalizedChildren;
};

//const getClosestElementNamespace = (dom:Element): string | undefined => {
//  return dom.closest(ELEMENT_NAMESPACES[(dom.closest(ELEMENT_NAMESPACES_QUERY) || dom).nodeName.toLowerCase()]);
//};

const getNamespace = (vNode:VNodeElem, ns:string | undefined): string | undefined => {
  return vNode.attrs && vNode.attrs.xmlns || ELEMENT_NAMESPACES[vNode.tag] || ns;
};

const getChildrenDoms = (children: VNodeFlatArray): Array<ChildNode> => {
  const doms = [];
  for(const child of children) {
    if(child == null) continue;
    if(child.type === VNodeTypes.comp || child.type === VNodeTypes.html) {
      for(const dom of child.doms) doms.push(dom)
    } else doms.push(child.dom);
  }
  return doms;
};

// cloning elements is faster than creating them in most browsers:
// https://www.measurethat.net/Benchmarks/Show/25003/0/create-versus-clone-element
const getElement = (name:string, ns?:string, is?:string): Element => {
  const fullName = name + ':' + (ns || '') + ':' + (is || '');
  return (ELEMENT_CLONERS[fullName] || (ELEMENT_CLONERS[fullName] = ns ? document.createElementNS(ns, name, is ? {is} : null) : document.createElement(name, is ? {is} : null))).cloneNode();
};

//const getNextSibling = (vNodes: VNodeFlatArray, start: number, end: number): Element | null => {
//  while(start < end) {
//    if (vNodes[start] != null && vNodes[start].dom != null) return vNodes[start].dom as Element;
//    start++;
//  }
//};

const insertElements = (parentDom: Element, elements:Array<ChildNode | Element | Text>): void => {
  for(const element of elements) {
    if (element) parentDom.appendChild(element);
  }
};

const insertElement = (parentDom: Element, element: ChildNode | Element | Text): void => {
  parentDom.appendChild(element);
};

const updateChild = (parentNode: VNodeContainer, parentDom: Element, newVNode: VNodeAny, oldVNode: VNodeAny, ns: string): void => {
  if (oldVNode != null && oldVNode.dom != null) {
    newVNode.parent = oldVNode.parent;
    newVNode.root = oldVNode.root;
    const newVNodeType = newVNode.type;
    const oldVNodeType = oldVNode.type;
    if (newVNodeType === oldVNodeType) {
      // *** should we reenable .diff check?
      //if ((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
        switch(newVNodeType) {
          case VNodeTypes.elem:
            if(newVNode.tag !== oldVNode.tag) {
              // we don't pass the namespace in case the node type
              // node type has changed (xhtml, svg, math, etc.)
              createVNode(parentNode, parentDom, newVNode);//, ns);
              removeVNode(parentNode, oldVNode);
            } else {
              updateElement(parentNode, parentDom, newVNode, oldVNode as VNodeElem, ns);
            }
            break;
          case VNodeTypes.text:
            if (newVNode.tag !== oldVNode.tag) {
              newVNode.dom = document.createTextNode(newVNode.tag);
              insertElement(parentDom, newVNode.dom);
              oldVNode.dom.remove();
            } else {
              newVNode.dom = (oldVNode as VNodeText).dom;
            }
            break;
          case VNodeTypes.comp:
            if (newVNode.tag !== oldVNode.tag) {
              removeVNode(parentNode, oldVNode);
              createVNode(parentNode, parentDom, newVNode, ns);
            } else {
              newVNode.dom = oldVNode.dom as Element;
              //*** needed for memory leak?
              //oldVNode.dom = undefined;
              newVNode.doms = (oldVNode as VNodeComp).doms;
              newVNode.children = (oldVNode as VNodeComp).children;
              updateComponent(parentNode, parentDom, newVNode, ns);
            }
            break;
          case VNodeTypes.html:
            if (newVNode.tag !== oldVNode.tag) {
              createVNode(parentNode, parentDom, newVNode, ns);
              removeVNode(parentNode, oldVNode);
            } else {
              newVNode.dom = (oldVNode as VNodeHTML).dom;
              newVNode.doms = (oldVNode as VNodeHTML).doms;
            }
            break;
          case VNodeTypes.node:
            if (newVNode.dom as Element !== oldVNode.dom as Element) {
              insertElement(parentDom, newVNode.dom);
              oldVNode.dom.remove();
            }
        }
      //}
    } else {
      //getNextSibling(parentNode.children, index + 1, parentNode.children.length)
      createVNode(parentNode, parentDom, newVNode, ns);
      removeVNode(parentNode, oldVNode);
    }
  } else {
    //getNextSibling(parentNode.children, index + 1, parentNode.children.length)
    createVNode(parentNode, parentDom, newVNode, ns);
  }
};

const updateChildren = (parentNode: VNodeContainer, parentDom: Element, newChildren:VNodeFlatArray, oldChildren:VNodeFlatArray, ns: string): void => {
  const newChildrenLength = newChildren.length;
  const oldChildrenLength = oldChildren.length;
  if(newChildrenLength > 0) {
    if(oldChildrenLength > 0) {
      let oldChild;
      let newChild;
      const isNewKeyed = newChildren[0] && newChildren[0].attrs && newChildren[0].attrs.key != null;
      const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && oldChildren[0].attrs.key != null;
      // keyed diff
      // 1) get IDs for new children
      // 2) get IDs for old children
      // 3) get IDs for old children
      // 4) iterate through new children IDs and ***
      if(isNewKeyed === true && isOldKeyed === true) {
        const oldChildrenByKey = {};
        const doms = [];
        
        // Build map of old children by key
        for(oldChild of oldChildren) {
          oldChildrenByKey[oldChild.attrs.key] = oldChild;
        }
        
        // Process new children
        for(newChild of newChildren) {
          if(newChild == null) continue;
          
          const key = newChild.attrs.key;
          updateChild(parentNode, parentDom, newChild, oldChildrenByKey[key], ns);
          delete oldChildrenByKey[key];
          
          // Collect doms for insertion
          if(newChild.type === VNodeTypes.comp || newChild.type === VNodeTypes.html) {
            for(const dom of newChild.doms) {
              doms.push(dom);
            }
          } else {
            doms.push(newChild.dom);
          }
        }
        
        // Remove any old children that weren't reused
        for(const key in oldChildrenByKey) {
          removeVNode(parentNode, oldChildrenByKey[key]);
        }
        
        //insertElements(parentDom, doms);

      // non-keyed diff
      // 1) iterate through oldChildren starting at index newChildrenLength
      //    - attempt to remove node
      //    - keep nodes that are being removed in the tree
      // 2) iterate through newChildren starting at 0 up to newChildrenLength
      //    - 
      } else {
        let expectedPrev;
        const reusedDoms = new Set();
        // 1iterate through old nodes and keep any that have been destroyed, but deferred
        for(let i = newChildrenLength; i < oldChildrenLength; i++) {
          oldChild = oldChildren[i];
          // if old node is in the process of being removed, keep it in the tree
          if(removeVNode(parentNode, oldChild) === false) {
            //console.log('node is being removed, keep it in tree');
            //console.log(oldChild.root);
            oldChild.parent = parentNode;
            oldChild.root = parentNode.root;
            newChildren[i] = oldChild;
          }
        }
        // Update/create nodes for new children
        for(let i = 0; i < newChildrenLength; i++) {
          oldChild = oldChildren[i];
          newChild = newChildren[i];
          if(newChild == null) {
            if(oldChild != null && removeVNode(parentNode, oldChild) === false) {
              oldChild.parent = parentNode;
              oldChild.root = parentNode.root;
              newChildren[i] = newChild = oldChild;
              reusedDoms.add(oldChild.dom);
            }
          } else {
            if(oldChild == null || oldChild.dom == null || reusedDoms.has(oldChild.dom)) {
              createVNode(parentNode, parentDom, newChild, ns);
            } else if(oldChild.removed == null) {
              updateChild(parentNode, parentDom, newChild, oldChild, ns);
            }
            reusedDoms.add(newChild.dom);
          }
        }

        // Reorder DOM children to match newChildren order
        for(const newChild of newChildren) {
          if(newChild == null) continue;
          //const childDoms = newChild.type === VNodeTypes.comp || newChild.type === VNodeTypes.html
          //  ? (newChild as VNodeComp | VNodeHTML).doms
          //  : [newChild.dom];
          
          for(const dom of (newChild as VNodeComp | VNodeHTML).doms || [newChild.dom]) {
            // Skip if dom is not in this parent (e.g., manually moved z.node)
            if(!dom || dom.parentElement !== parentDom) continue;
            
            // Only move if this dom is not already positioned correctly after expectedPrev
            const isInCorrectPosition = expectedPrev 
              ? dom.previousSibling === expectedPrev
              : dom === parentDom.firstChild || (dom.parentElement === parentDom && !expectedPrev);
            
            if(!isInCorrectPosition) {
              insertElement(parentDom, dom as Element);
            }
            expectedPrev = dom;
          }
        }
      }
    } else {
      createVNodes(parentNode, parentDom, newChildren, 0, newChildrenLength, ns);
    }
  } else {
    removeVNodes(parentNode, oldChildren, 0, oldChildrenLength);
  }
  parentNode.children = newChildren;
};

const createVNodes = (parentNode: VNodeContainer, parentDom: Element, children: VNodeFlatArray, start: number, end: number, ns: string): void => {
  while(start < end) {
    createVNode(parentNode, parentDom, children[start++], ns);
  }
};

const createVNode = (parentNode: VNodeContainer, parentDom: Element, vNode: VNodeAny, ns?: string): void => {
  //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
  if(vNode == null) return;
  //console.log(parentNode.root)
  vNode.parent = parentNode;
  vNode.root = parentNode.root;
  //let elements;
  switch(vNode.type) {
    case VNodeTypes.elem:
      createElement(parentNode, parentDom, vNode as VNodeElem, ns);
      break;
    case VNodeTypes.text:
      vNode = vNode as VNodeText;
      vNode.dom = document.createTextNode(vNode.tag);
      insertElement(parentDom, vNode.dom);
      break;
    case VNodeTypes.comp:
      createComponent(parentNode, parentDom, vNode as VNodeComp, ns);
      break;
    case VNodeTypes.html:
      createHTML(parentNode, parentDom, vNode as VNodeHTML, ns);
      break;
    case VNodeTypes.node:
      insertElement(parentDom, vNode.dom);
      if(vNode.attrs.tick) tickQueue.set(vNode, vNode.attrs.tick);
  }
};

const setDOMAttribute = (vNode: VNodeElem, attr: string, value: boolean | number | string | object | ((event?: Event) => void)): void => {
  if (attr === 'type' || attr === 'key' || attr === 'is' || attr === 'ns') return;
  if (value == null || value === false) {
    if (attr[0] === 'o' && attr[1] === 'n') {
      vNode.events[attr] = vNode.dom[attr] = null;
    } else {
      vNode.dom.removeAttribute(attr);
    }
  } else if (attr === 'value') {
    (vNode.dom as HTMLInputElement).value = value + '';
  } else if (value === true) {
    vNode.dom.setAttribute(attr, attr);
  } else if (attr[0] === 'o' && attr[1] === 'n') {
    vNode.events[attr] = vNode.dom[attr] = value;
  } else if (Array.isArray(value)) {
    vNode.dom.setAttribute(attr, value.join(' '));
  } else if (typeof value === 'object') {
    Object.assign((vNode.dom as HTMLElement)[attr], value);
  } else {
    vNode.dom.setAttribute(attr, value as string);
  }
};

const createElement = (parentNode: VNodeAny, parentDom: Element, vNode: VNodeElem, ns: string): void => {
  vNode.events = {};
  vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, vNode.attrs.ns || ns), vNode.attrs.is as string);
  if (vNode.attrs.tick) tickQueue.set(vNode, vNode.attrs.tick);
  // ensure <input> has a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) vNode.dom.setAttribute('type', vNode.attrs.type);
  //setDOMAttributes(vNode);
  for(const attr in vNode.attrs) {
    setDOMAttribute(vNode, attr, vNode.attrs[attr]);
  }
  createVNodes(vNode, vNode.dom, vNode.children, 0, vNode.children.length, ns);
  insertElement(parentDom, vNode.dom);
};

const updateElement = (parentNode: VNodeContainer, parentDom: Element, newVNode: VNodeElem, oldVNode: VNodeElem, ns: string): void => {
  newVNode.dom = oldVNode.dom;
  newVNode.events = oldVNode.events;
  // input type must be set before other attributes
  if (newVNode.tag === 'input' && newVNode.attrs.type != null) newVNode.dom.setAttribute('type', newVNode.attrs.type);
  // remove old attrs
  for(const attr in oldVNode.attrs) {
    if (attr[0] === 'o' && attr[1] === 'n') {
      newVNode.events[attr] = newVNode.dom[attr] = null;
    } else if(attr !== 'type') {
      newVNode.dom.removeAttribute(attr);
    }
  }
  //setDOMAttributes(newVNode);
  // set new attributes
  for(const attr in newVNode.attrs) {
    setDOMAttribute(newVNode, attr, newVNode.attrs[attr]);
  }
  updateChildren(newVNode, newVNode.dom, newVNode.children, oldVNode.children, ns);
};

const createComponent = (parentNode: VNodeAny, parentDom: Element, vNode: VNodeComp, ns: string): void => {
  if (vNode.tag.init) vNode.tag.init(vNode);
  const children = vNode.children = drawDrawable(vNode, vNode.tag.draw);
  createVNodes(vNode, parentDom, children, 0, children.length, ns);
  vNode.doms = getChildrenDoms(vNode.children);
  vNode.dom = vNode.doms[0] as Element;
  //insertElements(parentDom, nextSibling, vNode.doms);
  if (vNode.tag.drawn) vNode.tag.drawn(vNode);
  if (vNode.tag.tick) tickQueue.set(vNode, vNode.tag.tick);
};

const updateComponent = (parentNode: VNodeContainer, parentDom: Element, vNode:VNodeComp, ns?: string): void => {
  //if (vNode.tag.drawOnce != null) return;
  updateChildren(vNode, parentDom, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns || vNode.dom.namespaceURI);
  vNode.doms = getChildrenDoms(vNode.children);
  vNode.dom = vNode.doms[0] as Element;
  if(vNode.tag.drawn) vNode.tag.drawn(vNode);
};

const createHTML = (parentNode: VNodeAny, parentDom: Element, vNode: VNodeHTML, ns: string): void => {
  const tmpDom = getElement(parentDom.nodeName, ns);
  tmpDom.innerHTML = vNode.tag;
  vNode.doms = Array.from(tmpDom.childNodes)
  vNode.dom = vNode.doms[0] as Element;
  insertElements(parentDom, vNode.doms);
};

const destroyVNode = (vNode: VNodeAny): void => {
  if(vNode.type === VNodeTypes.comp && vNode.tag.destroy) {
    vNode.tag.destroy(vNode);
  }
  if((vNode as VNodeContainer).children) {
    removeVNodes(vNode, vNode.children, 0, vNode.children.length, true);
    vNode.children.length = 0;
  }
  if((vNode as VNodeComp).doms) {
    for(const childDom of (vNode as VNodeComp).doms) childDom.remove();
  } else if(vNode.dom) {
    vNode.dom.remove();
  }
  delete vNode.dom;
  vNode.root = vNode.parent = null;
};

const removeVNodes = (parentNode: VNodeAny, children:VNodeFlatArray, start: number, end: number, noBeforeDestroy?: boolean): void => {
  while(start < end) {
    removeVNode(parentNode, children[start++], noBeforeDestroy);
  }
};

const removeVNode = (parentNode: VNodeAny, vNode: VNodeAny, immediate?: boolean): boolean => {
  //console.log('removeVNode()');
  if(vNode == null) return;
  switch(vNode.type) {
    case VNodeTypes.elem:
      if(vNode.attrs.tick) tickQueue.delete(vNode);
      break;
    case VNodeTypes.comp:
      if(vNode.tag.tick) tickQueue.delete(vNode);
      if(vNode.removed === true) {
        return false;
      } else if(immediate !== true && typeof vNode.tag.remove === 'function') {
        const delayed = vNode.tag.remove(vNode);
        vNode.removed = true;
        if(delayed != null) {
          if(delayed instanceof Promise) {
            //console.log(vNodeRef);
            const destroy = () => {
              //console.log('destroy callback');
              //console.log(vNodeRef);
              if(vNode) {
                if(vNode.root) vNode.root.redraw = true;
                if(vNode.parent) vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
              }
              destroyVNode(vNode as VNodeComp);
            };
            delayed.then(destroy, destroy);
            return false;
          } else throw new Error('comp.remove: invalid return');
        }
        //if(typeof deferred === 'number' && isFinite(deferred)) {
        //  vNode.remove = true;
        //  setTimeout(() => {
        //    vNode.removed = null;
        //    vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
        //    destroyVNode(vNode as VNodeComp);
        //  }, deferred);
        //}
      }
      break;
    case VNodeTypes.html:
      for(const dom of vNode.doms) {
        dom.remove();
      }
      break;
    case VNodeTypes.node:
      if(vNode.attrs.tick) tickQueue.delete(vNode);
      break;
  }
  destroyVNode(vNode);
  return true;
};

const drawDrawable = (vNode: VNodeDrawable, drawFn: (vNode: VNodeDrawable, oldChildren: VNodeFlatArray) => VNodeAnyOrArray, oldChildren?:VNodeFlatArray) => {
  const children = drawFn(vNode, oldChildren);
  return normalizeChildren(Array.isArray(children) ? children : [children]);
};

// ----------------------------------------
// VNODES
// ----------------------------------------
// All of the following functions are
// designed to create one or more vnodes.
// ----------------------------------------

const text = (value: string | number | bigint): VNodeText => {
  const type = typeof value;
  return {
    type: VNodeTypes.text,
    tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : ''
  };
};

const elem: {
    (selector: string): VNodeElem
    (selector: string, attrs:VNodeElemAttributes, ...args:VNodeArray): VNodeElem
    (selector: string, ...args:VNodeArray): VNodeElem;
} = (selector: string, ...args): VNodeElem => {
  let index = 0;
  let attrs = args[0];
  // if no passed attributes
  if (!attrs || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
    attrs = FROZEN_EMPTY_OBJECT;
  // otherwise, copy attributes
  } else {
    //attrs = Object.freeze(Object.assign({}, attrs));
    attrs = Object.freeze(attrs);
    index++;
  }
  // *** consider implementing object pooling
  return {
    type: VNodeTypes.elem,
    tag: selector,
    attrs,
    children: normalizeChildren(args.slice(index)),
  } as VNodeElem;
};

//const deferUpdateRedrawable = (parentNode: VNodeAny, vNode: VNodeComp) => redrawableUpdateQueue.set(vNode, [parentNode]);

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
const compDef = (inputDef: VNodeCompDefinition): VNodeCompDefinition => {
  if (typeof inputDef.draw !== 'function') throw new Error('compDef: no draw');
  return Object.assign({}, inputDef, {type: VNodeTypes.compDef});
};

// A component should include:
// - optional state (ideally reactive)
// - lifecycle hooks
//   - create: called once upon creation
//   - draw: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
//   - destroy: called once upon destruction
const comp = (componentDefinition: VNodeCompDefinition, attrs?: VNodeCompAttributes): VNodeComp => {
  const vNode:VNodeComp = {
    type: VNodeTypes.comp,
    tag: componentDefinition,
    attrs: attrs ? Object.freeze(attrs) : FROZEN_EMPTY_OBJECT
  };
  vNode.draw = immediate => {
    //if (immediate) updateComponent(vNode.parent, vNode.parent.dom, vNode.dom.getNextSibling(vNode.parent.children, vNode.parent.children.indexOf(vNode) + 1, vNode.parent.children.length), vNode);
    if (immediate) updateComponent(vNode.parent, vNode.parent.dom, vNode);
    else if(vNode.root) {
      // *** add vNode.redraw = true to optimize redraws?
      vNode.root.redraw = true;
    }
  }
  return vNode;
};

const html = (value: string): VNodeHTML => {
  const type = typeof value;
  return {
    type: VNodeTypes.html,
    tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
  };
};

const node = (dom: Element, attrs?: VNodeNodeAttributes): VNodeNode => {
  return {
    type: VNodeTypes.node,
    tag: dom.nodeName.toLowerCase(),
    attrs: attrs || FROZEN_EMPTY_OBJECT,
    dom: dom,
  };
};

const mount = (dom: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeElem => {
  if(dom == null) throw new Error('mount: invalid dom');
  // first check to see if DOM is a child node of a mounted node
  let ancestor = dom.parentNode;
  while(ancestor) {
    if(mountedNodes.get(ancestor)) throw new Error('mount: nested');
    ancestor = ancestor.parentNode;
  }
  // we wrap the node to be able to get its previous vNode children
  const mountedNode = mountedNodes.get(dom) || mountedNodes.set(dom, {
    type: VNodeTypes.root,
    tag: dom.nodeName.toLowerCase(),
    attrs: FROZEN_EMPTY_OBJECT,
    dom: dom,
    children: [],
  }).get(dom);

  if(vNodeAnyOrArray == null || (vNodeAnyOrArray as VNodeArray).length === 0) {
    removeVNodes(mountedNode, mountedNode.children, 0, mountedNode.children.length);
    mountedNode.children.length = 0;
    mountedNodes.delete(dom);
  } else {
    mountedNode.root = mountedNode;
    updateChildren(mountedNode, dom, normalizeChildren(Array.isArray(vNodeAnyOrArray) ? vNodeAnyOrArray : [vNodeAnyOrArray]), mountedNode.children, undefined); // Changed here
  }
  return mountedNode;
};

const tick = (): void => {
  tickCount++;
  for(const [vNode, tick] of tickQueue) {
    tick(vNode, tickCount);
  }
  for(const [dom, vNode] of mountedNodes) {
    if(vNode.redraw === true) {
      // set this first in case a descendant node wants to force the tree to redraw on next tick
      vNode.redraw = false;
      updateChildren(vNode, dom, vNode.children, vNode.children, undefined); // Changed here
    }
  }
  requestAnimationFrame(tick);
};

tick();

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem,
  text,
  comp,
  node,
  html,
  //func,
  compDef,
  mount,
  //diff: {
  //  none: 0,
  //  self: 1,
  //  children: 2,
  //},
  //grow,
  type: Object.freeze({
    none: VNodeTypes.none,
    compDef: VNodeTypes.compDef,
    comp: VNodeTypes.comp,
    elem: VNodeTypes.elem,
    html: VNodeTypes.html,
    node: VNodeTypes.node,
    text: VNodeTypes.text,
  }),
  ns: ELEMENT_NAMESPACES
};