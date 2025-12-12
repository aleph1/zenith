import { describe, test, expect } from 'vitest';
import {
  elem
} from '../src/index';
import {
  VNODE_ELEM
} from '../src/vNode.defs';

describe('elem()', () => {

  test('elem("div") returns an object with the expected properties', () => {
    const node = elem('div');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(node).toHaveProperty('type', VNODE_ELEM);
    expect(node).toHaveProperty('tag', 'div');
    expect(node).toHaveProperty('attrs', {});
    expect(node).toHaveProperty('children', []);
  });

  test('elem("div", {id:"test"}) returns an object with the expected properties', () => {
    const node = elem('div', {id:'test'});
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(node).toHaveProperty('type', VNODE_ELEM);
    expect(node).toHaveProperty('tag', 'div');
    expect(typeof node.attrs).toBe('object');
    expect(node.attrs).toHaveOnlyProperties(['id']);
    expect(node.attrs).toHaveProperty('id', 'test');
    expect(node).toHaveProperty('children', []);
  });

  test('elem("div") returns a vNode with a frozen empty attrs object', () => {
    const node = elem('div');
    expect(node.attrs).toEqual({});
    expect(Object.isFrozen(node.attrs)).toBe(true);
  });

  test('elem("div", {id:"test"}) returns a vNode with a frozen attrs object with the expected properties', () => {
    const node = elem('div', {id:'test'});
    expect(node.attrs).toEqual({id:'test'});
    expect(Object.isFrozen(node.attrs)).toBe(true);
  });

  test('Handles <svg>', () => {
    const node = elem('svg');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(node.type).toBe(VNODE_ELEM);
    expect(node.tag).toBe('svg');
    expect(node.attrs).toEqual({});
    expect(node.children).toEqual([]);
  });

  test('Handles <math>', () => {
    const node = elem('math');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(node.type).toBe(VNODE_ELEM);
    expect(node.tag).toBe('math');
    expect(node.attrs).toEqual({});
    expect(node.children).toEqual([]);
  });

  test('Attempting to modify attrs throws an error', () => {
    const node = elem('div');
    expect(() => {
      node.attrs.id = 'test';
    }).toThrow(Error);
  });

  test('Handles children with keys', () => {
    const node1 = elem('div', {key:1});
    const node2 = elem('div', {key:2});
    elem('div', node1, node2);
    expect(node1.attrs.key).toBe(1);
    expect(node2.attrs.key).toBe(2);
  });

  test('Handles children with no keys', () => {
    const node1 = elem('div');
    const node2 = elem('div');
    elem('div', node1, node2);
    expect(node1.attrs.key).toBe(undefined);
    expect(node2.attrs.key).toBe(undefined);
  });

  test('Throws error on children with mixed keys', () => {
    expect(() => {
      elem('div',
        elem('div', {key:1}),
        elem('div')
      );
    }).toThrow(Error);
  });

  test('Handles single elem() child', () => {
    const node = elem('div', elem('div'));
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'div',
      attrs: {},
      children: [],
    });
  });

  test('Handles array with one elem()', () => {
    const node = elem('div', [elem('div')]);
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'div',
      attrs: {},
      children: [],
    });
  });

  test('Handles multiple elem() children', () => {
    const node = elem('div', elem('div'), elem('p'));
    expect(node.children).toHaveLength(2);
    expect(node.children[0]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'div',
      attrs: {},
      children: [],
    });
    expect(node.children[1]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'p',
      attrs: {},
      children: [],
    });
  });

  test('Handles array with multiple elem() children', () => {
    const node = elem('div', [elem('div'), elem('p')]);
    expect(node.children).toHaveLength(2);
    expect(node.children[0]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'div',
      attrs: {},
      children: [],
    });
    expect(node.children[1]).toMatchObject({
      type: VNODE_ELEM,
      tag: 'p',
      attrs: {},
      children: [],
    });
  });

  test('Filters nulls mixed with elements', () => {
    const node = elem('div', null, elem('span'), null);
    expect(node.children.length).toBe(1);
    expect(node.children[0].tag).toBe('span');
  });

  test('Filters nulls mixed with elements in array', () => {
    const node = elem('div', [null, elem('span'), null, elem('p'), undefined]);
    expect(node.children.length).toBe(2);
    expect(node.children[0].tag).toBe('span');
    expect(node.children[1].tag).toBe('p');
  });

  test('Filters booleans mixed with elements', () => {
    const node = elem('div', false, elem('span'), true, elem('p'));
    expect(node.children.length).toBe(2);
    expect(node.children[0].tag).toBe('span');
    expect(node.children[1].tag).toBe('p');
  });

  test('Filters mixed nullish values with elements', () => {
    const node = elem('div', [null, elem('span'), undefined, false, elem('p'), true]);
    expect(node.children.length).toBe(2);
    expect(node.children[0].tag).toBe('span');
    expect(node.children[1].tag).toBe('p');
  });

  test('Filters single null child', () => {
    const node = elem('div', null);
    expect(node.children.length).toBe(0);
  });

  test('Filters single null child array', () => {
    const node = elem('div', [null]);
    expect(node.children.length).toBe(0);
  });

  test('Filters single undefined child', () => {
    const node = elem('div', undefined);
    expect(node.children.length).toBe(0);
  });

  test('Filters single undefined child array', () => {
    const node = elem('div', [undefined]);
    expect(node.children.length).toBe(0);
  });

  test('Filters single false child', () => {
    const node = elem('div', false);
    expect(node.children.length).toBe(0);
  });

  test('Filters single false child array', () => {
    const node = elem('div', [false]);
    expect(node.children.length).toBe(0);
  });

  test('Filters single true child', () => {
    const node = elem('div', true);
    expect(node.children.length).toBe(0);
  });

  test('Filters single true child array', () => {
    const node = elem('div', [true]);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple null children', () => {
    const node = elem('div', null, null);
    expect(node.children.length).toBe(0);
  });

  test('Filters mixed null children', () => {
    const node = elem('div', null, [null]);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple null children array', () => {
    const node = elem('div', [null, null]);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple undefined children', () => {
    const node = elem('div', undefined, undefined);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple undefined children array', () => {
    const node = elem('div', [undefined, undefined]);
    expect(node.children.length).toBe(0);
  });

  test('Filters mixed undefined children', () => {
    const node = elem('div', undefined, [undefined]);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple false children', () => {
    const node = elem('div', false, false);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple false children array', () => {
    const node = elem('div', [false, false]);
    expect(node.children.length).toBe(0);
  });

  test('Filters mixed false children', () => {
    const node = elem('div', false, [false]);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple true children', () => {
    const node = elem('div', true, true);
    expect(node.children.length).toBe(0);
  });

  test('Filters multiple true children array', () => {
    const node = elem('div', [true, true]);
    expect(node.children.length).toBe(0);
  });

  test('Filters mixed true children', () => {
    const node = elem('div', true, [true]);
    expect(node.children.length).toBe(0);
  });

});