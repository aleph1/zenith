/**
 * Checks a vnode's type, ignoring lifecycle flags.
 *
 * @example
 * if (vNodeIs(vNode, vNodeType.comp)) {
 *   // vNode is VNodeComp
 * }
 */
import type { VNodeAny } from '../vnode.defs';
export declare const vNodeType: {
    readonly elem: 1;
    readonly text: 2;
    readonly comp: 4;
    readonly node: 8;
};
/**
 * Checks a vnode's type, ignoring lifecycle flags.
 */
export declare const vNodeIs: <T extends VNodeAny["is"]>(vNode: VNodeAny, type: T) => vNode is Extract<VNodeAny, {
    is: T;
}>;
