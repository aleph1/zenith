import { redraw } from 'zenith';
import type { VNodeComp, VNodeCompDefinition, VNodeAnyOrArray } from '../vnode.defs';

interface RouterOptions {
  mode?: 'hash' | 'history';
}

type RouteComponent = (params: Record<string, string>) => VNodeAnyOrArray;

interface RouterRoutes {
  [pattern: string]: RouteComponent | undefined;
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
 * bind(document.body, comp(App));
 *
 * // History mode
 * bind(document.body, comp(router(routes, { mode: 'history' })));
 */
export const router = (
  routes: RouterRoutes,
  options: RouterOptions = {}
): VNodeCompDefinition => {
  const isHistory = options.mode === 'history';
  const eventType = isHistory ? 'popstate' : 'hashchange';
  const getPath = () => isHistory ? location.pathname : (location.hash.slice(1) || '/');

  const compiled: {
    regex: RegExp;
    keys: string[];
    component: RouteComponent;
  }[] = [];

  const fallback = routes['*'];

  const matchRoute = (path: string) => {
    for(const route of compiled) {
      const match = route.regex.exec(path);
      if(match) {
        const params: Record<string, string> = {};
        for(let i = 0; i < route.keys.length; i++) {
          params[route.keys[i]] = match[i + 1];
        }
        return { component: route.component, params };
      }
    }
    return { component: fallback, params: {} };
  };

  for(const pattern in routes) {
    if(pattern === '*') continue;

    const component = routes[pattern];
    if(!component) continue;

    const keys: string[] = [];
    const regexPattern = pattern
      .replace(/:[^/]+/g, match => {
        keys.push(match.slice(1));
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');

    compiled.push({
      regex: new RegExp(`^${regexPattern}$`),
      keys,
      component
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
        redraw(node, true);
      };

      window.addEventListener(eventType, node.onroute);
    },

    draw: (vNode: VNodeComp) => {
      const node = vNode as RouterVNode;
      console.log('Router draw:', node.route, node.params);
      return node.route ? node.route(node.params || {}) : null;
    },

    removed: (vNode: VNodeComp) => {
      const node = vNode as RouterVNode;
      if(node.onroute) {
        window.removeEventListener(eventType, node.onroute);
      }
    }
  };
};