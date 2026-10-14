import type { VNode, VNodeArray, VNodeComp, VNodeCompDefinition } from '../vnode.defs';
interface PortalAttrs {
    to: string | Element;
    children: VNode | VNodeArray;
}
declare const definition: VNodeCompDefinition<PortalAttrs> & {
    to: (vNode: VNodeComp<PortalAttrs>) => Element | null;
};
/**
 * Render content into a separate DOM target with an independent Zenith root.
 *
 * comp(Portal, { to: '#modals', children: comp(Modal) })
 * comp(Portal, { to: document.body, children: comp(Modal) })
 */
export declare const Portal: typeof definition;
export {};
