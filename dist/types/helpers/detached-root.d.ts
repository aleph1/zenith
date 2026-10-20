/**
 * Renders children into another DOM location using an independent
 * Zenith root. Useful for modals, popovers, and overlays.
 *
 * Unlike native portals:
 * - Children do not inherit the originating component's ancestry
 *   or injected context.
 * - Events follow the destination DOM tree.
 * - An extra wrapper <div> is inserted into the target.
 * - Rendering into the target is deferred to a microtask.
 *
 * The helper manages mounting, updates, and cleanup, but not
 * stacking, positioning, focus, or accessibility.
 *
 * @example
 * comp(DetachedRoot, {
 *   to: document.body, // Or a CSS selector such as '#modals'
 *   children: comp(Modal)
 * });
 */
import type { VNodeCompAttributes, VNodeCompDefinition, VNodeAny, VNodeArray } from '../vnode.defs';
interface DetachedRootAttrs extends VNodeCompAttributes {
    to: string | Element;
    children: VNodeAny | VNodeArray;
}
declare const definition: VNodeCompDefinition<DetachedRootAttrs>;
export declare const DetachedRoot: typeof definition;
export {};
