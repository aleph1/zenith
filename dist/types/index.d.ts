declare global {
    interface Window {
        DEBUG?: boolean;
    }
}
import { VNODE_ELEM, VNODE_TEXT, VNODE_COMP, VNODE_NODE, VNODE_COMPDEF, VNodeElem, VNodeComp, VNodeNode, VNodeAny, VNodeArray, VNodeElemAttributes, VNodeCompAttributes, VNodeCompDefinition, VNodeContainer } from './vnode.defs';
declare const ns: {
    math: string;
    svg: string;
};
export declare const diff: {
    none: number;
    self: number;
    nodes: number;
    all: number;
};
export declare const sync: () => void;
export declare const redraw: {
    (vNode: VNodeContainer, surgical?: false): void;
    (vNode: VNodeComp, surgical: true): void;
};
export declare const elem: {
    (tag: string): VNodeElem;
    (tag: string, attrs: VNodeElemAttributes, ...args: VNodeArray): VNodeElem;
    (tag: string, ...args: VNodeArray): VNodeElem;
};
export declare const compDef: <A extends VNodeCompAttributes = VNodeCompAttributes, S = Record<string, unknown>>(componentDefinition: VNodeCompDefinition<A, S>) => VNodeCompDefinition<A, S>;
export declare const comp: <A extends VNodeCompAttributes, S>(componentDefinition: VNodeCompDefinition<A, S>, attrs?: A) => VNodeComp<A, S>;
export declare const node: (el: ChildNode) => VNodeNode;
export declare const bind: (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray | null) => VNodeComp;
export { ns, VNODE_COMP, VNODE_COMPDEF, VNODE_ELEM, VNODE_NODE, VNODE_TEXT };
