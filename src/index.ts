// ----------------------------------------
// WORKFLOW
// ----------------------------------------
// Creating vnodes:
// 
// Component lifecycle:
// - fn(vNode) (calls constructor function)
// - beforeDraw(vNode)* (not called until component is drawn once)
// - draw(vNode,children,oldChidren?)
// - afterDraw(vNode)*
// - destroy(vNode)
// *note: not implemented

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
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeDom,
  VNodeDrawable,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeContainer
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

// for createElementNS calls
const ELEMENT_NAMESPACES = Object.freeze({
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
});

// for finding namespace for createElement(NS) calls
const ELEMENT_NAMESPACES_QUERY = Object.keys(ELEMENT_NAMESPACES).join(',');

const ELEMENT_CLONERS = {};

// used on elements with no attrs to avoid creating new objects
const FROZEN_EMPTY_OBJECT = Object.freeze({});

// used to queue component updates when drawMode is DRAW_MODE_RAF
const componentUpdateQueue = new Map();
const tickQueue = new Map();

//const keepVNodes: Map<number, VNodeAny> = new Map();

const normalizeChildren = (vNode:VNodeContainer, children:VNodeArray): VNodeFlatArray => {
  const normalizedChildren:VNodeFlatArray = children.flat(Infinity) as VNodeFlatArray;
  const firstChild = normalizedChildren[0];
  const isKeyed = !firstChild || typeof firstChild === 'boolean' || (firstChild.type !== VNodeTypes.elem && firstChild.type !== VNodeTypes.comp) || !Object.prototype.hasOwnProperty.call(firstChild.attrs, 'key') ? false : true;
  for(const [index, child] of normalizedChildren.entries()) {
    // convert all falsy children to null
    if (!child || typeof child === 'boolean') {
      normalizedChildren[index] = null;
    } else {
      if ((child as VNodeComp).type === VNodeTypes.comp || (child as VNodeElem).type === VNodeTypes.elem ) {
        if (isKeyed !== Object.prototype.hasOwnProperty.call((child as VNodeContainer).attrs, 'key')) throw new Error('children must be keyed or keyless');
      }
    }
  }
  return normalizedChildren;
};

const getClosestElementNamespace = (dom:Element): string | undefined => {
  return dom.closest(ELEMENT_NAMESPACES[(dom.closest(ELEMENT_NAMESPACES_QUERY) || dom).nodeName.toLowerCase()]);
};

const getNamespace = (vNode:VNodeElem, ns:string | undefined): string | undefined => {
  return vNode.attrs && vNode.attrs.xmlns || ELEMENT_NAMESPACES[vNode.tag] || ns;
};

// cloning elements is faster than creating them in most browsers:
// https://www.measurethat.net/Benchmarks/Show/25003/0/create-versus-clone-element
const getElement = (name:string, ns?:string, is?:string): Element => {
  const fullName = name + ':' + (ns || '') + ':' + (is || '');
  return (ELEMENT_CLONERS[fullName] || (ELEMENT_CLONERS[fullName] = ns ? document.createElementNS(ns, name, is ? {is} : null) : document.createElement(name, is ? {is} : null))).cloneNode();
};

const updateChild = (parentVNode: VNodeContainer, newVNode: VNodeAny, oldVNode: VNodeAny, ns: string): void => {
  if (oldVNode != null && oldVNode.dom != null) {
    const newVNodeType = newVNode.type;
    const oldVNodeType = oldVNode.type;
    newVNode.parent = parentVNode;
    if (newVNodeType === oldVNodeType) {
      // *** should we reenable .diff check?
      //if ((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
        switch(newVNodeType) {
          case VNodeTypes.elem:
            if(newVNode.tag !== oldVNode.tag) {
              const oldDomIndex = parentVNode.type === VNodeTypes.comp ? (parentVNode as VNodeComp).doms.indexOf(oldVNode.dom as Element) : -1;
              createVNode(parentVNode, newVNode, ns);
              (oldVNode.dom as Element).replaceWith(newVNode.dom as Element);
              removeVNode(parentVNode, oldVNode);
              if(oldDomIndex !== -1) (parentVNode as VNodeComp).doms[oldDomIndex] = newVNode.dom as Element;
            } else {
              newVNode.dom = oldVNode.dom as Element;
              updateElement(parentVNode, newVNode, oldVNode as VNodeElem, ns);
            }
            break;
          case VNodeTypes.text:
            newVNode.dom = (oldVNode as VNodeText).dom;
            if (newVNode.tag !== oldVNode.tag) {
              (newVNode.dom as Text).replaceWith(newVNode.dom = document.createTextNode(newVNode.tag));
            }
            break;
          case VNodeTypes.comp:
            if (newVNode.tag !== oldVNode.tag) {
              removeVNode(parentVNode, oldVNode);
              createVNode(parentVNode, newVNode, ns);
            } else {
              newVNode.dom = oldVNode.dom as Element;
              newVNode.doms = (oldVNode as VNodeComp).doms;
              newVNode.children = (oldVNode as VNodeComp).children;
              updateComponent(parentVNode, newVNode, ns);
            }
            break;
          case VNodeTypes.html:
            if (newVNode.tag !== oldVNode.tag) {
              removeVNode(parentVNode, oldVNode);
              createVNode(parentVNode, newVNode, ns);
            } else {
              newVNode.dom = (oldVNode as VNodeHTML).dom;
              newVNode.doms = (oldVNode as VNodeHTML).doms;
            }
        }
      //}
    } else {
      removeVNode(parentVNode, oldVNode);
      createVNode(parentVNode, newVNode, ns);
    }
  } else {
    createVNode(parentVNode, newVNode, ns);
  }
};

const updateChildren = (parentNode: VNodeContainer, newChildren:VNodeFlatArray, oldChildren:VNodeFlatArray, ns: string): void => {
  const newChildrenLength = newChildren.length;
  // *** in theory updateChildren is always called with an oldChildren array,
  // but we should make sure of this
  //const oldChildrenLength = oldChildren == null ? 0 : oldChildren.length;
  const oldChildrenLength = oldChildren.length;
  if (newChildrenLength > 0) {
    if(oldChildrenLength > 0) {
      let oldChild;
      const doms = [];
      const isNewKeyed = newChildren[0] && newChildren[0].attrs && Object.prototype.hasOwnProperty.call(newChildren[0].attrs, 'key') && newChildren[0].attrs.key != null;
      const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && Object.prototype.hasOwnProperty.call(oldChildren[0].attrs, 'key') && oldChildren[0].attrs.key != null;
      // keyed diff
      // 1) get IDs for new children
      // 2) get IDs for old children
      // 3) get IDs for old children
      // 4) iterate through new children IDs and ***
      if (isNewKeyed && isOldKeyed) {
        //const tempDom = getElement(parentDom.nodeName, ns);
        const newChildrenByKey = {};
        const oldChildrenByKey = {};
        //const oldKeyOrder = [];
        //const newKeyOrder = [];
        //const lisPositions = [0];
        //let lisIndex = 0;
        // get keys for all new children
        //let now = performance.now();
        for(const child of newChildren) {
          //newChildrenByKey[child.attrs.key] = child;
          newChildrenByKey[child.attrs.key as string] = true;
        }
        // get keys for all old children
        for(const child of oldChildren) {
          const key = child.attrs.key as string;
          // when old key is still in use, keep the old node
          if (newChildrenByKey[key]) {
            oldChildrenByKey[key] = child;
            //oldKeyOrder.push(key);
          // otherwise, nullify the node and delete its DOM
          } else {
            // removeNode returns null
            removeVNode(parentNode, child);
            //oldKeyOrder.push(-1);
            delete oldChildrenByKey[key];
          }
        }

        // iterate through new children and diff with old children
        //let index = 0;
        for(const child of newChildren) {
          if(child != null) {
            //child.index = index;
            updateChild(parentNode, child, oldChildrenByKey[child.attrs.key as string], ns);
            doms.push(child.dom);
            (child.dom as Element).remove();
            //if (Array.isArray(child.dom)) {
            //  for(const index in child.dom) {
            //    doms.push(child.dom[index]);
            //    child.dom[index].remove();
            //  }
            //} else {
            //  doms.push(child.dom);
            //  child.dom.remove();
            //}
          }
          //index++;
        }
        insertElements(parentNode.dom as Element, doms);

      // non-keyed diff
      // 1) remove nodes that have an index greater than newChildrenLength
      // 2) loop through the oldChildren and store references to their DOM
      // 3) 
      } else {
        const reusedDoms = new Set();
        //if(oldChildrenLength > newChildrenLength) {
          // iterate through old nodes and keep any that have been destroyed, but deferred
          for(let i = newChildrenLength; i < oldChildrenLength; i++) {
            oldChild = oldChildren[i];
            removeVNode(parentNode, oldChild);
            // if old node is in the process of being removed, keep it in the tree
            if(oldChild.removing === true) {
              oldChild.parent = parentNode;
              newChildren[i] = oldChild;
            }
          }
        //}
        for(let i = 0; i < newChildrenLength; i++ ) {
          oldChild = oldChildren[i];
          if(newChildren[i] == null && oldChild != null) {
            removeVNode(parentNode, oldChild);
            if(oldChild.removing === true) {
              oldChild.parent = parentNode;
              newChildren[i] = oldChild;
              reusedDoms.add(newChildren[i].dom);
            }
          } else if(oldChild == null || oldChild.dom == null || reusedDoms.has(oldChild.dom)) {
            createVNode(parentNode, newChildren[i], ns);
            reusedDoms.add(newChildren[i].dom);
          } else if(oldChild.removing == null) {
            updateChild(parentNode, newChildren[i], oldChild, ns);
            reusedDoms.add(newChildren[i].dom);
          }
        }
      }
    } else {
      createVNodes(parentNode, newChildren, 0, newChildrenLength, ns);
    }
  } else {
    removeVNodes(parentNode, oldChildren, 0, oldChildrenLength);
  }
  parentNode.children = newChildren;
};

const createVNodes = (parentNode: VNodeContainer, children: VNodeFlatArray, start: number, end: number, ns: string): void => {
  while(start < end) {
    createVNode(parentNode, children[start++], ns);
  }
};

const insertElements = (parentDom: Element, index: number, elements:Array<ChildNode | Element | Text>): number => {
  let i = 0;
  let count = 0;
  let element: Element | Text | ChildNode;
  if (index < 0) {
    while(i < elements.length) {
      element = elements[i++];
      if (element) {
        parentDom.appendChild(element);
        count++;
      }
    }
  } else {
    while(i < elements.length) {
      element = elements[i++];
      if (element) {
        if (index > parentDom.childElementCount) parentDom.insertBefore(element, parentDom.childNodes[index]);
        else parentDom.appendChild(element);
        index++;
        count++;
      }
    }
  }
  return count;
};

const createVNode = (parentNode: VNodeAny, vNode: VNodeAny, ns: string, index = 0): number => {
  //console.log('createVNode()');
  //console.log(vNode);
  //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
  let elsAddedToDom = 0;
  if(vNode != null) {
    switch(vNode.type) {
      case VNodeTypes.elem:
        createElement(parentNode, vNode as VNodeElem, ns);
        elsAddedToDom = insertElements(parentNode.dom as Element, index, [vNode.dom]);
        break;
      case VNodeTypes.comp:
        createComponent(parentNode, vNode as VNodeComp, ns);
        elsAddedToDom = insertElements(parentNode.dom as Element, index, [...vNode.dom.childNodes]);
        break;
      case VNodeTypes.text:
        vNode = vNode as VNodeText;
        vNode.dom = document.createTextNode(vNode.tag);
        elsAddedToDom = insertElements(parentNode.dom as Element, index, [vNode.dom]);
        break;
      case VNodeTypes.html:
        createHTML(parentNode, vNode as VNodeHTML, ns);
        elsAddedToDom = insertElements(parentNode.dom as Element, index, vNode.dom);
        break;
    }
  }
  return elsAddedToDom;
};

const createHTML = (parentNode: VNodeAny, vNode: VNodeHTML, ns: string): void => {
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns);
  vNode.dom.innerHTML = vNode.tag;
  vNode.doms = [...vNode.dom.childNodes];
  //vNode.length = vNode.dom.length;
};

const setDOMAttribute = (vNode: VNodeElem, attr: string, newValue: boolean | number | string | ((event?: Event) => void), oldValue: boolean | number | string | ((event?: Event) => void), ns: string): void => {
  // Skip values that are undefined or null
  // this is faster than newValue !== null && newValue !== undefined
  // *** benchmark to prove it
  if (newValue != null && attr !== 'type' && attr !== 'key' && attr !== 'tick') {
    if (attr === 'value') {
      if (vNode.tag === 'input' || vNode.tag === 'textarea') (vNode.dom as HTMLInputElement).value = newValue + '';
    } else if (typeof newValue === 'boolean') {
      if (newValue === true) {
        vNode.dom.setAttribute(attr, attr);
      } else {
        vNode.dom.removeAttribute(attr);
      }
    } else if (attr === 'class') {
      vNode.dom.setAttribute(attr, Array.isArray(newValue) ? newValue.join(' ') : newValue as string);
    // Setting on* handlers using setAttribute does not work,
    // so we need a conditional to detect on*.
    // Benchmark to compare various approaches:
    // https://www.measurethat.net/Benchmarks/Show/19171/0/compare-detecting-object-keys-starting-with-on
    // Array access performs better in most current browsers,
    // however, it might be worth considering a couple of other
    // approaches:
    // - nested object: attrs = { on:{ click(){}, etc. } };
    // - object containing all on* attributes that has a property
    //   added when a new match is made
    } else if (attr[0] === 'o' && attr[1] === 'n') {
      vNode.events[attr.slice(2)] = vNode.dom[attr] = newValue;
    } else {
      vNode.dom.setAttribute(attr, newValue as string);
    }
  }
};

const createElement = (parentNode: VNodeAny, vNode: VNodeElem, ns: string): void => {
  vNode.events = {};
  vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, ns), vNode.attrs.is as string);
  if (vNode.attrs.tick) tickQueue.set(vNode, vNode.attrs.tick);
  // ensure <input>s have a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) vNode.dom.setAttribute('type', vNode.attrs.type);
  // iterate attributes
  for(const attr in vNode.attrs) {
    setDOMAttribute(vNode, attr, vNode.attrs[attr], undefined, ns);
  }
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns, 0);
};

const updateElement = (parentNode: VNodeAny, newVNode: VNodeElem, oldVNode: VNodeElem, ns: string): void => {
  newVNode.events = oldVNode.events;
  //if (newVNode.attrs === oldVNode.attrs && newVNode.attrs !== FROZEN_EMPTY_OBJECT) throw new Error('must not reuse attrs object across calls to z.elem()');
  // input type must be set before other attributes
  if (newVNode.tag === 'input' && newVNode.attrs.type != null) newVNode.dom.setAttribute('type', newVNode.attrs.type);
  // remove old attrs
  for(const attr in oldVNode.attrs) {
    if (attr[0] === 'o' && attr[1] === 'n') {
      newVNode.events[attr.slice(2)] = newVNode.dom[attr] = null;
    } else {
      newVNode.dom.removeAttribute(attr);
    }
  }
  // set new attributes
  for(const attr in newVNode.attrs) {
    //console.log(attr + ': ' + newVNode.attrs[attr]);
    setDOMAttribute(newVNode, attr, newVNode.attrs[attr], oldVNode.attrs[attr], ns);
    //console.log(newVNode.dom[attr]);
  }
  updateChildren(newVNode, newVNode.children, oldVNode.children, ns);
};

const createComponent = (parentNode: VNodeAny, vNode: VNodeComp, ns: string): void => {
  vNode.redraw = immediate => {
    if (immediate) updateComponent(parentNode, vNode, ns);
    else deferUpdateComponent(parentNode, vNode, ns);
  }
  if (vNode.tag.init) vNode.tag.init(vNode);
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns); //ns ? document.createElementNS(ns, parentDom.nodeName) : document.createElement(parentDom.nodeName);
  //console.log(vNode.dom);
  vNode.children = drawDrawable(vNode, vNode.tag.draw);
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns, 0);
  if (vNode.tag.tick) tickQueue.set(vNode, vNode.tag.tick);
  // *** tunnel to element?
  //if (vNode.children.length === 1 && vNode.children[0].type === VNODE_TYPE_ELEM ) {
  //  vNode.dom = vNode.children[0].dom;
  //}
};

const updateComponent = (parentNode: VNodeAny, vNode:VNodeComp, ns: string): void => {
  //if (!vNode.tag.drawOnce) {
    updateChildren(vNode, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns);
    if (vNode.tag.drawn) vNode.tag.drawn(vNode);
  //}
};

// *** partial implementation
const destroyComponent = (parentNode: VNodeAny, vNode:VNodeComp): void => {
  if (vNode.tag.destroy) vNode.tag.destroy(vNode);
  if (vNode.tag.tick) tickQueue.delete(vNode);
};

const removeVNodes = (children:VNodeFlatArray, start: number, end: number): void => {
  while(start < end) {
    removeVNode(children[start++]);
  }
};

const removeVNode = (vNode: VNodeAny): void => {
  switch(vNode.type) {
    case VNodeTypes.elem:
      if(vNode.attrs.tick) tickQueue.delete(vNode);
      removeVNodes(vNode.children, 0, vNode.children.length);
      break;
    case VNodeTypes.comp:
      if(vNode.tag.tick) tickQueue.delete(vNode);
      
      removeVNodes(vNode.children, 0, vNode.children.length);
      vNode.children.length = 0;
      break;
    case VNodeTypes.html:
      // *** fix this as TypeScript insists el can be a String
      for(const index in vNode.dom) {
        vNode.dom[index].remove();
      }
      break;
  }
  if (vNode.dom && (vNode.dom as Element).remove) (vNode.dom as Element).remove();
  delete vNode.dom;
};

const drawDrawable = (vNode: VNodeDrawable, drawFn: (vNode: VNodeDrawable, oldChildren: VNodeFlatArray) => VNodeAnyOrArray, oldChildren?:VNodeFlatArray) => {
  const children = drawFn(vNode, oldChildren);
  return normalizeChildren(vNode, Array.isArray(children) ? children : [children]);
};

// *** unused
//const emptyDom = (dom: Element): void => {
//  while(dom.lastChild) dom.lastChild.remove();
//};

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
  const children:VNodeArray = [];
  let index = 0;
  let attrs = args[index];
  // if no passed attributes
  if (!attrs || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
    attrs = FROZEN_EMPTY_OBJECT;
  // otherwise, copy attributes
  } else {
    attrs = Object.freeze(Object.assign({}, attrs));
    index++;
  }
  while(index < args.length) {
    const child = args[index++];
    const childType = typeof child;
    children.push(!child || childType === 'undefined' || childType === 'boolean' ? null : childType === 'object' ? child : text(child));
  }
  //const vNode = Object.assign(pools[VNodeTypes.elem].pop() || {type: VNodeTypes.elem}, {
  //  tag: selector,
  //  attrs
  //});
  const vNode:VNodeElem = {
    type: VNodeTypes.elem,
    tag: selector,
    attrs
  };
  vNode.children = normalizeChildren(vNode, children);
  return vNode;
};

const deferUpdateComponent = (parentNode: VNodeAny, vNode:VNodeAny, ns: string) => componentRedrawQueue.set(vNode, [parentNode, ns]);

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
const compDef = (inputDef: VNodeCompDefinition): VNodeCompDefinition => {
  //if (DEBUG) {
    if (typeof inputDef.draw !== 'function') throw new Error('component definition requires draw function');
  //}
  return Object.assign({}, inputDef, {type: VNodeTypes.compDef});
}

// A component should include:
// - optional state (ideally reactive)
// - lifecycle hooks
//   - create: called once upon creation
//   - draw: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
//   - destroy: called once upon destruction
const comp = (componentDefinition: VNodeCompDefinition, attrs?: VNodeCompAttributes): VNodeComp => {
  return {
    type: VNodeTypes.comp,
    tag: componentDefinition,
    attrs: attrs ? Object.freeze(attrs) : FROZEN_EMPTY_OBJECT
  }
}

const html = (value: string): VNodeHTML => {
  const type = typeof value;
  return {
    type: VNodeTypes.html,
    tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
  };
};

const mount = (dom: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeElem => {
  // first check to see if DOM is a child node of a mounted node
  let ancestor = dom.parentNode;
  while(ancestor) {
    if(mountedNodes.get(ancestor)) throw new Error('dom ancestor is already drawn');
    ancestor = ancestor.parentNode;
  }
  // we wrap the node to be able to get its previous vNode children
  const mountedNode = mountedNodes.get(dom) || mountedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
    dom: dom
  })).get(dom);

  removeVNodes(mountedNode.children, 0, mountedNode.children.length);
  mountedNode.children.length = 0;
  //emptyDom(dom);

  if(vNodeAnyOrArray != null) {
    updateChildren(mountedNode, Array.isArray(vNodeAnyOrArray) ? normalizeChildren(mountedNode, vNodeAnyOrArray) : [vNodeAnyOrArray], null, getClosestElementNamespace(dom));
  }

  return mountedNode;
};

const tick = (): void => {
  //const now = performance.now();
  tickCount++;
  for(const [vNode, value] of componentUpdateQueue) {
    updateComponent(value[0], vNode, value[1]);
  }
  componentUpdateQueue.clear();
  for(const [vNode, tick] of tickQueue) {
    tick(vNode, tickCount);
  }
  //const elapsed = Math.floor(performance.now() - now);
  //if (elapsed > 1) console.log(elapsed);
  // refactor if we end up caching other vNode types
  //if (pools[VNodeTypes.elem].length > poolSizes[VNodeTypes.elem]) pools[VNodeTypes.elem].length = poolSizes[VNodeTypes.elem];
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
  html,
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
    elem: VNodeTypes.elem,
    text: VNodeTypes.text,
    comp: VNodeTypes.comp,
    html: VNodeTypes.html,
  })
};