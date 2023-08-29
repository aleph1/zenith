// defintion types
export type DefTypeComp = 1;
export const DEF_TYPE_COMP: DefTypeComp = 1;

export const enum VNodeTypes {
  none,
  compDef,
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
  // The class name(s) for this virtual element, as a space-separated list.
  class?: string | Array<string>;
  // A key to optionally associate with this element.
  key?: string | number;
  is?: string;
  type?: string;
  //keep?: number | boolean;
  tick?: (vNode: VNodeElem, tickCount: number) => void;
  style?: string | {
    [property: string]: any;
  };
  // Any virtual element properties (attributes and event handlers).
  [property: string]: any;
}

export interface VNodeCompAttributes {
  key?: string | number;
  // Any virtual element properties (e.g., attributes and event handlers).
  [property: string]: any;
}

export interface VNodeCompDefinition {
  init?: (vNode: VNodeComp) => void;
  draw: (vNode: VNodeComp, oldChildren: VNodeFlatArray) => VNodeAnyOrArray;
  //drawOnce?: boolean; // defaults to false
  tick?: (vNode: VNodeComp, tickCount: number) => void;
  drawn?: (vNode: VNodeComp) => void;
  remove?: (vNode: VNodeComp) => Promise<any>;
  destroy?: (vNode: VNodeComp) => void;
  type?: VNodeTypes.compDef;
}

interface VNodeAbstract {
  type: VNodeTypes.none;
  children?: VNodeFlatArray;
  //index?: number;
  //keys?: boolean;
  attrs?: {
    [property: string]: string | number | ((event?: Event) => void);
  };
  parent?: VNodeContainer;
  removing?: boolean;
}

export type VNodeElem = Omit<VNodeAbstract, 'type' | 'attrs'> & {
  type: VNodeTypes.elem;
  tag: string;
  attrs: VNodeElemAttributes;
  events?: {
    [property: string]: any;
  };
  dom?: Element;
  state?: {
    [property: string]: any;
  }
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
  dom?: Element;
  doms?: Array<ChildNode>;
  redraw?: (now?: boolean) => void;
  //keep?: number;
};

export type VNodeHTML = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypes.html;
  tag: string;
  dom?: Element;
  doms?: Array<ChildNode>;
};

export type VNodeDrawable = VNodeComp; // in case we add additional drawable types
export type VNodeContainer = VNodeElem | VNodeComp;
export type VNodeAny = VNodeElem | VNodeText | VNodeComp | VNodeHTML;
export type VNodeArray = Array<VNodeElem | VNodeText | VNodeComp | VNodeHTML | VNodeArray | boolean | undefined | string | number>;
export type VNodeFlatArray = Array<VNodeAny>;
export type VNodeAnyOrArray = VNodeAny | VNodeArray;