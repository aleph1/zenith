import {
  VNodeTypes,
} from '../src/vNode.defs';

import {
  grow,
  pools,
  poolSizes,
} from '../src/pool';

describe('pooling', () => {

  test('elem pool has a default size of 0', () => {
    expect(pools[VNodeTypes.elem].length).toBe(0);
  });

  test('growing elem pool results in correct number of instances', () => {
    grow(VNodeTypes.elem, 100);
    expect(pools[VNodeTypes.elem].length).toBe(100);
  });

  test('elem pool contains instances with correct type', () => {
    grow(VNodeTypes.elem, 1);
    expect(typeof pools[VNodeTypes.elem][0]).toBe('object');
    expect(pools[VNodeTypes.elem][0].type).toBe(VNodeTypes.elem);
  });

  //***
  //test('elem pool reuses element', () => {
  //  grow(VNodeTypes.elem, 1);
  //  const vNode = z.elem('div');
  //  expect(pools[VNodeTypes.elem]).toEqual(0);
  //});

});