import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('z.node()', () => {

	test('z.node(elem) returns an object with the expected properties', () => {
		const elem = document.createElement('div');
	  const node = z.node(elem);
	  expect(node).toHaveProperty('type');
	  expect(node).toHaveProperty('tag');
	  expect(node).toHaveProperty('attrs');
	  expect(node).toHaveProperty('dom');
	});

	test('z.node(elem) returns an object with correct properties', () => {
		const elem = document.createElement('div');
	  const node = z.node(elem);
	  expect(node.type).toEqual(VNodeTypes.node);
	  expect(node.tag).toEqual('div');
	  expect(node.attrs).toEqual({});
	  expect(node.dom).toBe(elem);
	});

	test('z.node(elem) works with <svg>', () => {
		const elem = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	  const node = z.node(elem);
	  expect(node.tag).toBe('svg');
	  expect(node.dom).toBe(elem);
	});

	test('z.node(elem) works with <math>', () => {
		const elem = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math')
	  const node = z.node(elem);
	  expect(node.tag).toBe('math');
	  expect(node.dom).toBe(elem);
	});

	test('z.node(elem) works with custom nodes', () => {
		class CustomElem extends HTMLElement {
			constructor() {
				super();
			}
		}
		customElements.define('custom-elem', CustomElem, { extends: 'div' });
		const wrap = document.createElement('div');
		const html = '<custom-elem></custom-elem>';
		wrap.insertAdjacentHTML('beforeend' , html);
		const elem = wrap.firstChild as Element;
	  const node = z.node(elem);
	  expect(node.tag).toBe('custom-elem');
	  expect(node.dom).toBe(elem);
	});

});