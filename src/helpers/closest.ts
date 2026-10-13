import type { VNode } from '../vnode.defs';

/**
 * Finds the closest ancestor vNode matching the predicate.
 * Walks up the tree from the given vNode's parent.
 * Returns undefined if no match is found.
 *
 * @example
 * // Find the closest list component ancestor
 * const list = closest(vNode, n => n.is === is.comp && n.$def === List);
 *
 * // Find the closest ancestor with a specific attribute
 * const themed = closest(vNode, n => n.attrs?.theme);
 */
export const closest = (vNode: VNode, predicate: (vNode: VNode) => boolean): VNode | undefined => {
  for (let current = vNode.up; current; current = current.up) {
    if (predicate(current)) return current;
  }
};