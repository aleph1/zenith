export const VNODE_ELEM = 1;
export const VNODE_TEXT = 2;
export const VNODE_COMP = 3;
export const VNODE_NODE = 4;
export const VNODE_COMPDEF = 5;

const enum VNODE_TYPE {
  ELEM = 1,
  TEXT = 2,
  COMP = 3,
  NODE = 4,
  COMPDEF = 5,
}

export interface VNodeElemAttributes {
  // The class name(s) for this virtual element, as a space-separated list.
  class?: string | Array<string>;
  // A key to optionally associate with this element.
  $key?: string | number;
  is?: string;
  style?: string | Record<string, string | number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
}

export interface VNodeCompAttributes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
}

export interface VNodeCompDefinition {
  is?: VNODE_TYPE.DEFC;
  init?: (vNode: VNodeComp) => void;
  draw: (vNode: VNodeComp, oldChildren?: VNodeFlatArray) => VNodeAnyOrArray;
  drawn?: (vNode: VNodeComp, isFirstDraw?: boolean) => void;
  remove?: (vNode: VNodeComp) => Promise<void> | void;
  $remove?: boolean;
  removed?: (vNode: VNodeComp) => void;
  $memo?: boolean | ((newAttrs: VNodeCompAttributes, oldAttrs: VNodeCompAttributes) => boolean);
}

export interface VNodeNodeAttributes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
}

interface VNodeAbstract {
  nodes?: VNodeFlatArray;
  attrs?: {
    [property: string]: string | number | ((event?: Event) => void);
  };
  parent?: VNodeContainer;
  removed?: boolean;
  //root?: VNodeRoot;
}

export type VNodeRoot = VNodeAbstract & {
  is: VNODE_TYPE.ROOT;
  tag: string;
  attrs: VNodeElemAttributes;
  dom: Element;
  $redraw?: boolean;
};

export type VNodeElem = VNodeAbstract & {
  is: VNODE_TYPE.ELEM;
  tag: string;
  attrs: VNodeElemAttributes;
  events?: Record<string, Function>;
  dom?: Element;
  $memo?: boolean | ((newAttrs: VNodeElemAttributes, oldAttrs: VNodeElemAttributes) => boolean);
};

export type VNodeText = VNodeAbstract & {
  is: VNODE_TYPE.TEXT;
  tag: string;
  dom?: Text;
};

export type VNodeComp = VNodeAbstract & {
  is: VNODE_TYPE.COMP;
  tag: VNodeCompDefinition;
  attrs?: VNodeCompAttributes;
  dom?: Element;
  f: number; // Flags: FLAG_REMOVED (1) | FLAG_STALE (2) | FLAG_REMOVE_CALLED (4)
};

export type VNodeNode = VNodeAbstract & {
  is: VNODE_TYPE.NODE;
  tag: string;
  dom?: Element;
};

export type VNodeDom = Element | Text | Array<ChildNode>;
export type VNodeDrawable = VNodeComp; // In case we add additional drawable types
export type VNodeContainer = VNodeComp | VNodeElem;
export type VNodeAny = VNodeElem | VNodeText | VNodeComp | VNodeNode;
export type VNodeArray = Array<VNodeAny | VNodeArray | boolean | undefined | string | number>;
export type VNodeAnyOrArray = VNodeAny | VNodeArray;

export interface VNodeFlatArray extends Array<VNodeAny> {
  $keys?: boolean;
}