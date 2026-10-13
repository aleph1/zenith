import type { VNodeNode } from '../vnode.defs';
/**
 * Converts an HTML string to DOM nodes wrapped in node() vnodes.
 *
 * XSS WARNING: Only use with trusted, sanitized HTML.
 * Never pass user-generated content without sanitization.
 *
 * @example
 * // Safe static content
 * html('<div class="card"><h2>Title</h2></div>')
 *
 * // Unsafe user input
 * html(`<div>${userInput}</div>`)
 *
 * // Safe alternative
 * elem('div', userInput)
 *
 * @see https://owasp.org/www-community/attacks/xss/
 */
export declare const html: (value: string | number | bigint) => VNodeNode | VNodeNode[];
