import type { VNode } from '../vnode.defs';
/**
 * Retrieves values provided by ancestor components.
 * Walks up the tree collecting requested keys, with closer
 * ancestors taking priority (shadowing).
 * Returns an object with only the keys that were found.
 *
 * @example
 * const { theme, locale } = inject(vNode, 'theme', 'locale');
 */
export declare const inject: (vNode: VNode, ...keys: string[]) => Record<string, any>;
