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
const ELEMENT_NAMESPACES_QUERY = 'math,svg';

const ELEMENT_CLONERS = {};

// used on elements with no attrs to avoid creating new objects
const FROZEN_EMPTY_OBJECT = Object.freeze({});

// used to queue component updates when drawMode is DRAW_MODE_RAF
const redrawableUpdateQueue = new Map();
const tickQueue = new Map();

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
      if((child.type === VNodeTypes.elem || child.type === VNodeTypes.comp) && isKeyed !== 'key' in child.attrs) throw new Error('children must be keyed or keyless');
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

const getNextSibling = (vNodes: VNodeFlatArray, start: number, end: number, nextSibling?: Element): Element => {
  while(start < end) {
    if (vNodes[start] != null && vNodes[start].dom != null) return vNodes[start].dom as Element;
    start++;
  }
  return nextSibling;
}

const updateChild = (parentVNode: VNodeContainer, newVNode: VNodeAny, oldVNode: VNodeAny, index: number, ns: string): void => {
  if (oldVNode != null && oldVNode.dom != null) {
    const newVNodeType = newVNode.type;
    const oldVNodeType = oldVNode.type;
    //newVNode.parent = parentVNode;
    if (newVNodeType === oldVNodeType) {
      // *** should we reenable .diff check?
      //if ((newVNode.attrs || FROZEN_EMPTY_OBJECT).diff !== false) {
        switch(newVNodeType) {
          case VNodeTypes.elem:
            if(newVNode.tag !== oldVNode.tag) {
              createVNode(parentVNode, newVNode, ns, (oldVNode as VNodeElem).dom);
              removeVNode(parentVNode, oldVNode);
            } else {
              newVNode.dom = oldVNode.dom as Element;
              updateElement(parentVNode, newVNode, oldVNode as VNodeElem, ns);
            }
            break;
          case VNodeTypes.text:
            if (newVNode.tag !== oldVNode.tag) {
              newVNode.dom = document.createTextNode(newVNode.tag);
              insertElement(parentVNode.dom, newVNode.dom, oldVNode.dom as Element);
              oldVNode.dom.remove();
            } else {
              newVNode.dom = (oldVNode as VNodeText).dom;
            }
            break;
          case VNodeTypes.comp:
            if (newVNode.tag !== oldVNode.tag) {
              createVNode(parentVNode, newVNode, ns, getNextSibling(parentVNode.children, index + 1, parentVNode.children.length));
              removeVNode(parentVNode, oldVNode);
            } else {
              newVNode.dom = oldVNode.dom as Element;
              newVNode.doms = (oldVNode as VNodeComp).doms;
              newVNode.children = (oldVNode as VNodeComp).children;
              updateComponent(parentVNode, newVNode, ns);
            }
            break;
          case VNodeTypes.html:
            if (newVNode.tag !== oldVNode.tag) {
              createVNode(parentVNode, newVNode, ns, getNextSibling(parentVNode.children, index + 1, parentVNode.children.length));
              removeVNode(parentVNode, oldVNode);
            } else {
              newVNode.dom = (oldVNode as VNodeHTML).dom;
              newVNode.doms = (oldVNode as VNodeHTML).doms;
            }
        }
      //}
    } else {
      createVNode(parentVNode, newVNode, ns, getNextSibling(parentVNode.children, index + 1, parentVNode.children.length));
      removeVNode(parentVNode, oldVNode);
    }
  } else {
    createVNode(parentVNode, newVNode, ns, getNextSibling(parentVNode.children, index + 1, parentVNode.children.length));
  }
};

const updateChildren = (parentNode: VNodeContainer, newChildren:VNodeFlatArray, oldChildren:VNodeFlatArray, ns: string): void => {
  // *** in theory updateChildren is always called with an oldChildren array,
  // but we should make sure of this
  const newChildrenLength = newChildren.length;
  const oldChildrenLength = oldChildren.length; // oldChildren && oldChildren.length || 0;
  if(newChildrenLength > 0) {
    if(oldChildrenLength > 0) {
      let oldChild;
      const doms = [];
      const isNewKeyed = newChildren[0] && newChildren[0].attrs && newChildren[0].attrs.key != null;
      const isOldKeyed = oldChildren[0] && oldChildren[0].attrs && oldChildren[0].attrs.key != null;
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
        let index = 0;
        for(const child of newChildren) {
          if(child != null) {
            //child.index = index;
            updateChild(parentNode, child, oldChildrenByKey[child.attrs.key as string], index, ns);
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
          index++;
        }
        insertElements(parentNode.dom as Element, doms);

      // non-keyed diff
      // 1) iterate through oldChildren starting at index newChildrenLength
      //    - attempt to remove node
      //    - keep nodes that are being removed in the tree
      // 2) iterate through newChildren starting at 0 up to newChildrenLength
      //    - 
      } else {
        const reusedDoms = new Set();
        // 1iterate through old nodes and keep any that have been destroyed, but deferred
        for(let i = newChildrenLength; i < oldChildrenLength; i++) {
          oldChild = oldChildren[i];
          // if old node is in the process of being removed, keep it in the tree
          if(removeVNode(parentNode, oldChild) === false) {
            oldChild.parent = parentNode;
            newChildren[i] = oldChild;
          }
        }
        for(let i = 0; i < newChildrenLength; i++) {
          oldChild = oldChildren[i];
          if(newChildren[i] == null && oldChild != null) {
            if(removeVNode(parentNode, oldChild) === false) {
              oldChild.parent = parentNode;
              newChildren[i] = oldChild;
              newChildren[i] && reusedDoms.add(newChildren[i].dom);
            }
          } else if(oldChild == null || oldChild.dom == null || reusedDoms.has(oldChild.dom)) {
            createVNode(parentNode, newChildren[i], ns);
            newChildren[i] && reusedDoms.add(newChildren[i].dom);
          } else if(oldChild.removing == null) {
            updateChild(parentNode, newChildren[i], oldChild, i, ns);
            newChildren[i] && reusedDoms.add(newChildren[i].dom);
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

const insertElements = (parentDom: Element, elements:Array<ChildNode | Element | Text>, nextSibling?: Element): void => {
  if(nextSibling != null && nextSibling.parentNode === parentDom) {
    for(const element of elements) {
      if (element) parentDom.insertBefore(element, nextSibling);
    }
  } else {
    for(const element of elements) {
      if (element) parentDom.appendChild(element);
    }
  }
};

const insertElement = (parentDom: Element, element:ChildNode | Element | Text, nextSibling?: Element): void => {
  if(nextSibling != null && nextSibling.parentNode === parentDom) parentDom.insertBefore(element, nextSibling);
  else parentDom.appendChild(element);
}

const createVNode = (parentNode: VNodeContainer, vNode: VNodeAny, ns: string, nextSibling?: Element): void => {
  //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
  if(vNode == null) return;
  vNode.parent = parentNode;
  //let elements;
  switch(vNode.type) {
    case VNodeTypes.elem:
      createElement(parentNode, vNode as VNodeElem, ns, nextSibling);
      break;
    case VNodeTypes.text:
      vNode = vNode as VNodeText;
      vNode.dom = document.createTextNode(vNode.tag);
      insertElement(parentNode.dom as Element, vNode.dom, nextSibling);
      break;
    case VNodeTypes.comp:
      createComponent(parentNode, vNode as VNodeComp, ns, nextSibling);
      break;
    case VNodeTypes.html:
      createHTML(parentNode, vNode as VNodeHTML, ns, nextSibling);
      break;
  }
};

const setDOMAttribute = (vNode: VNodeElem, attr: string, value: boolean | number | string | object | ((event?: Event) => void), oldValue: boolean | number | string | object | ((event?: Event) => void), ns: string): void => {
  if (value == null || attr === 'type' || attr === 'key' || attr === 'is' || attr === 'ns') return;
  if (attr === 'class') {
    vNode.dom.setAttribute(attr, Array.isArray(value) ? value.join(' ') : value as string);
  } else if (attr === 'style') {
    if(typeof value === 'string') {
      vNode.dom.setAttribute(attr, value as string);
    } else {
      for(const style in value as object) {
        (vNode.dom as HTMLElement).style[style] = value[style];
      }
    }
  } else if (attr === 'value') {
    if (vNode.tag === 'input' || vNode.tag === 'option' || vNode.tag === 'textarea') (vNode.dom as HTMLInputElement).value = value + '';
  } else if (typeof value === 'boolean') {
    if (value === true) {
      vNode.dom.setAttribute(attr, attr);
    } else {
      vNode.dom.removeAttribute(attr);
    }
  // Setting "on*" handlers using setAttribute does not work,
  // so we need a conditional to detect those attrs
  // Benchmarking the following shows that array access is faster
  // https://www.measurethat.net/Benchmarks/Show/26286/0/strings-starts-with-using-startswith-array-access-slice
  // - String.substr
  // - String.startsWith
  // - attr[0] === 'o' && attr[1] === 'n'
  // - nested object: attrs = { on:{ click(){}, etc. } };
  } else if (attr[0] === 'o' && attr[1] === 'n') {
    vNode.events[attr] = vNode.dom[attr] = value;
  } else {
    vNode.dom.setAttribute(attr, value as string);
  }
};

const createElement = (parentNode: VNodeAny, vNode: VNodeElem, ns: string, nextSibling?: Element): void => {
  vNode.events = {};
  vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, vNode.attrs.ns || ns), vNode.attrs.is as string);
  if (vNode.attrs.tick) tickQueue.set(vNode, vNode.attrs.tick);
  // ensure <input> has a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) vNode.dom.setAttribute('type', vNode.attrs.type);
  // iterate attributes
  for(const attr in vNode.attrs) {
    setDOMAttribute(vNode, attr, vNode.attrs[attr], undefined, ns);
  }
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
  insertElement(parentNode.dom as Element, vNode.dom, nextSibling);
};

const updateElement = (parentNode: VNodeContainer, newVNode: VNodeElem, oldVNode: VNodeElem, ns: string): void => {
  newVNode.events = oldVNode.events;
  //if (newVNode.attrs === oldVNode.attrs && newVNode.attrs !== FROZEN_EMPTY_OBJECT) throw new Error('must not reuse attrs object across calls to z.elem()');
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
  // set new attributes
  for(const attr in newVNode.attrs) {
    setDOMAttribute(newVNode, attr, newVNode.attrs[attr], oldVNode.attrs[attr], ns);
  }
  updateChildren(newVNode, newVNode.children, oldVNode.children, ns);
};

const tempUpdateComponent = (parentNode: VNodeContainer, vNode: VNodeComp): void => {
  updateComponent(parentNode, vNode);
  vNode.doms = [...vNode.dom.childNodes];
  vNode.dom = vNode.doms[0] as Element;
  insertElements(parentNode.dom, vNode.doms, getNextSibling(parentNode.children, parentNode.children.indexOf(vNode) + 1, parentNode.children.length));
};

const redrawComponent = (vNode: VNodeComp, immediate?: boolean): void => {
  if (immediate) tempUpdateComponent(vNode.parent, vNode);
  else deferUpdateRedrawable(vNode.parent, vNode);
};

const createComponent = (parentNode: VNodeAny, vNode: VNodeComp, ns: string, nextSibling?: Element): void => {
  if (vNode.tag.init) vNode.tag.init(vNode);
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns);
  vNode.children = drawDrawable(vNode, vNode.tag.draw);
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
  vNode.doms = [...vNode.dom.childNodes];
  vNode.dom = vNode.doms[0] as Element;
  insertElements(parentNode.dom as Element, vNode.doms, nextSibling);
  if (vNode.tag.tick) tickQueue.set(vNode, vNode.tag.tick);
  if (vNode.tag.drawn) vNode.tag.drawn(vNode);
};

const updateComponent = (parentNode: VNodeContainer, vNode:VNodeComp, ns?: string): void => {
  //if (vNode.tag.drawOnce != null) return;
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns);
  updateChildren(vNode, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns || vNode.dom.namespaceURI);
  //vNode.doms = [...vNode.dom.childNodes];
  //vNode.dom = vNode.doms[0] as Element;
  //insertElements
  if(vNode.tag.drawn) vNode.tag.drawn(vNode);
};

const createHTML = (parentNode: VNodeAny, vNode: VNodeHTML, ns: string, nextSibling): void => {
  const tmpDom = getElement((parentNode.dom as Element).nodeName, ns);
  tmpDom.innerHTML = vNode.tag;
  vNode.doms = [...tmpDom.childNodes];
  vNode.dom = vNode.doms[0] as Element;
  insertElements(parentNode.dom as Element, vNode.doms, nextSibling);
};

const removeVNodes = (parentNode: VNodeAny, children:VNodeFlatArray, start: number, end: number, noBeforeDestroy?: boolean): void => {
  while(start < end) {
    removeVNode(parentNode, children[start++], noBeforeDestroy);
  }
};

const destroyVNode = (vNode: VNodeAny): void => {
  if(vNode.type === VNodeTypes.comp) {
    if(vNode.tag.destroy) vNode.tag.destroy(vNode);
    vNode.removing = null;
  }
  if((vNode as VNodeContainer).children) {
    removeVNodes(vNode, vNode.children, 0, vNode.children.length, true);
    vNode.children.length = 0;
  } else if(vNode.dom && (vNode.dom as Element).remove) (vNode.dom as Element).remove();
  if((vNode as VNodeComp).doms) {
    for(const childDom of (vNode as VNodeComp).doms) childDom.remove()
  } else if(vNode.dom && (vNode.dom as Element).remove) (vNode.dom as Element).remove();
  delete vNode.dom;
  vNode.parent = null;
};

const removeVNode = (parentNode: VNodeAny, vNode: VNodeAny, immediate?: boolean): boolean => {
  if(vNode == null) return;
  switch(vNode.type) {
    case VNodeTypes.elem:
      if(vNode.attrs.tick) tickQueue.delete(vNode);
      break;
    case VNodeTypes.comp:
      if(vNode.tag.tick) tickQueue.delete(vNode);
      if(vNode.removing === true) {
        return false;
      } else if(immediate !== true && typeof vNode.tag.remove === 'function') {
        const delayed = vNode.tag.remove(vNode);
        if(delayed != null && typeof delayed.then === 'function') {
          vNode.removing = true;
          const destroy = () => {
            vNode.removing = false;
            vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
            destroyVNode(vNode as VNodeComp);
          };
          delayed.then(destroy, destroy);
          return false;
        }
        //if(typeof deferred === 'number' && isFinite(deferred)) {
        //  vNode.removing = true;
        //  setTimeout(() => {
        //    vNode.removing = false;
        //    vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
        //    destroyVNode(vNode as VNodeComp);
        //  }, deferred);
        //  remove = false;
        //}
      }
      break;
    case VNodeTypes.html:
      // *** fix this as TypeScript insists el can be a String
      for(const index in vNode.doms) {
        vNode.doms[index].remove();
      }
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
    children.push(child != null && typeof child === 'object' ? child : null);
  }
  // *** consider implementing object pooling
  return {
    type: VNodeTypes.elem,
    tag: selector,
    attrs,
    children: normalizeChildren(children),
  } as VNodeElem;
};

const deferUpdateRedrawable = (parentNode: VNodeAny, vNode: VNodeComp) => redrawableUpdateQueue.set(vNode, [parentNode]);

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
const compDef = (inputDef: VNodeCompDefinition): VNodeCompDefinition => {
  if (typeof inputDef.draw !== 'function') throw new Error('compDef requires draw function');
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
    redraw: now => redrawComponent(vNode, now),
    attrs: attrs ? Object.freeze(attrs) : FROZEN_EMPTY_OBJECT
  };
  return vNode;
};

const html = (value: string): VNodeHTML => {
  const type = typeof value;
  return {
    type: VNodeTypes.html,
    tag: type === 'string' || type === 'number' || type === 'bigint' ? value + '' : '',
  };
};

const mount = (dom: Element, vNodeAnyOrArray: VNodeAny | VNodeArray): VNodeElem => {
  if(dom == null) throw new Error('dom must be an Element');
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

  if(vNodeAnyOrArray == null || (vNodeAnyOrArray as VNodeArray).length === 0) {
    removeVNodes(mountedNode, mountedNode.children, 0, mountedNode.children.length);
    mountedNode.children.length = 0;
  } else {
    updateChildren(mountedNode, normalizeChildren(Array.isArray(vNodeAnyOrArray) ? vNodeAnyOrArray : [vNodeAnyOrArray]), mountedNode.children, getClosestElementNamespace(dom));
  }
  return mountedNode;
};

const tick = (): void => {
  tickCount++;
  for(const [vNode, value] of redrawableUpdateQueue) {
    if(vNode.type === VNodeTypes.comp) tempUpdateComponent(value[0], vNode);
  }
  redrawableUpdateQueue.clear();
  for(const [vNode, tick] of tickQueue) {
    tick(vNode, tickCount);
  }
  // *** refactor if we end up caching other vNode types
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
    elem: VNodeTypes.elem,
    text: VNodeTypes.text,
    comp: VNodeTypes.comp,
    html: VNodeTypes.html,
  }),
  ns: ELEMENT_NAMESPACES
};