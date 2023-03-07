// ----------------------------------------
// WORKFLOW
// ----------------------------------------
// Creating vnodes:

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

// definition types and values
type DefTypeComp = 1;
const DEF_TYPE_COMP: DefTypeComp = 1;
const sealedEmptyObject: object = Object.seal({});

import {
  VNodeTypeNone,
  VNodeTypeElem,
  VNodeTypeText,
  VNodeTypeComp,
  VNodeTypeHTML,
  VNODE_TYPE_NONE,
  VNODE_TYPE_ELEM,
  VNODE_TYPE_TEXT,
  VNODE_TYPE_COMP,
  VNODE_TYPE_HTML,
  VNodeElem,
  VNodeText,
  VNodeComp,
  VNodeHTML,
  VNodeAny,
  VNodeAnyOrArray,
  VNodeArray,
  VNodeFlatArray,
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeCompInstance,
  VNodeContainer
} from './vnode.defs';

// ----------------------------------------
// CONSTANTS
// ----------------------------------------

const wrappedNodes = new Map();

// ----------------------------------------
// VNODES
// ----------------------------------------
// All of the following functions are
// designed to create one of more vnodes.
// ----------------------------------------

function elem(selector: string): VNodeElem;
function elem(selector: string, attrs:VNodeElemAttributes, ...vNodeChildren:VNodeArray): VNodeElem;
function elem(selector: string, ...vNodeChildren:VNodeArray): VNodeElem;
function elem(selector: string): VNodeElem {
  const children:VNodeArray = [];
  let start = 1;
  let attrs = arguments[1];

  // if no passed attributes
  if(attrs == null || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
    attrs = sealedEmptyObject;
  // otherwise, copy attributes
  } else {
    attrs = Object.assign( {}, attrs );
    start++;
  }
  while( start < arguments.length ) {
    const child:VNodeAny = arguments[ start++ ];
    children.push( typeof child === 'object' ? child : text( child ) );
  }
  return {
    _z_: VNODE_TYPE_ELEM,
    tag: selector,
    attrs,
    children: normalizeChildren(children)
  }
}

function text(value: string): VNodeText {
  return {
    _z_: VNODE_TYPE_TEXT,
    tag: value && value.toString() || '',
  }
}

function compDef( def: VNodeCompDefinition): VNodeCompDefinition {
  if( DEBUG ) {
    if( typeof def.view !== 'function' ) throw new Error( 'component requires view function' );
  }
  return Object.assign( {}, def, {
    _z_: DEF_TYPE_COMP
  } );
}

// A component should include:
// - optional state (ideally reactive)
// - lifecycle hooks
//   - create: called once upon creation
//   - view: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
//   - destroy: called once upon destruction
function comp(componentDefinition: VNodeCompDefinition, attrs: VNodeCompAttributes): VNodeComp {
  return {
    _z_: VNODE_TYPE_COMP,
    tag: componentDefinition
  }
}

function html(value: string): VNodeHTML {
  // create a fragment from the passed string
  const dom = new DocumentFragment();
  // create an HTML container element 
  const containerEl = document.createElement( 'div' );
  // copy the value to the inner html of the container elements
  containerEl.innerHTML = value;
  // iterate through container element while it has a firstChild
  while( containerEl.firstChild ) {
    // copy firstChild from container element to fragment
    dom.appendChild( containerEl.firstChild );
  //
  }
  return {
    _z_: VNODE_TYPE_HTML,
    tag: '<',
    dom,
    domLength: dom.children.length
  };
}

function wrapDom(dom:Element): VNodeElem {
  if(DEBUG) {
    // why do we need to cast dom as any to not get a Typescript compile error?
    if(<any> dom instanceof Element) throw new Error('wrap requires DOM Element');
  }
  return wrappedNodes.get(dom) || wrappedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
    dom: dom
  })).get(dom);
}

// ----------------------------------------
// RENDERING
// ----------------------------------------

function emptyDom(dom:Element): Element {
  while(dom.lastChild) dom.removeChild(dom.lastChild);
  return dom;
}

function normalizeChildren(children:VNodeArray):VNodeFlatArray {
  return children.flat(Infinity) as VNodeFlatArray;
}

function renderViewable(instance:object, viewFn:Function):VNodeFlatArray {
  //console.log('renderViewable()');
  const children:VNodeAnyOrArray = viewFn(instance);
  return Array.isArray(children) ? normalizeChildren(children) : [children];
}

function createElement(parent:VNodeAny, vNode:VNodeElem) {
  const dom: Element = document.createElement(vNode.tag);
  vNode.dom = dom;
  // Setting on* handlers using setAttribute does not work,
  // benchmark to compare various approaches:
  // https://www.measurethat.net/Benchmarks/Show/19171/0/compare-detecting-object-keys-starting-with-on
  // Array access performs better in most current browsers,
  // however, it might be worth considering a couple of other
  // approaches:
  // - nested object: attrs = { on:{ click(){}, etc. } };
  // - object containing all on* attributes that has a property
  //   added when a new match is made
  for(const attr in vNode.attrs) {
    if(attr[0] === 'o' && attr[1] === 'n') {
      dom[attr] = vNode.attrs[attr];
    } else {
      dom.setAttribute(attr, vNode.attrs[attr]);
    }
  }
  diffVNodeChildren(vNode as VNodeContainer, vNode.children);
}

function createComponent(parent:VNodeAny, vNode:VNodeComp) {
  const instance:VNodeCompInstance = {
    attrs: {},
    state: {},
    redraw(){
      diffVNode(parent, vNode);
    }
  };
  if(vNode.tag.init) vNode.tag.init(instance);
  vNode.instance = instance;
  vNode.dom = document.createDocumentFragment();
  diffVNodeChildren(vNode, renderViewable(instance, vNode.tag.view));
}

function updateComponent(parent:VNodeAny, vNode:VNodeComp) {
  diffVNodeChildren(vNode, renderViewable(vNode.instance, vNode.tag.view), vNode.children);
}

// Partial implementation, thinking this should become our diff
function diffVNode(parent: VNodeAny, vNode: VNodeAny, vNodeOld?: VNodeAny) {
  //console.log('diffVNode()');
  if(vNodeOld != null) {
    // *** compare tag
    //if(vNode == vNodeOld || vNode)
  } else {
    createVNode(parent, vNode);
  }
}

function diffVNodeChildren(vNode: VNodeAny, children:VNodeFlatArray, childrenOld?:VNodeFlatArray) {
  // we need to do a diff
  if(childrenOld) {
    const childrenLength = children.length;
    const childrenOldLength = childrenOld.length;
    if(childrenLength < childrenOldLength) {
      removeVNodes(vNode, childrenOld, childrenLength, childrenOldLength);
    }
    for(let i = 0; i < childrenLength; i++ ) {
      diffVNode(vNode, children[i], childrenOld[i]);
    }
  // or we don't
  } else {
    createVNodes(vNode, children, 0, children.length);
  }
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

function createVNodes(parent: VNodeAny, children: VNodeFlatArray, start: number, end: number) {
  //console.log('createVNodes()');
  while(start < end) {
    createVNode(parent, children[start++]);
  }
  parent = parent as VNodeContainer;
  parent.children = children;
}

function createVNode(parent: VNodeAny, vNode: VNodeAny) {
  //console.log('diffVNode()');
  const nodeType:number = vNode._z_;
  vNode.parent = parent;
  // if the current vnode has no dom it hasn't been drawn before
  if(vNode.dom) {
    //console.log('updating component')
    // create dom based on vnode._z_
    switch(nodeType) {
      case VNODE_TYPE_COMP:
        vNode = vNode as VNodeComp;
        updateComponent(parent, vNode);
        break;
    }
  } else {
    switch(nodeType) {
      case VNODE_TYPE_ELEM:
        vNode = vNode as VNodeElem;
        createElement(parent, vNode);
        break;
      case VNODE_TYPE_COMP:
        vNode = vNode as VNodeComp;
        createComponent(parent, vNode);
        break;
      case VNODE_TYPE_TEXT:
        vNode = vNode as VNodeText;
        vNode.dom = document.createTextNode(vNode.tag);
        break;
    }
    parent.dom.appendChild(vNode.dom);
  }
}

function removeVNodes(parent: VNodeAny, children: VNodeFlatArray, start: number, end: number) {
  //console.log('removeVNodes()');
  while(start < end) {
    removeVNode(parent, children[start++]);
  }
}

function removeVNode(parent: VNodeAny, vNode: VNodeAny) {
  //console.log('removeVNode()');
  //console.log(vNode);
  if(typeof vNode.tag === 'string') {
    vNode = vNode as VNodeElem;
    vNode.dom && vNode.dom.remove();
  } else {
    vNode = vNode as VNodeContainer;
    removeVNodes(vNode, vNode.children, 0, vNode.children.length);
  }
}

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem,
  text,
  comp,
  compDef,
  draw(dom:Element, vnode:VNodeAny) {
    diffVNode(wrapDom(emptyDom(dom)), vnode);
  }
};