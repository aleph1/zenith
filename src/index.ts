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
  children: array;
  attrs: VnodeAttributes;
}

declare function elem(selector: string): VnodeElem;

function elem(selector: string): VnodeElem {
  const children = [];
  let attrs = {};
  return {
    tag: selector,
    children
  }
}

export default {
  elem
};