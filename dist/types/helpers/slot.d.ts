import type { VNode, VNodeAttrs } from '../vnode.defs';
/**
 * Resolves a content slot to a renderable vNode.
 * Supports multiple content formats for flexible component APIs.
 *
 * - string → returned as-is
 * - function → called with attrs, returns result
 * - array → each item recursively resolved
 * - vNode → returned as-is
 * - null / undefined → returns nothing
 *
 * Note: component definitions must be wrapped in comp() by the caller.
 *
 * @example
 * const Card = compDef({
 *   draw: (vNode) => elem('div', { class: 'card' },
 *     slot(vNode.attrs.header, vNode.attrs),
 *     slot(vNode.attrs.children, vNode.attrs)
 *   )
 * });
 *
 * // Usage
 * comp(Card, {
 *   header: elem('h2', 'Title'),              // vNode
 *   children: (attrs) => elem('p', 'Hi'),     // function
 *   children: comp(Modal, { ... }),           // wrap in comp() explicitly
 * })
 */
export declare const slot: (content: VNode | VNode[] | string | ((attrs: VNodeAttrs) => VNode | VNode[] | string) | null | undefined, attrs: VNodeAttrs) => VNode | VNode[] | string | undefined;
