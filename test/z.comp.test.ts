import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('z.comp()', () => {

  test('Returns a vNode with the correct type', () => {
    const compDef = z.compDef({
      draw: () => null
    });
    const node = z.comp(compDef);
    expect(node.type).toBe(VNodeTypes.comp);
  });

  test('Returns a vNode with the correct type when an incorrect type is passed', () => {
    const compDef = z.compDef({
      draw: () => null,
      type: 0
    });
    const node = z.comp(compDef);
    expect(node.type).toBe(VNodeTypes.comp);
  });

  test('Returns a vNode with a frozen empty attrs object', () => {
    const compDef = z.compDef({
      draw: () => null
    });
    const node = z.comp(compDef);
    expect(node.attrs).toEqual({});
    expect(Object.isFrozen(node.attrs)).toBe(true);
  });

  test('Returns a vNode with a frozen attrs object with the expected properties', () => {
    const compDef = z.compDef({
      draw: () => null
    });
    const node = z.comp(compDef, {
      id: 'test'
    });
    expect(node.attrs).toEqual({id:'test'});
    expect(Object.isFrozen(node.attrs)).toBe(true);
  });

  test('Returns a vNode with the component definition as .tag', () => {
    const compDef = z.compDef({
      draw: () => null
    })
    const node = z.comp(compDef);
    expect(node.tag).toBe(compDef);
  });

});