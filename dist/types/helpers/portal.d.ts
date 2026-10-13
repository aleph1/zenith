import type { VNodeComp, VNodeCompDefinition, VNodeAnyOrArray } from '../vnode.defs';
interface PortalAttrs {
    to: string | Element;
    children: VNodeAnyOrArray;
}
/**
 * Renders children to a different DOM location.
 * Useful for modals, tooltips, and overlays that need
 * to escape their parent's stacking context or overflow.
 *
 * @example
 * comp(Portal, {
 *   to: '#modals',         // CSS selector
 *   to: document.body,     // or Element reference
 *   children: comp(Modal)
 * })
 */
export declare const Portal: VNodeCompDefinition<PortalAttrs> & {
    to: (vNode: VNodeComp<PortalAttrs>) => Element | null;
};
export {};
