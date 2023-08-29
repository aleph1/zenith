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

//const insertElements = (parentDom: Element, index: number, elements:Array<ChildNode | Element | Text>): void => {
//  if (index < 0) {
//    for(const element of elements) {
//      if (element) {
//        parentDom.appendChild(element);
//      }
//    }
//  } else {
//    for(const element of elements) {
//      if (element) {
//        parentDom.insertBefore(element, parentDom.childNodes[index]);
//        index++;
//      }
//    }
//  }
//};

const insertElements = (parentDom: Element, elements:Array<ChildNode | Element | Text>): void => {
  for(const element of elements) {
    if (element) {
      parentDom.appendChild(element);
    }
  }
};

const createVNode = (parentNode: VNodeContainer, vNode: VNodeAny, ns: string): void => {
  //if(typeof vNode === 'number') vNode = keepVNodes.get(vNode);
  if(vNode != null) {
    vNode.parent = parentNode;
    //let elements;
    switch(vNode.type) {
      case VNodeTypes.elem:
        createElement(parentNode, vNode as VNodeElem, ns);
        insertElements(parentNode.dom as Element, [vNode.dom]);
        break;
      case VNodeTypes.text:
        vNode = vNode as VNodeText;
        vNode.dom = document.createTextNode(vNode.tag);
        insertElements(parentNode.dom as Element, [vNode.dom]);
        break;
      case VNodeTypes.comp:
        createComponent(parentNode, vNode as VNodeComp, ns);
        insertElements(parentNode.dom as Element, vNode.doms);
        break;
      case VNodeTypes.html:
        createHTML(parentNode, vNode as VNodeHTML, ns);
        insertElements(parentNode.dom as Element, vNode.doms);
        break;
    }
  }
};

const createHTML = (parentNode: VNodeAny, vNode: VNodeHTML, ns: string): void => {
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns);
  vNode.dom.innerHTML = vNode.tag;
  vNode.doms = [...vNode.dom.childNodes];
  //vNode.length = vNode.dom.length;
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
    if (vNode.tag === 'input' || vNode.tag === 'textarea') (vNode.dom as HTMLInputElement).value = value + '';
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

const createElement = (parentNode: VNodeAny, vNode: VNodeElem, ns: string): void => {
  vNode.events = {};
  vNode.dom = getElement(vNode.tag, ns = getNamespace(vNode, vNode.attrs.ns || ns), vNode.attrs.is as string);
  if (vNode.attrs.tick) tickQueue.set(vNode, vNode.attrs.tick);
  // ensure <input>s have a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) vNode.dom.setAttribute('type', vNode.attrs.type);
  // iterate attributes
  for(const attr in vNode.attrs) {
    setDOMAttribute(vNode, attr, vNode.attrs[attr], undefined, ns);
  }
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
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

const redrawComponent = (vNode: VNodeComp, immediate?: boolean): void => {
  if (immediate) updateComponent(vNode.parent, vNode);
  else deferUpdateComponent(vNode.parent, vNode);
};

const createComponent = (parentNode: VNodeAny, vNode: VNodeComp, ns: string): void => {
  if (vNode.tag.init) vNode.tag.init(vNode);
  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns);
  vNode.children = drawDrawable(vNode, vNode.tag.draw);
  createVNodes(vNode, vNode.children, 0, vNode.children.length, ns);
  vNode.doms = [...vNode.dom.childNodes];
  if (vNode.tag.tick) tickQueue.set(vNode, vNode.tag.tick);
  if (vNode.tag.drawn) vNode.tag.drawn(vNode);
  // *** tunnel to element?
  //if (vNode.children.length === 1 && vNode.children[0].type === VNODE_TYPE_ELEM ) {
  //  vNode.dom = vNode.children[0].dom;
  //}
};

//const getActualDom = (vNode: VNodeContainer):Element => {
//  if((vNode as VNodeComp).doms) return getActualDom(vNode.parent);
//  return vNode.dom;
//};
//
//const getNodeDom = (vNode: VNodeAny, childDom:Array<ChildNode | Element | Text>): Array<ChildNode | Element | Text> => {
//  if(vNode.children) {
//    for(const child of vNode.children) {
//      switch(child.type) {
//        case VNodeTypes.elem:
//        case VNodeTypes.text:
//          childDom.push(child.dom);
//          break;
//        case VNodeTypes.comp:
//          getNodeDom(child, childDom);
//          break;
//        case VNodeTypes.html:
//          childDom.push.apply(childDom, child.dom);
//          break;
//      }
//    }
//  }
//  return childDom;
//};

const updateComponent = (parentNode: VNodeContainer, vNode:VNodeComp, ns?: string): void => {
  //if (!vNode.tag.drawOnce) {
    //console.log(vNode.dom.namespaceURI);
    //if(ns != null && ns != vNode.dom.namespaceURI) {
    //  vNode.dom = getElement((parentNode.dom as Element).nodeName, ns = ns || vNode.dom.namespaceURI);
    //}
    updateChildren(vNode, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns || vNode.dom.namespaceURI);
    // *** this might be slow
    //if(vNode.dom.children.length) {
    //  const actualDom = getActualDom(parentNode);
    //  const nodeDom = getNodeDom(parentNode, []);
    //  while(actualDom.lastChild) actualDom.lastChild.remove();
    //  vNode.doms.length = 0;
    //  vNode.doms.push.apply(vNode.doms, nodeDom);
    //  insertElements(actualDom, nodeDom);
    //}
    if (vNode.tag.drawn) vNode.tag.drawn(vNode);
  //}
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

const removeVNode = (parentNode: VNodeAny, vNode: VNodeAny, immediate?: boolean): void => {
  if(vNode != null) {
    let remove = true;
    switch(vNode.type) {
      case VNodeTypes.elem:
        if(vNode.attrs.tick) tickQueue.delete(vNode);
        break;
      case VNodeTypes.comp:
        if(vNode.tag.tick) tickQueue.delete(vNode);
        if(vNode.removing === true) {
          remove = false;
        } else if(immediate !== true && typeof vNode.tag.remove === 'function') {
          const delayed = vNode.tag.remove(vNode);
          if(delayed != null && typeof delayed.then === 'function') {
            remove = false;
            vNode.removing = true;
            const destroy = () => {
              vNode.removing = false;
              vNode.parent.children.splice(vNode.parent.children.indexOf(vNode), 1);
              destroyVNode(vNode as VNodeComp);
            };
            delayed.then(destroy, destroy);
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
    if(remove) {
      destroyVNode(vNode);
    }
  }
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