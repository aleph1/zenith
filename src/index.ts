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
type VNodeTypeNone = 0;
type VNodeTypeElem = 1;
type VNodeTypeText = 2;
type VNodeTypeComp = 3;
type VNodeTypeHTML = 4;
const VNODE_TYPE_NONE: VNodeTypeNone = 0;
const VNODE_TYPE_ELEM: VNodeTypeElem = 1;
const VNODE_TYPE_TEXT: VNodeTypeText = 2;
const VNODE_TYPE_COMP: VNodeTypeComp = 3;
const VNODE_TYPE_HTML: VNodeTypeHTML = 4;

interface VNodeElemAttributes {
  /** The class name(s) for this virtual element, as a space-separated list. */
  class?: string;
  /** A key to optionally associate with this element. */
  key?: string | number;
  /** Any virtual element properties (attributes and event handlers). */
  [property: string]: any;
}

interface VNodeCompAttributes {
  /** Any virtual element properties (e.g., attributes and event handlers). */
  [property: string]: any;
}

interface VNodeCompDefinition {
  init?: Function;
  view: Function;
}

interface VnodeBase {
  _z_: NodeTypeNone;
}

type VNodeArray = Array<VnodeElem | VnodeText | VnodeComp | VNodeHTML | VNodeArray>;

type VNodeElem = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeElem;
  tag: string;
  attrs: VnodeElemAttributes;
  children: VNodeArray;
};

type VNodeText = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeText;
  tag: string;
};

type VNodeComp = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeComp;
  tag: Function;
};

type VNodeHTML = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeHTML;
  tag: "<";
  dom: DocumentFragment;
  domLength: number;
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
  comp,
  compDef
  draw( dom, vnode ) {
    drawNode( vnode.parent, vnode );
  }
};