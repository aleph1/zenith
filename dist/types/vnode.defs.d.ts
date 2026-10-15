export declare const VNODE_ELEM = 1;
export declare const VNODE_TEXT = 2;
export declare const VNODE_COMP = 3;
export declare const VNODE_NODE = 4;
export declare const VNODE_COMPDEF = 5;
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
    to?: string | Element;
    [property: string]: any;
}
export type VNodeAttrs = VNodeElemAttributes | VNodeCompAttributes;
export interface VNodeNodeAttributes {
    [property: string]: any;
}
export interface VNodeCompDefinition<A extends VNodeCompAttributes = VNodeCompAttributes> {
    $t?: number;
    init?: (vNode: VNodeComp<A>) => void;
    draw: (vNode: VNodeComp<A>, oldChildren?: VNodeFlatArray) => VNodeAnyOrArray;
    drawn?: (vNode: VNodeComp<A>, isFirstDraw?: boolean) => void;
    remove?: (vNode: VNodeComp<A>) => Promise<void> | void;
    removed?: (vNode: VNodeComp<A>) => void;
    $memo?: boolean | ((newAttrs: A, oldAttrs: A) => boolean);
}
interface VNodeBase {
    $h?: boolean;
    up: VNodeContainer | null;
    nodes: VNodeFlatArray | null;
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
export interface VNodeComp<A extends VNodeCompAttributes = VNodeCompAttributes> extends VNodeBase {
    is: typeof VNODE_COMP;
    $t: number;
    $d: VNodeCompDefinition;
    attrs: A;
    nodes: VNodeFlatArray;
    provide?: Record<string, any>;
}
export interface VNodeNode extends VNodeBase {
    is: typeof VNODE_NODE;
    $t: number;
    $d: null;
    attrs: null;
    nodes: null;
}
export type VNode = VNodeElem | VNodeText | VNodeComp | VNodeNode;
export type VNodeAny = VNode;
export type VNodeContainer = VNodeComp | VNodeElem;
export type VNodeDrawable = VNodeComp;
export type VNodeHTML = VNodeElem;
export type VNodeDom = Node | Node[];
export type VNodeChild = VNodeAny | string | number | boolean | null | undefined;
export type VNodeArray = Array<VNodeChild | VNodeArray>;
export type VNodeAnyOrArray = VNodeChild | VNodeArray;
export interface VNodeFlatArray extends Array<VNodeAny> {
    $keys?: boolean;
}
export {};
