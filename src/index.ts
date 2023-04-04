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
  DefTypeComp,
  DEF_TYPE_COMP,
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

// ----------------------------------------
// CONSTANTS
// ----------------------------------------

let drawMode = DrawModes.raf; //DRAW_MODE_RAF
let redrawRAF;
let tickCount = 0;

//const wrappedNodes = new Map();

// for createElementNS calls
const ELEMENT_NAMESPACES = {
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

// for finding namespace for createElement(NS) calls
const ELEMENT_NAMESPACES_QUERY = Object.keys(ELEMENT_NAMESPACES).join(',');

// to get first element name from z.html calls
const ELEMENT_REGEX = /^\s*?<(\w+)/im;

// possible element parents for html fragments
const ELEMENT_PARENTS = {
  col: 'colgroup',
  caption: 'table',
  colgroup: 'table',
  tbody: 'table',
  tfoot: 'table',
  thead: 'table',
  td: 'tr',
  th: 'tr',
  tr: 'tbody'
};

// used on elements with no attrs to avoid creating new objects
const FROZEN_EMPTY_OBJECT = Object.freeze({});

// used to queue component updates when drawMode is DRAW_MODE_RAF
const redrawQueue = new Map();
const componentsToTick = [];

const normalizeChildren = (vNode:VNodeContainer, children:VNodeArray): VNodeFlatArray => {
  const normalizedChildren:VNodeFlatArray = children.flat(Infinity) as VNodeFlatArray;
  const firstChild = normalizedChildren[0];
  const isKeyed = !firstChild || typeof firstChild === 'boolean' || firstChild.type !== VNodeTypes.elem || !firstChild.attrs.hasOwnProperty('key') ? false : true;
  // convert all falsy children to null
  normalizedChildren.forEach((child, index) => {
    if(!child || typeof child === 'boolean') normalizedChildren[index] = null;
  });
  if(isKeyed) vNode.keys = true;
  if(DEBUG) {
    for(let i = 1; i < normalizedChildren.length; i++) {
      const child = normalizedChildren[ i ];
      if((child as VNodeComp).type === VNodeTypes.comp || (child as VNodeElem).type === VNodeTypes.elem ) {
        if(isKeyed !== (child as VNodeContainer).attrs.hasOwnProperty('key')) throw new Error('All childrem must be either keyed or non-keyed.');
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
  // *** explore whether cloning elements is faster
  return ns
    ? document.createElementNS(ns, name, is ? {is: is} : null)
    : document.createElement(name, is ? {is: is} : null);
};

const draw = (parentDom: Element, newVNode: VNodeAny, oldVNode?: VNodeAny): void => {
  if(!newVNode.dom) createVNode(parentDom, newVNode, getClosestElementNamespace(parentDom));
  else updateVNode(parentDom, newVNode, oldVNode, getClosestElementNamespace(parentDom));
};

const updateVNode = (parentDom: Element | DocumentFragment, newVNode: VNodeAny, oldVNode?: VNodeAny, ns?: string) => {
  if(oldVNode) {
    const newVNodeType = newVNode.type;
    const oldVNodeType = oldVNode.type;
    if(newVNodeType === oldVNodeType) {
      newVNode.dom = oldVNode.dom;
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
          (newVNode.dom as Text).replaceWith(newVNode.dom = document.createTextNode(newVNode.tag));
          //const textNode = document.createTextNode(newVNode.tag);
          //(newVNode.dom as Text).replaceWith(textNode);
          //newVNode.dom = textNode;
      }
    } else {
      removeVNode(parentDom, oldVNode);
      //if(newVNode) createVNode(parentDom, newVNode, ns);
      createVNode(parentDom, newVNode, ns);
    }
  } else {
    //if(newVNode) createVNode(parentDom, newVNode, ns);
    createVNode(parentDom, newVNode, ns);
  }
};

const updateChildren = (parentDom: Element | DocumentFragment, newChildren:VNodeFlatArray, oldChildren:VNodeFlatArray, ns: string):VNodeFlatArray => {
  //console.log('updateChildren()');
  if(oldChildren) {
    //console.log('has oldChildren');
    const newChildrenLength = newChildren.length;
    const oldChildrenLength = oldChildren.length;
    if(newChildrenLength < oldChildrenLength) {
      removeVNodes(parentDom, oldChildren, newChildrenLength, oldChildrenLength);
    }
      if(newChildrenLength > 0) {
        // determine if children are keyed
        const isKeyed = newChildren[0].type === VNodeTypes.comp && newChildren[0].attrs.hasOwnProperty('key');
        //const isOldKeyed = childrenOld[0].type === VNODE_TYPE_COMP && (childrenOld[0] as VNodeComp).attrs.hasOwnProperty('key');
        for(let i = 0; i < newChildrenLength; i++ ) {
          updateVNode(parentDom, newChildren[i], oldChildren[i], ns);
        }
      }
    } else {
      createVNodes(parentDom, newChildren, 0, newChildren.length, ns, 0);
    }
    return newChildren;
};

const createVNodes = (parentDom: Element | DocumentFragment, children: VNodeFlatArray, start: number, end: number, ns: string, index: number): void => {
  while(start < end) {
    createVNode(parentDom, children[start++], ns, index++);
  }
};

const createVNode = (parentDom: Element | DocumentFragment, vNode: VNodeAny, ns: string, index: number = 0): void => {
  //console.log('createVNode()');
  switch(vNode.type) {
    case VNodeTypes.comp:
      createComponent(parentDom, vNode as VNodeComp, ns);
      break;
    case VNodeTypes.elem:
      createElement(parentDom, vNode as VNodeElem, ns);
      break;
    case VNodeTypes.text:
      vNode = vNode as VNodeText;
      vNode.dom = document.createTextNode(vNode.tag);
      break;
  }
  if(index > parentDom.childElementCount) parentDom.insertBefore(vNode.dom, parentDom.childNodes[index]);
  else parentDom.appendChild(vNode.dom);
}

const createElement = (parentDom: Element | DocumentFragment, vNode:VNodeElem, ns?:string): void => {
  ns = getNamespace(vNode, ns);
  const dom: Element = vNode.dom = getElement(vNode.tag, ns, vNode.attrs.is);
  // ensure <input>s have a type before doing additional attribute manipulation
  if (vNode.tag === 'input' && vNode.attrs.type != null) dom.setAttribute('type', vNode.attrs.type);
  // iterate attributes
  for(const attr in vNode.attrs) {
    const val = vNode.attrs[attr];
    // Skip values that are undefined or null
    // this is faster than val !== null && val !== undefined
    // *** benchmark to prove it
    if(val != null && attr !== 'type') {
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
}

/*
const createComponent = (parentDom: Element, vNode: VNodeComp, ns: string): void => {
  // we check
  if(vNode.tag.state !== false) {
    vNode.state = {};
    if(typeof vNode.tag.defaultState === 'function') Object.assign(vNode.state, vNode.tag.defaultState());
  }
  vNode.redraw = () => updateComponent(parentDom, vNode);
  //const instance:VNodeCompInstance = {
  //  attrs: vNode.attrs,
  //  redraw: () => updateComponent(parent, vNode),
  //  state: vNode.tag.state !== false ? {} : undefined
  //};
  // ensure this component isn't stateless
  if(vNode.tag.init) vNode.tag.init(vNode);
  // we only allow for state listening after init
  if(typeof vNode.tag.state === 'function' ) {
    // allows for 3rd party integration, passes vNode state and redraw function
    const stateInfo = vNode.tag.state(vNode.state, vNode.redraw);
    vNode.state = stateInfo.state;
    vNode.destroyState = stateInfo.destroy;
  }
  vNode.dom = document.createDocumentFragment();
  diffVNodeChildren(vNode, drawDrawable(vNode, vNode.tag.draw), null, ns);
  // *** tunnel to element, test this
  if(vNode.children.length === 1 && vNode.children[0].type === VNodeTypes.elem ) {
    vNode.dom = vNode.children[0].dom;
  }
}
*/

const createComponent = (parentDom: Element | DocumentFragment, vNode:VNodeComp, ns?: string) => {
    vNode.redraw = now => {
      if(now || drawMode === DrawModes.raf) updateComponent(parentDom, vNode, ns);
      else deferUpdateComponent(parentDom, vNode, ns);
    }
    // ensure this component isn't stateless
    if(vNode.tag.init) vNode.tag.init(vNode);
    vNode.dom = document.createDocumentFragment();
    vNode.children = drawDrawable(vNode, vNode.tag.draw);
    createVNodes(vNode.dom, vNode.children, 0, vNode.children.length, ns, 0);
    // *** tunnel to element, test this
    //if(vNode.children.length === 1 && vNode.children[0].type === VNODE_TYPE_ELEM ) {
    //  vNode.dom = vNode.children[0].dom;
    //}
  };

const updateComponent = (parentDom: Element | DocumentFragment, vNode:VNodeComp, ns?: string): void => {
  //if(vNode.tag.tick) vNode.tag.tick(vNode);
  //if(!vNode.tag.autoDraw) diffVNodeChildren(vNode, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children);
  //if(vNode.tag.drawn) vNode.tag.drawn(vNode);
  if(!vNode.tag.drawOnce) {
    vNode.children = updateChildren(vNode.dom, drawDrawable(vNode, vNode.tag.draw, vNode.children), vNode.children, ns);
    if(vNode.tag.drawn) vNode.tag.drawn(vNode);
  }
}

// *** partial implementation
const destroyComponent = (parentDom: Element, vNode:VNodeComp): void => {
  if(vNode.destroyState) vNode.destroyState();
  if(vNode.tag.destroy) vNode.tag.destroy(vNode);
}

const removeVNodes = (parentDom: Element | DocumentFragment, children:VNodeFlatArray, start: number, end: number): void => {
  //console.log('removeVNodes()');
  while(start < end) {
    removeVNode(parentDom, children[start++]);
  }
};

const removeVNode = (parentDom: Element | DocumentFragment, vNode: VNodeAny): void => {
  //console.log('removeVNode()');
  switch(vNode.type) {
    case VNodeTypes.elem:
    case VNodeTypes.comp:
      removeVNodes(vNode.dom, vNode.children, 0, vNode.children.length);
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
}

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
  while( index < args.length ) {
    const child = args[index++];
    const childType = typeof child;
    children.push(!child || childType === 'undefined' || childType === 'boolean' ? null : childType === 'object' ? child : text(child));
  }
  const vNode:VNodeElem = {
    type: VNodeTypes.elem,
    tag: selector,
    attrs
  };
  vNode.children = normalizeChildren(vNode, children);
  return vNode;
}

const deferUpdateComponent = (parentDom: Element | DocumentFragment, vNode:VNodeAny, ns: string) => redrawQueue.set(vNode, [parentDom, ns]);

//function compDef(inputDef: VNodeCompDefinition, extendDef?: VNodeCompDefinition): VNodeCompDefinition {
const compDef = (inputDef: VNodeCompDefinition): VNodeCompDefinition => {
  if(DEBUG) {
    if(typeof inputDef.draw !== 'function') throw new Error('component definition requires draw function');
    // *** zenith no longer has internal state
    //if(inputDef.defaultState && typeof inputDef.defaultState !== 'function') throw new Error('if component definition has defaultState it must be a function');
    //if(inputDef.keep === true && inputDef.update) throw new Error('components with keep: true will never update');
  }
  const outputDef:VNodeCompDefinition = Object.assign({}, inputDef);

  //outputDef.type = DEF_TYPE_COMP;
  //// only allow overrides on state
  //if(extendDef) {
  //  for(const prop in outputDef) {
  //    if(typeof outputDef[prop] === 'function' && typeof extendDef[prop] === 'function'){
  //      const fn = outputDef[prop];
  //      outputDef[prop] = instance => {
  //        extendDef[prop](instance);
  //        fn(instance);
  //      }
  //    }
  //  }
  //}
  return outputDef;
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
  // create a fragment from the passed string
  const dom = new DocumentFragment();
  const firstEl = value.match(ELEMENT_REGEX);
  // create an HTML container element 
  const containerEl = document.createElement(firstEl && ELEMENT_PARENTS[firstEl[1]] || 'div');
  // copy the value to the inner html of the container elements
  containerEl.innerHTML = value;
  // iterate through container element while it has a firstChild
  while(containerEl.firstChild) {
    // copy firstChild from container element to fragment
    dom.appendChild(containerEl.firstChild);
  }
  return {
    type: VNodeTypes.html,
    tag: '<',
    dom,
    domLength: dom.children.length
  };
}

//function wrapDom(dom:Element): VNodeElem {
//  if(DEBUG) {
//    // why do we need to cast dom as any to not get a Typescript compile error?
//    if(<any> dom instanceof Element) throw new Error('wrap requires DOM Element');
//  }
//  return wrappedNodes.get(dom) || wrappedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
//    dom: dom
//  })).get(dom);
//}

// ----------------------------------------
// RENDERING
// ----------------------------------------

/*
// Partial implementation, thinking this should become our diff
function diffVNode(parent: VNodeAny, vNode: VNodeAny, vNodeOld?: VNodeAny, ns?: string) {
  //console.log('diffVNode()');
  // *** do we need a different check here?
  vNode.parent = parent;
  if(vNodeOld != null) {
    //console.log('comparing vNodes');
    const vNodeType = vNode.type;
    const vNodeOldType = vNodeOld.type;
    if(vNodeType === vNodeOldType && (vNode.tag === vNodeOld.tag || vNodeType === VNodeTypes.text)) {
      vNode.dom = vNodeOld.dom;
      switch(vNodeType) {
        case VNodeTypes.elem:
          vNode = vNode as VNodeElem;
          // *** do we need to diff the old vNode's children?
          diffVNodeChildren(vNode, vNode.children, vNodeOld.children);
          break;
        case VNodeTypes.comp:
          vNode = vNode as VNodeComp;
          vNodeOld = vNodeOld as VNodeComp;
          updateComponent(parent, vNode);  
          break;
        case VNodeTypes.text:
          (vNode.dom as Text).data = (vNode as VNodeText).tag;
          break;
      }
    } else {
      // handle components
      if(vNodeOldType === VNodeTypes.comp) {
        destroyComponent(parent, vNodeOld as VNodeComp);
      }
      createVNode(parent, vNode, ns);
    }
    // *** compare tag
    //if(vNode == vNodeOld || vNode)
  } else {
    createVNode(parent, vNode, ns);
  }
}

function diffVNodeChildren(vNode: VNodeAny, children:VNodeFlatArray, childrenOld?:VNodeFlatArray, ns?:string) {
  //console.log('diffVNodeChildren()');
  // we need to do a diff
  if(childrenOld) {
    const childrenLength = children.length;
    const childrenOldLength = childrenOld.length;
    if(childrenLength < childrenOldLength) {
      removeVNodes(vNode, childrenOld, childrenLength, childrenOldLength);
    }
    if(childrenLength > 0) {
      // determine if children are keyed
      const isKeyed = children[0].type === VNodeTypes.comp && (children[0] as VNodeComp).attrs.hasOwnProperty('key');
      //const isOldKeyed = childrenOld[0].type === VNodeTypes.comp && (childrenOld[0] as VNodeComp).attrs.hasOwnProperty('key');
      for(let i = 0; i < childrenLength; i++ ) {
        diffVNode(vNode, children[i], childrenOld[i], ns);
      }
    }
  // or we don't
  } else {
    createVNodes(vNode, children, 0, children.length, ns);
  }
  vNode.children = children;
  // *** this works but it's not great
  //if( children === childrenOld || children == null && childrenOld == null) return;
  //const childrenLength = children.length;
  //const childrenOldLength = childrenOld && childrenOld.length || 0;
  //if (childrenOldLength === 0) createVNodes(vNode, children, 0, childrenLength);
  //else if (childrenLength === 0) removeVNodes(vNode, childrenOld, 0, childrenOldLength);
  //else {
  //  // *** eventually implement keys and diffing
  //  removeVNodes(vNode, childrenOld, 0, childrenOldLength);
  //  createVNodes(vNode, children, 0, childrenLength);
  //}
}
*/

const tick = (): void => {
  // /const now = Date.now();
  tickCount++;
  redrawQueue.forEach((value, key) => {
      // parentDom, vNode, ns
      updateComponent(value[0], key, value[1]);
    });
  redrawQueue.clear();
  // tick all components
  componentsToTick.forEach(vNode => vNode.tag.tick(vNode));
  window.requestAnimationFrame(tick);
}

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
  // *** should we alloe for passing a vNode, or an array of vNodes?
  draw(dom: Element, vNode: VNodeAny) {
    emptyDom(dom);
    // *** should we wrap dom in a vNode?
    draw(dom, vNode);
  }
};