// defintion types
export type DefTypeComp = 1;
export const DEF_TYPE_COMP: DefTypeComp = 1;

export const enum VNodeTypes {
  none,
  root,
  elem,
  text,
  comp,
  node,
  html,
  //func,
  compDef,
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
  removed?: boolean;
  root?: VNodeRoot;
}

export type VNodeRoot = Omit<VNodeAbstract, 'type' | 'attrs'> & {
  type: VNodeTypes.root;
  tag: string;
  attrs: VNodeElemAttributes;
  dom: Element;
  redraw?: boolean;
};

export type VNodeElem = Omit<VNodeAbstract, 'type' | 'attrs'> & {
  type: VNodeTypes.elem;
  tag: string;
  attrs: VNodeElemAttributes;
  events?: {
    [property: string]: any;
  };
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
  dom?: Element;
  doms?: Array<ChildNode>;
  draw?: (now?: boolean) => void;
  //redraw?: boolean;
  //redrawn?: boolean;
  //keep?: number;
};

export type VNodeNode = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypes.node;
  tag: string;
  dom?: Element;
};

export type VNodeHTML = Omit<VNodeAbstract, 'type'> & {
  type: VNodeTypes.html;
  tag: string;
  dom?: Element;
  doms?: Array<ChildNode>;
};

export type VNodeDom = Element | Text | Array<ChildNode>;
export type VNodeDrawable = VNodeComp; // in case we add additional drawable types
export type VNodeContainer = VNodeComp | VNodeElem;
export type VNodeAny = VNodeElem | VNodeText | VNodeComp | VNodeHTML | VNodeNode;
export type VNodeArray = Array<VNodeElem | VNodeText | VNodeComp | VNodeHTML | VNodeNode | VNodeArray | boolean | undefined | string | number>;
export type VNodeFlatArray = Array<VNodeAny>;
export type VNodeAnyOrArray = VNodeAny | VNodeArray;