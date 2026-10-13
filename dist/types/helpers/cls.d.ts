/**
 * Combines class names, filtering out falsy values.
 *
 * @example
 * cls('btn', isActive && 'btn-active', hasError && 'btn-error')
 * // => 'btn btn-active' (if isActive, not hasError)
 */
export declare const cls: (...args: (string | false | null | undefined | 0)[]) => string;
