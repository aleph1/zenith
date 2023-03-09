// defintion types
export type DefTypeComp = 1;
export const DEF_TYPE_COMP: DefTypeComp = 1;

// node types and values
export type VNodeTypeNone = 0;
export type VNodeTypeElem = 1;
export type VNodeTypeText = 2;
export type VNodeTypeComp = 3;
export type VNodeTypeHTML = 4;
export const VNODE_TYPE_NONE: VNodeTypeNone = 0;
export const VNODE_TYPE_ELEM: VNodeTypeElem = 1;
export const VNODE_TYPE_TEXT: VNodeTypeText = 2;
export const VNODE_TYPE_COMP: VNodeTypeComp = 3;
export const VNODE_TYPE_HTML: VNodeTypeHTML = 4;

export interface VNodeElemAttributes {
  /** The class name(s) for this virtual element, as a space-separated list. */
  class?: string;
  /** A key to optionally associate with this element. */
  key?: string | number;
  /** Any virtual element properties (attributes and event handlers). */
  [property: string]: any;
}

export interface VNodeCompAttributes {
  /** Any virtual element properties (e.g., attributes and event handlers). */
  [property: string]: any;
}

export interface VNodeCompDefinition {
  init?: Function;
  view: Function;
  destroy?: Function;
}

export interface VNodeCompInstance {
  attrs: VNodeCompAttributes;
  // *** for now state is non-reactive
  state: Object;
  redraw: Function;
};

export interface VNodeAbstract {
  type: VNodeTypeNone;
  parent?: VNodeAny;
  children?: VNodeFlatArray;
}

export type VNodeContainer = VNodeElem | VNodeComp;
export type VNodeAny = VNodeElem | VNodeText | VNodeComp | VNodeHTML;
export type VNodeArray = Array<VNodeElem | VNodeText | VNodeComp | VNodeHTML | VNodeArray>;
export type VNodeFlatArray = Array<VNodeAny>;
export type VNodeAnyOrArray = VNodeAny | VNodeArray;

export type VNodeElem = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypeElem;
  tag: string;
  attrs: VNodeElemAttributes;
  //children: VNodeFlatArray;
  dom?: Element;
};

export type VNodeText = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypeText;
  tag: string;
  dom?: Node;
};

export type VNodeComp = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypeComp;
  tag: VNodeCompDefinition;
  attrs?: VNodeCompAttributes;
  //children?: VNodeFlatArray;
  dom?: Node;
  instance?: VNodeCompInstance;
};

export type VNodeHTML = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypeHTML;
  tag: "<";
  dom?: Node;
  domLength?: number;
};