import { describe, expect, test } from 'vitest';
import { comp, elem, node } from '../../src/index';
import { vNodeIs, vNodeType } from '../../src/helpers/is';
import { VNODE_TYPE_MASK } from '../../src/vnode.defs';

test('identifies element vnodes', () => {
  const vNode = elem('div');
  expect(vNodeIs(vNode, vNodeType.elem)).toBe(true);
  expect(vNodeIs(vNode, vNodeType.comp)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.node)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.text)).toBe(false);
});

test('identifies text vnodes', () => {
  const vNode = elem('div', 'Hello').nodes[0];
  expect(vNodeIs(vNode, vNodeType.text)).toBe(true);
  expect(vNodeIs(vNode, vNodeType.comp)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.elem)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.node)).toBe(false);
});

test('identifies component vnodes', () => {
  const vNode = comp({ draw: () => null });
  expect(vNodeIs(vNode, vNodeType.comp)).toBe(true);
  expect(vNodeIs(vNode, vNodeType.elem)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.node)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.text)).toBe(false);
});

test('identifies external node vnodes', () => {
  const el = document.createElement('span');
  const vNode = node(el);
  expect(vNodeIs(vNode, vNodeType.node)).toBe(true);
  expect(vNodeIs(vNode, vNodeType.comp)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.elem)).toBe(false);
  expect(vNodeIs(vNode, vNodeType.text)).toBe(false);
});

test('recognizes vnodes with additional flags', () => {
  const vNode = comp({ draw: () => null });
  vNode.is |= VNODE_TYPE_MASK + 1;
  expect(vNodeIs(vNode, vNodeType.comp)).toBe(true);
});
