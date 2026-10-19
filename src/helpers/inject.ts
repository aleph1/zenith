/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VNode } from '../vnode.defs';
import { VNODE_COMP } from '../vnode.defs';

/**
 * Retrieves values provided by ancestor components.
 * Walks up the tree collecting requested keys, with closer
 * ancestors taking priority (shadowing).
 * Returns an object with only the keys that were found.
 *
 * @example
 * const { theme, locale } = inject(vNode, 'theme', 'locale');
 */
export const inject = (vNode: VNode, ...keys: string[]): Record<string, any> => {
  const result: Record<string, any> = {};
  const needed = new Set(keys);
  for (let current = vNode.$p; current && needed.size > 0; current = current.$p) {
    if ((current.is & VNODE_COMP) && current.provide) {
      for (const key of needed) {
        if (current.provide[key] !== undefined) {
          result[key] = current.provide[key];
          needed.delete(key);
        }
      }
    }
  }
  return result;
};