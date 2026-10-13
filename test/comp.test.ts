import { describe, test, expect } from 'vitest';
import { comp } from '../src/index';
import {
  VNODE_COMP
} from '../src/vNode.defs';

describe('comp()', () => {
  test('Returns a vNode with the correct type', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.is).toBe(VNODE_COMP);
  });
  test('Returns a vNode with the correct type when an incorrect type is passed', () => {
    const compDef = {
      draw: () => null,
      type: 0
    };
    const comp1 = comp(compDef);
    expect(comp1.is).toBe(VNODE_COMP);
  });
  test('Returns a vNode with a frozen empty attrs object', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.attrs).toEqual({});
    expect(Object.isFrozen(comp1.attrs)).toBe(true);
  });
  test('Returns a vNode with a frozen attrs object with the expected properties', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef, {
      id: 'test'
    });
    expect(comp1.attrs).toEqual({id:'test'});
    expect(Object.isFrozen(comp1.attrs)).toBe(true);
  });
  test('Returns a vNode with the component definition as .tag', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.$def).toBe(compDef);
  });
});