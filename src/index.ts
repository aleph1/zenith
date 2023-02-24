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

// node types and values
type NodeTypeNone = 0;
type NodeTypeElem = 1;
type NodeTypeText = 2;
type NodeTypeComp = 3;
type NodeTypeHTML = 4;
const NODE_TYPE_NONE: NodeTypeNone = 0;
const NODE_TYPE_ELEM: NodeTypeElem = 1;
const NODE_TYPE_TEXT: NodeTypeText = 2;
const NODE_TYPE_COMP: NodeTypeComp = 3;
const NODE_TYPE_HTML: NodeTypeHTML = 4;

interface VnodeElemAttributes {
  /** The class name(s) for this virtual element, as a space-separated list. */
  class?: string;
  /** A key to optionally associate with this element. */
  key?: string | number;
  /** Any virtual element properties (attributes and event handlers). */
  [property: string]: any;
}

interface VnodeCompAttributes {
  /** Any virtual element properties (e.g., attributes and event handlers). */
  [property: string]: any;
}

interface VnodeCompDefinition {
  init?: Function;
  view: Function;
}

interface VnodeBase {
  _z_: NodeTypeNone;
}

type VnodeElem = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeElem;
  tag: string;
  attrs: VnodeElemAttributes;
  children: Array<any>;
};

type VnodeText = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeText;
  tag: string;
};

type VnodeComp = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeComp;
  tag: Function;
};

type VNodeHTML = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeHTML;
  tag: "<";
};

// ----------------------------------------
// VNODES
// ----------------------------------------
// All of the following functions are
// designed to create one of more vnodes.
// ----------------------------------------

function elem(selector: string): VnodeElem;
function elem(selector: string, attrs:VnodeElemAttributes, ...children:Array<any>): VnodeElem;
function elem(selector: string, ...children:Array<any>): VnodeElem;
function elem(selector: string): VnodeElem {
  const children = [];
  let start = 1;
  let attrs = arguments[1];

  // if no passed attributes
  if(attrs == null || typeof attrs !== 'object' || attrs.tag != null || Array.isArray(attrs)) {
    attrs = {};
  // otherwise, copy attributes
  } else {
    attrs = Object.assign( {}, attrs );
  }
  return {
    _z_: NODE_TYPE_ELEM,
    tag: selector,
    attrs,
    children
  }
}

function text(value: string): VnodeText {
  //console.log( 'text()' );
  return {
    _z_: NODE_TYPE_TEXT,
    tag: value && value.toString() || '',
  }
}

function compDef( def: VnodeCompDefinition): VnodeCompDefinition {
  if( DEBUG ) {
    if( typeof def.view !== 'function' ) throw new Error( 'component requires view function' );
  }
  return Object.assign( {}, def, {
    _z_: DEF_TYPE_COMP
  } );
}

// A component should include:
// - has state (ideally reactive)
// - has lifecycle hooks
//   - create: called once upon creation
//   - view: called whenever state is changed or component is redrawn due to parent vnodes being redrawn
//   - destroy: called once upon destruction
function comp( componentDefinition: Function, attrs: VnodeCompAttributes): VnodeComp {
  return {
    _z_: NODE_TYPE_COMP,
    tag: componentDefinition
  }
}

function html( value: string ): VNodeHTML {
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
    _z_: NODE_TYPE_HTML,
    tag: '<',
    dom,
    domLength: dom.children.length
  };
}

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem,
  text,
  comp
};