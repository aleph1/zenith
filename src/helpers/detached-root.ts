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

import { bind, compDef } from '../index';
import type {
  VNodeComp,
  VNodeCompAttributes,
  VNodeCompDefinition,
  VNodeAny,
  VNodeArray
} from '../vnode.defs';

interface DetachedRootAttrs extends VNodeCompAttributes {
  to: string | Element;
  children: VNodeAny | VNodeArray;
}

interface DetachedRootState {
  host: HTMLDivElement;
  active: boolean;
  pending: boolean;
}

const states = new WeakMap<VNodeComp<DetachedRootAttrs>, DetachedRootState>();
const definition: VNodeCompDefinition<DetachedRootAttrs> = {
  init(vNode) {
    states.set(vNode, {
      host: document.createElement('div'),
      active: true,
      pending: false
    });
  },

  draw: () => null,

  drawn(vNode) {
    const state = states.get(vNode);
    if (!state) return;

    const to = vNode.attrs.to;
    const target = typeof to === 'string'
      ? document.querySelector(to)
      : to;

    if (target) {
      if (state.host.parentNode !== target) {
        target.appendChild(state.host);
      }
    } else {
      state.host.remove();
    }

    if (state.pending) return;
    state.pending = true;

    Promise.resolve().then(() => {
      state.pending = false;

      if (state.active && state.host.parentNode) {
        bind(state.host, vNode.attrs.children);
      }
    });
  },

  removed(vNode) {
    const state = states.get(vNode);
    if (!state) return;

    state.active = false;
    bind(state.host, null);
    state.host.remove();
    states.delete(vNode);
  }
};

export const DetachedRoot = compDef(definition) as typeof definition;
