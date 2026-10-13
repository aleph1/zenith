import {
  VNODE_ELEM,
  VNODE_TEXT,
  VNODE_COMP,
  VNODE_NODE,
  VNODE_COMPDEF,
} from '../vnode.defs';

/**
 * vNode type constants for use with predicate checks.
 *
 * @example
 * if (vNode.is === is.elem) // is a DOM element
 * if (vNode.is === is.comp) // is a component
 */
export const is = {
  elem: VNODE_ELEM,
  text: VNODE_TEXT,
  comp: VNODE_COMP,
  node: VNODE_NODE,
  compDef: VNODE_COMPDEF,
};