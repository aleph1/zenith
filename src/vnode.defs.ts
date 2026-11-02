/* eslint-disable @typescript-eslint/no-explicit-any */
export const VNODE_ELEM = 1;
export const VNODE_TEXT = 2;
export const VNODE_COMP = 4;
export const VNODE_NODE = 8;
export const VNODE_COMPDEF = 16;
export const VNODE_TYPE_MASK = 31;

export interface VNodeElemAttributes {
  class?: string | string[];
  style?: string | Record<string, string | number | null | undefined>;
  $key?: string | number;
  $diff?: number;
  $remove?: boolean;
  is?: string;
  xmlns?: string;
  [property: string]: any;
}

export interface VNodeCompAttributes {
  $key?: string | number;
  $remove?: boolean;
  [property: string]: any;
}

export type VNodeAttrs = VNodeElemAttributes | VNodeCompAttributes;

export interface VNodeCompDefinition<
  A extends VNodeCompAttributes = VNodeCompAttributes,
  S = unknown
> {
  $t?: number;
  init?: (vNode: VNodeComp<A>) => S | void;
  draw: (vNode: VNodeComp<A, S>, oldChildren?: VNodeFlatArray) => VNodeAnyOrArray;
  drawn?: (vNode: VNodeComp<A, S>, isFirstDraw?: boolean) => void;
  remove?: (vNode: VNodeComp<A, S>) => Promise<void> | void;
  removed?: (vNode: VNodeComp<A, S>) => void;
  $memo?: boolean | ((newAttrs: A, oldAttrs: A) => boolean);
}

interface VNodeBase {
  $h?: boolean;
  $p: VNodeContainer | null;
  nodes: VNodeFlatArray | null;
  // The renderer stores different DOM element types here and assigns
  // dynamic DOM properties (including event handlers).
  el: any;
}

export interface VNodeElem extends VNodeBase {
  is: typeof VNODE_ELEM;
  $t: string;
  $d: null;
  attrs: VNodeElemAttributes;
  nodes: VNodeFlatArray;
}

export interface VNodeText extends VNodeBase {
  is: typeof VNODE_TEXT;
  $t: string;
  $d: null;
  attrs: null;
  nodes: null;
}

export interface VNodeComp<
  A extends VNodeCompAttributes = VNodeCompAttributes,
  S = Record<string, any> | undefined
> extends VNodeBase {
  is: typeof VNODE_COMP;
  $t: number;
  $d: VNodeCompDefinition;
  $r?: object | null;
  attrs: A;
  nodes: VNodeFlatArray;
  provide?: Record<string, any>;
  state: S; // application managed state
}

export interface VNodeNode extends VNodeBase {
  is: typeof VNODE_NODE;
  $t: number;
  $d: null;
  attrs: null;
  nodes: null;
}

export type VNodeCompAny = VNodeComp<any, any>;

export type VNode = VNodeElem | VNodeText | VNodeCompAny | VNodeNode;
export type VNodeAny = VNode;
export type VNodeContainer = VNodeCompAny | VNodeElem;
export type VNodeDrawable = VNodeCompAny;
export type VNodeHTML = VNodeElem;
export type VNodeDom = Node | Node[];

export type VNodeChild = VNodeAny | string | number | boolean | null | undefined;
export type VNodeArray = Array<VNodeChild | VNodeArray>;
export type VNodeAnyOrArray = VNodeChild | VNodeArray;

export interface VNodeFlatArray extends Array<VNodeAny> {
  $keys?: boolean;
}