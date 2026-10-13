import { draw } from 'zenith';
import type { VNodeComp, VNodeCompDefinition, VNodeAnyOrArray } from '../vnode.defs';

interface RouterOptions {
  mode?: 'hash' | 'history';
}

type RouteComponent = (params: Record<string, string>) => VNodeAnyOrArray;

interface RouterRoutes {
  [pattern: string]: RouteComponent;
  '*'?: RouteComponent;
}

interface RouterVNode extends VNodeComp {
  route?: RouteComponent;
  params?: Record<string, string>;
  onroute?: () => void;
}

/**
 * Creates a hash or history-based router as a component definition.
 * Supports dynamic params (:id) and wildcard routes (*).
 *
 * @example
 * const App = router({
 *   '/': () => comp(Home),
 *   '/users/:id': ({ id }) => comp(User, { id }),
 *   '*': () => comp(NotFound)
 * });
 *
 * // Hash mode (default)
 * draw(comp(App), document.body);
 *
 * // History mode
 * draw(comp(router(routes, { mode: 'history' })), document.body);
 */
export const router = (routes: RouterRoutes, options: RouterOptions = {}): VNodeCompDefinition => {
  const isHistory = options.mode === 'history';
  const eventType = isHistory ? 'popstate' : 'hashchange';
  const getPath = () => isHistory ? location.pathname : (location.hash.slice(1) || '/');
  const compiled: { regex: RegExp; keys: string[]; component: RouteComponent }[] = [];

  const matchRoute = (path: string) => {
    for (const route of compiled) {
      const match = path.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        for (let i = 0; i < route.keys.length; i++) {
          params[route.keys[i]] = match[i + 1];
        }
        return { component: route.component, params };
      }
    }
    return { component: routes['*'] || null, params: {} };
  };

  for (const pattern in routes) {
    const keys: string[] = [];
    const regexPattern = pattern
      .replace(/:[^/]+/g, (match) => {
        keys.push(match.slice(1));
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');
    compiled.push({
      regex: new RegExp(`^${regexPattern}$`),
      keys,
      component: routes[pattern]
    });
  }

  return {
    init: (vNode: VNodeComp) => {
      const node = vNode as RouterVNode;
      const matched = matchRoute(getPath());

      node.route = matched.component;
      node.params = matched.params;
      node.onroute = () => {
        const matched = matchRoute(getPath());
        node.route = matched.component;
        node.params = matched.params;
        draw(node, true);
      };

      window.addEventListener(eventType, node.onroute);
    },

    draw: (vNode: VNodeComp) => {
      const node = vNode as RouterVNode;
      return node.route?.(node.params);
    },

    removed: (vNode: VNodeComp) => {
      const node = vNode as RouterVNode;
      if (node.onroute) {
        window.removeEventListener(eventType, node.onroute);
      }
    }
  };
};