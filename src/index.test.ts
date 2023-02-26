import z from './index';
import {
  VNodeTypeNone,
  VNodeTypeElem,
  VNodeTypeText,
  VNodeTypeComp,
  VNodeTypeHTML,
  VNODE_TYPE_NONE,
  VNODE_TYPE_ELEM,
  VNODE_TYPE_TEXT,
  VNODE_TYPE_COMP,
  VNODE_TYPE_HTML
} from './vnode.defs';

// vnode elem creation
describe('Tests for z.elem()', () =>{

  test('z.elem(div) returns an object with the expected properties', () =>{  
    const vnode = z.elem('div');
    expect(vnode).not.toBeNull();
    expect(typeof vnode).toBe('object');
    expect(vnode).toStrictEqual({
      _z_: VNODE_TYPE_ELEM,
      tag: 'div',
      attrs: {},
      children: []
    });
  });
});