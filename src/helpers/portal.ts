import { bind, compDef, node } from 'zenith';
import type { VNode, VNodeArray, VNodeComp, VNodeCompDefinition } from '../vnode.defs';

interface PortalAttrs {
  to: string | Element;
  children: VNode | VNodeArray;
}

interface PortalState {
  container: HTMLDivElement;
  children: PortalAttrs['children'];
  pending: boolean;
  active: boolean;
}

// Component vnodes are replaced during reconciliation; the placeholder is stable.
const portals = new WeakMap<Node, PortalState>();

const definition: VNodeCompDefinition<PortalAttrs> & {
  to: (vNode: VNodeComp<PortalAttrs>) => Element | null;
} = {
  to: (vNode) => typeof vNode.attrs.to === 'string'
    ? document.querySelector(vNode.attrs.to)
    : vNode.attrs.to,

  draw: (_vNode, oldChildren) => oldChildren || node(
    document.createComment('') as unknown as Element
  ),

  drawn(vNode) {
    const placeholder = vNode.el;
    let state = portals.get(placeholder);

    if (!state) {
      state = {
        container: document.createElement('div'),
        children: vNode.attrs.children,
        pending: false,
        active: true
      };
      portals.set(placeholder, state);
    }

    const target = definition.to(vNode);
    if (target && state.container.parentNode !== target) {
      target.appendChild(state.container);
    }

    state.children = vNode.attrs.children;
    if (!state.pending) {
      state.pending = true;
      Promise.resolve().then(() => {
        state.pending = false;
        if (state.active) bind(state.container, state.children);
      });
    }
  },

  removed(vNode) {
    const state = portals.get(vNode.el);
    if (!state) return;

    state.active = false;
    bind(state.container, null);
    state.container.remove();
    portals.delete(vNode.el);
  }
};

/**
 * Render content into a separate DOM target with an independent Zenith root.
 *
 * comp(Portal, { to: '#modals', children: comp(Modal) })
 * comp(Portal, { to: document.body, children: comp(Modal) })
 */
export const Portal = compDef(definition) as typeof definition;
