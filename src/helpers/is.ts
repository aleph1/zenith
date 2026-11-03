/**
 * Checks a vnode's type, ignoring lifecycle flags.
 *
 * @example
 * if (vNodeIs(vNode, vNodeType.comp)) {
 *   // vNode is VNodeComp
 * }
 */

import {
  VNODE_ELEM,
  VNODE_TEXT,
  VNODE_COMP,
  VNODE_NODE,
} from '../vnode.defs';

import type { VNodeAny } from '../vnode.defs';

export const vNodeType = {
  elem: VNODE_ELEM,
  text: VNODE_TEXT,
  comp: VNODE_COMP,
  node: VNODE_NODE,
} as const;

/**
 * Checks a vnode's type, ignoring lifecycle flags.
 */
export const vNodeIs = <T extends VNodeAny['is']>(
  vNode: VNodeAny,
  type: T
): vNode is Extract<VNodeAny, { is: T }> =>
  !!(vNode.is & type);
