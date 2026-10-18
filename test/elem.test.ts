import { describe, test, expect } from 'vitest';
import { elem } from '../src/index';
import { VNODE_ELEM } from '../src/vNode.defs';

describe('elem()', () => {

  test('elem("div") returns vnode with the expected properties', () => {
    const node = elem('div');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['is', '$t', '$d', 'attrs', 'nodes', '$p', 'el']);
    expect(node).toHaveProperty('is', VNODE_ELEM);
    expect(node).toHaveProperty('$t', 'div');
    expect(node).toHaveProperty('attrs', {});
    expect(node).toHaveProperty('nodes', []);
  });

  test('elem("div", {id:"test"}) returns vnode with the expected properties', () => {
    const node = elem('div', {id:'test'});
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['is', '$t', '$d', 'attrs', 'nodes', '$p', 'el']);
    expect(node).toHaveProperty('is', VNODE_ELEM);
    expect(node).toHaveProperty('$t', 'div');
    expect(typeof node.attrs).toBe('object');
    expect(node.attrs).toHaveOnlyProperties(['id']);
    expect(node.attrs).toHaveProperty('id', 'test');
    expect(node).toHaveProperty('nodes', []);
  });

  test('elem("div") returns vnode with empty attrs object', () => {
    const node = elem('div');
    expect(node.attrs).toEqual({});
  });

  test('elem("div", {id:"test"}) returns vnode with populated attrs object', () => {
    const node = elem('div', {id:'test'});
    expect(node.attrs).toEqual({id:'test'});
    expect(Object.isFrozen(node.attrs)).toBe(true);
  });

  test('Handles <svg>', () => {
    const node = elem('svg');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['is', '$t', '$d', 'attrs', 'nodes', '$p', 'el']);
    expect(node.is).toBe(VNODE_ELEM);
    expect(node.$t).toBe('svg');
    expect(node.attrs).toEqual({});
    expect(node.nodes).toEqual([]);
  });

  test('Handles <math>', () => {
    const node = elem('math');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['is', '$t', '$d', 'attrs', 'nodes', '$p', 'el']);
    expect(node.is).toBe(VNODE_ELEM);
    expect(node.$t).toBe('math');
    expect(node.attrs).toEqual({});
    expect(node.nodes).toEqual([]);
  });

  test('Handles children with keys', () => {
    const node1 = elem('div', {$key:1});
    const node2 = elem('div', {$key:2});
    elem('div', node1, node2);
    expect(node1.attrs.$key).toBe(1);
    expect(node2.attrs.$key).toBe(2);
  });

  test('Handles children with no keys', () => {
    const node1 = elem('div');
    const node2 = elem('div');
    elem('div', node1, node2);
    expect(node1.attrs.$key).toBe(undefined);
    expect(node2.attrs.$key).toBe(undefined);
  });

  test('Throws error on children with mixed keys', () => {
    expect(() => {
      elem('div',
        elem('div', {$key:1}),
        elem('div')
      );
    }).toThrow(Error);
  });

  test('Handles single elem() child', () => {
    const node = elem('div', elem('div'));
    expect(node.nodes).toHaveLength(1);
    expect(node.nodes[0]).toMatchObject({
      is: VNODE_ELEM,
      $t: 'div',
      attrs: {},
      nodes: [],
    });
  });

  test('Handles array with one elem()', () => {
    const node = elem('div', [elem('div')]);
    expect(node.nodes).toHaveLength(1);
    expect(node.nodes[0]).toMatchObject({
      is: VNODE_ELEM,
      $t: 'div',
      attrs: {},
      nodes: [],
    });
  });

  test('Handles multiple elem() children', () => {
    const node = elem('div', elem('div'), elem('p'));
    expect(node.nodes).toHaveLength(2);
    expect(node.nodes[0]).toMatchObject({
      is: VNODE_ELEM,
        $t: 'div',
      attrs: {},
      nodes: [],
    });
    expect(node.nodes[1]).toMatchObject({
      is: VNODE_ELEM,
      $t: 'p',
      attrs: {},
      nodes: [],
    });
  });

  test('Handles array with multiple elem() children', () => {
    const node = elem('div', [elem('div'), elem('p')]);
    expect(node.nodes).toHaveLength(2);
    expect(node.nodes.map(child => child.$t)).toEqual(['div', 'p']);
  });

  test('Filters null and undefined children', () => {
    const node = elem('div', null, elem('span'), undefined, elem('p'));
    expect(node.nodes).toHaveLength(2);
    expect(node.nodes.map(child => child.$t)).toEqual(['span', 'p']);
  });

  test('Filters boolean children', () => {
    const node = elem('div', false, elem('span'), true, elem('p'));
    expect(node.nodes).toHaveLength(2);
    expect(node.nodes.map(child => child.$t)).toEqual(['span', 'p']);
  });

  test('Filters nullish and boolean values from nested arrays', () => {
    const node = elem('div', [
      null,
      [elem('span'), undefined, false],
      true,
      [elem('p'), null],
    ]);
    expect(node.nodes).toHaveLength(2);
    expect(node.nodes.map(child => child.$t)).toEqual(['span', 'p']);
  });

  test('Handles only filtered children', () => {
    const node = elem('div', null, [undefined, false], true, [null]);
    expect(node.nodes).toHaveLength(0);
  });

});