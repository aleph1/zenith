// ----------------------------------------
// WORKFLOW
// ----------------------------------------
// Creating vnodes:
// 
// Component lifecycle:
// - fn(vNode) (calls constructor function)
// - beforeDraw (not called until component is drawn once)
// - draw(vNode,children,oldChidren?)
// - afterDraw(vNode)*
// - destroy(vNode)

// ----------------------------------------
// GLOBALS
// ----------------------------------------

declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

// ----------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------

import {
  DrawModes,
  VNodeTypes,
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeHTML,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeDrawable,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  //VNodeCompInstance,
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
let keepCount = 0;

const mountedNodes = new Map();

// for createElementNS calls
const ELEMENT_NAMESPACES = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

// for finding namespace for createElement(NS) calls
const ELEMENT_NAMESPACES_QUERY = Object.keys(ELEMENT_NAMESPACES).join(',');

const ELEMENT_CLONERS = {};

// used on elements with no attrs to avoid creating new objects
const FROZEN_EMPTY_OBJECT = Object.freeze({});

// used to queue component updates when drawMode is DRAW_MODE_RAF
const componentRedrawQueue = new Map();
const tickQueue = new Map();

//const keepVNodes: Map<number, VNodeAny> = new Map();

const normalizeChildren = (vNode:VNodeContainer, children:VNodeArray): VNodeFlatArray => {
  const normalizedChildren:VNodeFlatArray = children.flat(Infinity) as VNodeFlatArray;
  const firstChild = normalizedChildren[0];
  const isKeyed = !firstChild || typeof firstChild === 'boolean' || firstChild.type !== VNodeTypes.elem || !Object.prototype.hasOwnProperty.call(firstChild.attrs, 'key') ? false : true;
  if (isKeyed) vNode.keys = true;
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

const getClosestElementNamespace = (dom:Element | undefined): string | undefined => {
  return dom && 'closest' in dom ? ELEMENT_NAMESPACES[(dom.closest(ELEMENT_NAMESPACES_QUERY) || dom).nodeName.toLowerCase()] : undefined;
};

const getNamespace = (vNode:VNodeElem, ns:string | undefined): string | undefined => {
  return vNode.attrs && vNode.attrs.xmlns || ELEMENT_NAMESPACES[vNode.tag] || ns;
};

const getElement = (name:string, ns?:string, is?:string): Element => {
  const fullName = name + ':' + (ns || '') + ':' + (is || '');
  return (ELEMENT_CLONERS[fullName] || (ELEMENT_CLONERS[fullName] = ns ? document.createElementNS(ns, name, is ? {is} : null) : document.createElement(name, is ? {is} : null))).cloneNode();
};

const drawInternal = (parentDom: Element, newVNode: VNodeAny, oldVNode?: VNodeAny): void => {
  if(!newVNode.dom) createVNode(parentDom, newVNode, getClosestElementNamespace(parentDom));
  else updateVNode(parentDom, newVNode, oldVNode, getClosestElementNamespace(parentDom));
};

const updateVNode = (parentDom: Element, newVNode: VNodeAny, oldVNode?: VNodeAny, ns?: string) => {
  if(oldVNode) {
    const newVNodeType = newVNode.type;
    const oldVNodeType = oldVNode.type;
    if(newVNodeType === oldVNodeType) {
      newVNode.dom = oldVNode.dom;
      // *** should we reenable .diff check?
      //if((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
        switch(newVNodeType) {
          case VNodeTypes.elem:
            //(newVNode as VNodeElem).dom = (oldVNode as VNodeElem).dom;
            newVNode.children = updateChildren(newVNode.dom, newVNode.children, oldVNode.children, ns);
            break;
          case VNodeTypes.comp:
            //(newVNode as VNodeComp).dom = (oldVNode as VNodeComp).dom;
            if(newVNode.tag === oldVNode.tag) {
              updateComponent(parentDom, newVNode, ns);
            } else {
              createComponent(parentDom, newVNode, ns);
            }
            break;
          case VNodeTypes.text:
            if(newVNode.tag !== oldVNode.tag) {
              (newVNode.dom as Text).replaceWith(newVNode.dom = document.createTextNode(newVNode.tag));
            }
        }
      //}
    } else {
      removeVNode(oldVNode);
      //if(newVNode) createVNode(parentDom, newVNode, ns);
      createVNode(parentDom, newVNode, ns);
    }
  } else {
    //if(newVNode) createVNode(parentDom, newVNode, ns);
    createVNode(parentDom, newVNode, ns);
  }
};

const updateChildren = (parentDom: Element, newChildren:VNodeFlatArray, oldChildren:VNodeFlatArray, ns: string):VNodeFlatArray => {
  if(oldChildren) {
    const newChildrenLength = newChildren.length;
    const oldChildrenLength = oldChildren.length;
    // *** 
    if(newChildrenLength > 0) {
      // determine if children are keyed
      const isNewKeyed = newChildren[0] && newChildren[0].attrs && newChildren[0].attrs.key != null;
      const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && newChildren[0].attrs.key != null;
      // keyed diff
      // 1) get IDs for new children
      // 2) get IDs for old children
      // 3) get IDs for old children
      // 4) iterate through new children IDs and ***
      if(isNewKeyed && isOldKeyed) {
        //console.log('keyed');
        //const tempDom = getElement(parentDom.nodeName, ns);
        const doms = [];
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
          newChildrenByKey[child.attrs.key] = true;
        }
        // get keys for all old children
        for(const child of oldChildren) {
          const key = child.attrs.key;
          // when old key is still in use, keep the old node
          if(newChildrenByKey[key]) {
            oldChildrenByKey[key] = child;
            //oldKeyOrder.push(key);
          // otherwise, nullify the node and delete its DOM
          } else {
            // removeNode returns null
            removeVNode(child);
            //oldKeyOrder.push(-1);
            delete oldChildrenByKey[key];
          }
        }

        // iterate through new children and diff with old children
        for(const child of newChildren) {
          updateVNode(parentDom, child, oldChildrenByKey[child.attrs.key], ns);
          if(Array.isArray(child.dom)) {
            for(const index in child.dom) {
              doms.push(child.dom[index]);
              child.dom[index].remove();
            }
          } else {
            doms.push(child.dom);
            child.dom.remove();
          }
        }
        insertElements(parentDom, -1, doms);

      // non-keyed diff
      // 1) remove all old children ***
      } else {
        if(newChildrenLength < oldChildrenLength) {
          removeVNodes(oldChildren, newChildrenLength, oldChildrenLength);
        }
        for(let i = 0; i < newChildrenLength; i++ ) {
          updateVNode(parentDom, newChildren[i], oldChildren[i], ns);
        }
      }
    } else {
      removeVNodes(oldChildren, 0, oldChildrenLength);
    }
  } else {
    createVNodes(parentDom, newChildren, 0, newChildren.length, ns, 0);
  }
  return newChildren;
};

const createVNodes = (parentDom: Element, children: VNodeFlatArray, start: number, end: number, ns: string, index: number): void => {
  while(start < end) {
    index += createVNode(parentDom, children[start++], ns, index);
  }
};

const insertElements = (parentDom: Element, index: number, elements:Array<ChildNode | Element | Text>): number => {
  let i = 0;
  let count = 0;
  let element: Element | Text | ChildNode;
  if(index < 0) {
    while(i < elements.length) {
      element = elements[i++];
      if(element) {
        parentDom.appendChild(element);
        count++;
      }
    }
  } else {
    while(i < elements.length) {
      element = elements[i++];
      if(element) {
        if(index > parentDom.childElementCount) parentDom.insertBefore(element, parentDom.childNodes[index]);
        else parentDom.appendChild(element);
        index++;
        count++;
      }
    }
  }
  return count;
};

const createVNode = (parentDom: Element, vNode: VNodeAny, ns: string, index: number = 0): number => {
  let elsAddedToDom = 0;
  switch(vNode.type) {
    case VNodeTypes.elem:
      createElement(parentDom, vNode as VNodeElem, ns);
      elsAddedToDom = insertElements(parentDom, index, [vNode.dom]);
      break;
    case VNodeTypes.comp:
      createComponent(parentDom, vNode as VNodeComp, ns);
      elsAddedToDom = insertElements(parentDom, index, [...vNode.dom.childNodes]);
      break;
    case VNodeTypes.text:
      vNode = vNode as VNodeText;
      vNode.dom = document.createTextNode(vNode.tag);
      elsAddedToDom = insertElements(parentDom, index, [vNode.dom]);
      break;
    case VNodeTypes.html:
      createHTML(parentDom, vNode as VNodeHTML, ns);
      elsAddedToDom = insertElements(parentDom, index, vNode.dom);
      break;
  }
  return elsAddedToDom;
};

const createHTML = (parentDom: Element, vNode: VNodeHTML, ns: string): void => {
  const tempDom = getElement(parentDom.nodeName, ns);
  tempDom.innerHTML = vNode.tag;
  vNode.dom = [...tempDom.childNodes];
  vNode.length = vNode.dom.length;
};

const createElement = (parentDom: Element, vNode: VNodeElem, ns: string): void => {
  const dom: Element = vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, ns), vNode.attrs.is);
  // ensure <input>s have a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) dom.setAttribute('type', vNode.attrs.type);
  // iterate attributes
  for(const attr in vNode.attrs) {
    const val = vNode.attrs[attr];
    // Skip values that are undefined or null
    // this is faster than val !== null && val !== undefined
    // *** benchmark to prove it
    if(val != null && attr !== 'type' && attr !== 'key') {
      // Setting on* handlers using setAttribute does not work,
      // benchmark to compare various approaches:
      // https://www.measurethat.net/Benchmarks/Show/19171/0/compare-detecting-object-keys-starting-with-on
      // Array access performs better in most current browsers,
      // however, it might be worth considering a couple of other
      // approaches:
      // - nested object: attrs = { on:{ click(){}, etc. } };
      // - object containing all on* attributes that has a property
      //   added when a new match is made
      if(typeof val === 'boolean') {
        if(val === true) {
          dom.setAttribute(attr, attr);
        } else {
          dom.removeAttribute(attr);
        }
      } else if(attr[0] === 'o' && attr[1] === 'n') {
        dom[attr] = val;
      } else {
        dom.setAttribute(attr, val);
      }
    }
  }
  createVNodes(dom, vNode.children, 0, vNode.children.length, ns, 0);
};

const createComponent = (parentDom: Element, vNode: VNodeComp, ns: string): void => {
  vNode.redraw = now => {
    if(now) updateComponent(parentDom, vNode, ns);
    else deferUpdateComponent(parentDom, vNode, ns);
  }
  if(vNode.tag.init) vNode.tag.init(vNode);
  vNode.dom = getElement(parentDom.nodeName, ns); //ns ? document.createElementNS(ns, parentDom.nodeName) : document.createElement(parentDom.nodeName);
  vNode.children = drawDrawable(vNode, vNode.tag.draw);
  createVNodes(vNode.dom, vNode.children, 0, vNode.children.length, ns, 0);
  if(vNode.tag.tick) componentTickQueue.set(vNode, vNode.tag.tick);
  // *** tunnel to element, test this
  //if(vNode.children.length === 1 && vNode.children[0].type === VNODE_TYPE_ELEM ) {
  //  vNode.dom = vNode.children[0].dom;
  //}
};

const updateComponent = (parentDom: Element, vNode:VNodeComp, ns: string): void => {
  //if(!vNode.tag.drawOnce) {
    vNode.children = updateChildren(vNode.dom, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns);
    if(vNode.tag.drawn) vNode.tag.drawn(vNode);
  //}
};

// *** partial implementation
const destroyComponent = (parentDom: Element, vNode:VNodeComp): void => {
  if(vNode.tag.destroy) vNode.tag.destroy(vNode);
};

const removeVNodes = (children:VNodeFlatArray, start: number, end: number): void => {
  while(start < end) {
    removeVNode(children[start++]);
  }
};

const removeVNode = (vNode: VNodeAny): void => {
  const pool = pools[vNode.type];
  switch(vNode.type) {
    case VNodeTypes.elem:
      pool.push(vNode);
    case VNodeTypes.comp:
      removeVNodes(vNode.children, 0, vNode.children.length);
      break;
    case VNodeTypes.html:
      // *** fix this as TypeScript insists el can be a String
      for(const index in vNode.dom) {
        vNode.dom[index].remove();
      }
      break;
  }
  if('remove' in vNode.dom) vNode.dom.remove();
};

const drawDrawable = (vNode: VNodeDrawable, drawFn: Function, oldChildren?:VNodeFlatArray) => {
  const children = drawFn(vNode, oldChildren);
  return normalizeChildren(vNode, Array.isArray(children) ? children : [children]);
};

const emptyDom = (dom: Element): void => {
  while(dom.lastChild) dom.lastChild.remove();
};

// ----------------------------------------
// VNODES
// ----------------------------------------
// All of the following functions are
// designed to create one or more vnodes.
// ----------------------------------------

const text = (value: string | number | bigint): VNodeText => {
  const type = typeof value
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
    attrs = Object.freeze(Object.assign( {}, attrs ));
    index++;
  }
  while(index < args.length) {
    const child = args[index++];
    const childType = typeof child;
    children.push(!child || childType === 'undefined' || childType === 'boolean' ? null : childType === 'object' ? child : text(child));
  }
  const vNode = Object.assign(pools[VNodeTypes.elem].pop() || { type: VNodeTypes.elem }, {
    tag: selector,
    attrs
  });
  vNode.children = normalizeChildren(vNode, children);
  return vNode;
};

const deferUpdateComponent = (parentDom: Element, vNode:VNodeAny, ns: string) => componentRedrawQueue.set(vNode, [parentDom, ns]);

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
const compDef = (inputDef: VNodeCompDefinition): VNodeCompDefinition => {
  if(DEBUG) {
    if(typeof inputDef.draw !== 'function') throw new Error('component definition requires draw function');
    // *** zenith no longer has internal state
    //if(inputDef.defaultState && typeof inputDef.defaultState !== 'function') throw new Error('if component definition has defaultState it must be a function');
    //if(inputDef.keep === true && inputDef.update) throw new Error('components with keep: true will never update');
  }
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
    attrs: attrs || FROZEN_EMPTY_OBJECT
  }
}

const html = (value: string): VNodeHTML => {
  const type = typeof value;
  return {
    type: VNodeTypes.html,
    tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
  };
};

const keep = (vNode: VNodeElem | VNodeComp): number => {
  Object.defineProperties(vNode, {
    keep: {configurable: false, writable: false, value: ++keepCount},
    state: {configurable: false, writable: false, value: {}}
  });
  keepVNodes.set(++keepCount, vNode);
  return keepCount;
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
  removeVNodes(mountedNode.children, 0, mountedNode.children.length)
  mountedNode.children.length = 0;
  // *** replace with Array.isArray(vNode) ? vNode : [vNode]
  if(vNodeAnyOrArray != null) {
    mountedNode.children = Array.isArray(vNodeAnyOrArray) ? normalizeChildren(mountedNode, vNodeAnyOrArray) : [vNodeAnyOrArray];
    for(const child of mountedNode.children) {
      if (child.dom == null) createVNode(mountedNode, child, getClosestElementNamespace(dom));
      else updateVNode(mountedNode, child, null, getClosestElementNamespace(dom));
    }
  }
  return mountedNode;
};

const tick = (): void => {
  //const now = performance.now();
  tickCount++;
  for(const [vNode, value] of componentRedrawQueue) {
    updateComponent(value[0], vNode, value[1]);
  }
  componentRedrawQueue.clear();
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