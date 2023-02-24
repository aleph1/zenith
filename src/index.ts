declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

// virtual node types 

type NodeTypeNone = 0;
type NodeTypeElem = 1;
type NodeTypeText = 2;

const NODE_TYPE_NONE: NodeTypeNone = 0;
const NODE_TYPE_ELEM: NodeTypeElem = 1;
const NODE_TYPE_TEXT: NodeTypeText = 2;

// ----------------------------------------
// INTERFACES
// ----------------------------------------

interface VnodeAttributes {
  /** The class name(s) for this virtual element, as a space-separated list. */
  class?: string;
  /** A key to optionally associate with this element. */
  key?: string | number;
  /** Any virtual element properties (attributes and event handlers). */
  [property: string]: any;
}

interface VnodeBase {
  _z_: NodeTypeNone;
  tag: string;
}

type VnodeElem = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeElem;
  attrs: VnodeAttributes;
  children: Array<any>;
};

type VnodeText = Omit<VnodeBase, '_z_'> & {
  _z_: NodeTypeText;
};

// ----------------------------------------
// VNODES
// ----------------------------------------

function elem(selector: string): VnodeElem;
function elem(selector: string, attrs:VnodeAttributes, ...children:Array<any>): VnodeElem;
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
};

// ----------------------------------------
// EXPORT
// ----------------------------------------

export default {
  elem
};