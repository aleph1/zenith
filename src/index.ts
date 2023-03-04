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
  VNodeElemAttributes,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeCompInstance
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
    children
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

function wrapDom(dom:Node): VNodeElem {
  if(DEBUG) {
    // why do we need to cast dom as any to not get a Typescript compile error?
    if(<any> dom instanceof Node) throw new Error('wrap requires DOM Node');
  }
  return wrappedNodes.get(dom) || wrappedNodes.set(dom, Object.assign(elem(dom.nodeName.toLowerCase()), {
    dom: dom
  })).get(dom);
}

// ----------------------------------------
// RENDERING
// ----------------------------------------

function emptyDom(dom:Node): Node {
  while(dom.lastChild) dom.removeChild(dom.lastChild);
  return dom;
}

function renderViewable(instance:object, viewFn:Function): VNodeArray {
  //console.log('renderViewable()');
  const children:VNodeAnyOrArray = viewFn(instance);
  return Array.isArray(children) ? children.flat( Infinity ) : [children];
}

function createComponent(parent:VNodeAny, vnode:VNodeComp) {
  //console.log('createComponent()');
  const instance:VNodeCompInstance = {
    attrs: {}
  };
  vnode.instance = instance;
  vnode.children = renderViewable(instance, vnode.tag.view);
  vnode.dom = document.createDocumentFragment();
}

function updateComponent(parent:VNodeAny, vnode:VNodeComp) {
  vnode.children = renderViewable(vnode.instance, vnode.tag.view);
}

// Initial implementation of drawNode just to get something displaying
// there is so much to do here, including correcty rendering components
function drawVNode(parent: VNodeAny, vNode: VNodeAny, vnodeOld?: VNodeAny) {
  // we have quote a few cases to address here:
  // - get node type
  // - if node is a component check for an instance
  // - otherwise check for its .dom property
  const nodeType:number = vnode._z_;
  if(nodeType === VNODE_TYPE_COMP) {
  } else {
    let vnodeChildren:VNodeArray;
    // if the current vnode has no dom it hasn't been drawn before
    if(!vnode.dom) {
      // create dom based on vnode._z_
      switch(vnode._z_) {
        case VNODE_TYPE_ELEM:
          vnode.dom = document.createElement(vnode.tag);
          vnodeChildren = vnode.children;
          break;
        case VNODE_TYPE_COMP:
          vnode.dom = document.createDocumentFragment();
          break;
        case VNODE_TYPE_TEXT:
          vnode.dom = document.createTextNode(vnode.tag);
          break;
      }
    }
    // if the vnode has children then draw them
    if(vnodeChildren) {
      vnodeChildren.forEach((childVnode: VNodeAny) => {
      } );
    }
  }
  parent.dom.appendChild(vnode.dom);
      drawVNode(vNode, childVNode);
}

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem,
  text,
  comp,
  compDef,
  draw(dom:Node, vnode:VNodeAny) {
    drawVNode(wrapDom(emptyDom(dom)), vnode);
  }
};