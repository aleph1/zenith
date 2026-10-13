import { node } from 'zenith';
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
export const html = (value: string | number | bigint): VNodeNode | VNodeNode[] => {
  const container = document.createElement('div');
  container.innerHTML = value + '';
  const nodes = [...container.childNodes].map(child => node(child as Element));
  return nodes.length === 1 ? nodes[0] : nodes;
};