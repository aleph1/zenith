/**
 * A memoization predicate that prevents all re-renders.
 * Pass to a component's $memo property to make it fully static.
 *
 * @example
 * const Static = compDef({
 *   $memo: keep,
 *   draw: () => elem('div', 'I never re-render')
 * });
 */
export const keep = () => true;