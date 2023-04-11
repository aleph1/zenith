// defintion types
export type DefTypeComp = 1;
export const DEF_TYPE_COMP: DefTypeComp = 1;

export const enum VNodeTypes {
  none,
  defn,
  elem,
  text,
  comp,
  html,
}

export const enum DrawModes {
  raf,
  now,
}

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
  draw: Function;
  drawOnce?: boolean; // defaults to false
  tick?: Function;
  drawn?: Function;
  destroy?: Function;
  type?: VNodeTypes.defn;
  //state?: Function | Boolean;
  //defaultState?: Function;
}

//export interface VNodeCompInstance {
//  attrs: VNodeCompAttributes;
//  state?: Object;
//  redraw: Function;
//};

export interface VNodeAbstract {
  type: VNodeTypes.none;
  parent?: VNodeAny;
  index?: number;
  children?: VNodeFlatArray;
  keys?: Boolean;
  attrs?: {
    [property: string]: any;
  };
}

export type VNodeElem = Omit<VNodeAbstract, 'type' | 'attrs'> & {
  type: VNodeTypes.elem;
  tag: string;
  attrs: VNodeElemAttributes;
  //children: VNodeFlatArray;
  dom?: Element;
};

export type VNodeText = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypes.text;
  tag: string;
  dom?: Text;
};

export type VNodeComp = Omit<VNodeAbstract, 'type' | 'attrs'> & {
  type: VNodeTypes.comp;
  tag: VNodeCompDefinition;
  attrs?: VNodeCompAttributes;
  //children?: VNodeFlatArray;
  dom?: Element;
  //instance?: VNodeCompInstance;
  redraw?: Function;
  state?: Object;
  destroyState?: Function;
};

export type VNodeHTML = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypes.html;
  tag: string;
  dom?: Array<ChildNode>;
  length?: number;
};

export type VNodeDrawable = VNodeComp; // in case we add additional drawable types
export type VNodeContainer = VNodeElem | VNodeComp;
export type VNodeAny = VNodeElem | VNodeText | VNodeComp | VNodeHTML;
export type VNodeArray = Array<VNodeElem | VNodeText | VNodeComp | VNodeHTML | VNodeArray | boolean | undefined | string | number>;
export type VNodeFlatArray = Array<VNodeAny>;
export type VNodeAnyOrArray = VNodeAny | VNodeArray;