import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('z.elem()', () => {

	test('z.elem("div") returns an object with the expected properties', () => {
	  const node = z.elem('div');
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
	  expect(node).toHaveProperty('type', VNodeTypes.elem);
	  expect(node).toHaveProperty('tag', 'div');
	  expect(node).toHaveProperty('attrs', {});
	  expect(node).toHaveProperty('children', []);
	});

	test('z.elem("div", {id:"test"}) returns an object with the expected properties', () => {
	  const node = z.elem('div', {id:'test'});
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
	  expect(node).toHaveProperty('type', VNodeTypes.elem);
	  expect(node).toHaveProperty('tag', 'div');
	  expect(typeof node.attrs).toBe('object');
	  expect(node.attrs).toHaveOnlyProperties(['id']);
	  expect(node.attrs).toHaveProperty('id', 'test');
	  expect(node).toHaveProperty('children', []);
	});

	test('z.elem("div") returns a vNode with a frozen empty attrs object', () => {
	  const node = z.elem('div');
	  expect(node.attrs).toEqual({});
	  expect(Object.isFrozen(node.attrs)).toBe(true);
	});

	test('z.elem("div", {id:"test"}) returns a vNode with a frozen attrs object with the expected properties', () => {
	  const node = z.elem('div', {id:'test'});
	  expect(node.attrs).toEqual({id:'test'});
	  expect(Object.isFrozen(node.attrs)).toBe(true);
	});

	test('Handles <svg>', () => {
	  const node = z.elem('svg');
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
	  expect(node.type).toBe(VNodeTypes.elem);
	  expect(node.tag).toBe('svg');
	  expect(node.attrs).toEqual({});
	  expect(node.children).toEqual([]);
	});

	test('Handles <math>', () => {
	  const node = z.elem('math');
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
	  expect(node.type).toBe(VNodeTypes.elem);
	  expect(node.tag).toBe('math');
	  expect(node.attrs).toEqual({});
	  expect(node.children).toEqual([]);
	});

	test('Attempting to modify attrs throws an error', () => {
	  const node = z.elem('div');
	  expect(() => {
	    node.attrs.id = 'test';
	  }).toThrow(Error);
	});

	test('Handles children with keys', () => {
	  const node1 = z.elem('div', {key:1});
	  const node2 = z.elem('div', {key:2});
	  z.elem('div', node1, node2);
	  expect(node1.attrs.key).toBe(1);
	  expect(node2.attrs.key).toBe(2);
	});

	test('Handles children with no keys', () => {
	  const node1 = z.elem('div');
	  const node2 = z.elem('div');
	  z.elem('div', node1, node2);
	  expect(node1.attrs.key).toBe(undefined);
	  expect(node2.attrs.key).toBe(undefined);
	});

	test('Throws error on children with mixed keys', () => {
	  expect(() => {
	    z.elem('div',
	      z.elem('div', {key:1}),
	      z.elem('div')
	    );
	  }).toThrow(Error);
	});

	test('Handles single z.elem() child', () => {
	  const node = z.elem('div', z.elem('div'));
	  expect(node.children).toEqual([{
	    tag: 'div',
	    type: VNodeTypes.elem,
	    attrs: {},
	    children: [],
	  }]);
	});

	test('Handles array with one z.elem()', () => {
	  const node = z.elem('div', [z.elem('div')]);
	  expect(node.children).toEqual([{
	    tag: 'div',
	    type: VNodeTypes.elem,
	    attrs: {},
	    children: [],
	  }]);
	});

	test('Handles multiple z.elem() children', () => {
	  const node = z.elem('div', z.elem('div'), z.elem('p'));
	  expect(node.children).toEqual([
	    {
	      tag: 'div',
	      type: VNodeTypes.elem,
	      attrs: {},
	      children: [],
	    },
	    {
	      tag: 'p',
	      type: VNodeTypes.elem,
	      attrs: {},
	      children: [],
	    }
	  ]);
	});

	test('Handles array with multiple z.elem() children', () => {
	  const node = z.elem('div', [z.elem('div'), z.elem('p')]);
	  expect(node.children).toEqual([
	    {
	      tag: 'div',
	      type: VNodeTypes.elem,
	      attrs: {},
	      children: [],
	    },
	    {
	      tag: 'p',
	      type: VNodeTypes.elem,
	      attrs: {},
	      children: [],
	    }
	  ]);
	});

	test('Handles single null child', () => {
	  const node = z.elem('div', null);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single null child array', () => {
	  const node = z.elem('div', [null]);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single undefined child', () => {
	  const node = z.elem('div', undefined);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single undefined child array', () => {
	  const node = z.elem('div', [undefined]);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single false child', () => {
	  const node = z.elem('div', false);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single false child array', () => {
	  const node = z.elem('div', [false]);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single true child', () => {
	  const node = z.elem('div', true);
	  expect(node.children).toEqual([null]);
	});

	test('Handles single true child array', () => {
	  const node = z.elem('div', [true]);
	  expect(node.children).toEqual([null]);
	});

	test('Handles multiple null children', () => {
	  const node = z.elem('div', null, null);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles mixed null children', () => {
	  const node = z.elem('div', null, [null]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple null children array', () => {
	  const node = z.elem('div', [null, null]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple undefined children', () => {
	  const node = z.elem('div', undefined, undefined);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple undefined children array', () => {
	  const node = z.elem('div', [undefined, undefined]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles mixed undefined children', () => {
	  const node = z.elem('div', undefined, [undefined]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple false children', () => {
	  const node = z.elem('div', false, false);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple false children array', () => {
	  const node = z.elem('div', [false, false]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles mixed false children', () => {
	  const node = z.elem('div', false, [false]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple true children', () => {
	  const node = z.elem('div', true, true);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles multiple true children array', () => {
	  const node = z.elem('div', [true, true]);
	  expect(node.children).toEqual([null, null]);
	});

	test('Handles mixed true children', () => {
	  const node = z.elem('div', true, [true]);
	  expect(node.children).toEqual([null, null]);
	});

});