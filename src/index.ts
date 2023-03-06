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
    attrs = {};
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

function createComponent(parent:VNodeAny, vnode:VNodeComp) {
  //console.log('createComponent()');
  const instance:VNodeCompInstance = {
    attrs: {}
  };
  vnode.instance = instance;
  vnode.children = renderViewable(instance, vnode.tag.view);
  vnode.dom = document.createDocumentFragment();
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

function updateComponent(parent:VNodeAny, vnode:VNodeComp) {
  vnode.children = renderViewable(vnode.instance, vnode.tag.view);
}

// Initial implementation of drawNode just to get something displaying
// there is so much to do here, including correcty rendering components
  //console.log('drawVNode()');
  // we have quote a few cases to address here:
  // - get node type
  // - if node is a component check for an instance
  // - otherwise check for its .dom property
  const nodeType:number = vNode._z_;
  let vNodeChildren:VNodeArray;
  vNode.parent = parent;
  //if(nodeType === VNODE_TYPE_COMP) {
  //  vNode = vNode as VNodeComp;
  //  if(vNode.instance) {
  //    updateComponent(parent, vNode);
  //  } else {
  //    createComponent(parent, vNode);
  //  }
  //  vNodeChildren = vNode.children;
  //} else {
    // if the current vnode has no dom it hasn't been drawn before
  if(vNode.dom) {
    // create dom based on vnode._z_
    switch(nodeType) {
      case VNODE_TYPE_ELEM:
        vNode = vNode as VNodeElem;
        vNodeChildren = vNode.children;
        break;
      case VNODE_TYPE_COMP:
        vNode = vNode as VNodeComp;
        updateComponent(parent, vNode);
        vNodeChildren = vNode.children;
        break;
      //case VNODE_TYPE_TEXT:
      //  vNode = vNode as VNodeText;
      //  vNode.dom = document.createTextNode(vNode.tag);
      //  break;
    }
  } else {
    switch(nodeType) {
      case VNODE_TYPE_ELEM:
        vNode = vNode as VNodeElem;
        createElement(parent, vNode);
        vNodeChildren = vNode.children;
        break;
      case VNODE_TYPE_COMP:
        vNode = vNode as VNodeComp;
        createComponent(parent, vNode);
        vNodeChildren = vNode.children;
        break;
      case VNODE_TYPE_TEXT:
        vNode = vNode as VNodeText;
        vNode.dom = document.createTextNode(vNode.tag);
        break;
    }
  }
  //}
  // if the vnode has children then draw them
  if(vNodeChildren) {
    vNodeChildren.forEach((childVNode: VNodeAny) => {
      drawVNode(vNode, childVNode);
    } );
  }
  parent.dom.appendChild(vNode.dom);
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