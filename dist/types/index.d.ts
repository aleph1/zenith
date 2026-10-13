declare global {
    interface Window {
        DEBUG?: boolean;
    }
}
import { VNodeElem, VNodeComp, VNodeNode, VNodeAny, VNodeArray, VNodeElemAttributes, VNodeCompAttributes, VNodeCompDefinition, VNodeContainer } from './vnode.defs';
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
export declare const draw: (vNode: VNodeContainer, surgical?: boolean) => void;
export declare const elem: {
    (tag: string): VNodeElem;
    (tag: string, attrs: VNodeElemAttributes, ...args: VNodeArray): VNodeElem;
    (tag: string, ...args: VNodeArray): VNodeElem;
};
export declare const compDef: (componentDefinition: VNodeCompDefinition) => VNodeCompDefinition;
export declare const comp: (componentDefinition: VNodeCompDefinition, attrs?: VNodeCompAttributes) => VNodeComp;
export declare const node: (el: Element) => VNodeNode;
export declare const bind: (el: Element, vNodeAnyOrArray: VNodeAny | VNodeArray) => VNodeComp;
export { ns };
