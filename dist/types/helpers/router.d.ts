import type { VNodeCompDefinition, VNodeAnyOrArray } from '../vnode.defs';
interface RouterOptions {
    mode?: 'hash' | 'history';
}
type RouteComponent = (params: Record<string, string>) => VNodeAnyOrArray;
interface RouterRoutes {
    [pattern: string]: RouteComponent | undefined;
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
export declare const router: (routes: RouterRoutes, options?: RouterOptions) => VNodeCompDefinition;
export {};
