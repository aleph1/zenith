declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

interface VnodeAttributes {
    /** The class name(s) for this virtual element, as a space-separated list. */
    class?: string;
    /** A key to optionally associate with this element. */
    key?: string | number;
    /** Any virtual element properties (attributes and event handlers). */
    [property: string]: any;
  }

interface VnodeElem {
  tag: string;
  attrs: VnodeAttributes;
  children: Array<any>;
}

function elem(selector: string): VnodeElem;
function elem(selector: string, attrs?:VnodeAttributes, ...children?:Array<any>): VnodeElem;
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
    tag: selector,
    attrs,
    children
  }
}

export default {
  elem
};