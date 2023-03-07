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

  test('z.elem("div") returns an object with the expected properties', () =>{  
    const vnode = z.elem('div');
    expect(vnode).not.toBeNull();
    expect(typeof vnode).toBe('object');
    expect(vnode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(vnode).toHaveProperty('type', VNODE_TYPE_ELEM);
    expect(vnode).toHaveProperty('tag', 'div');
    expect(vnode).toHaveProperty('attrs', {});
    expect(vnode).toHaveProperty('children', []);
  });

  test('z.elem("div", {id:"test"}) returns an object with the expected properties', () =>{  
    const vnode = z.elem('div', {id:"test"});
    expect(vnode).not.toBeNull();
    expect(typeof vnode).toBe('object');
    expect(vnode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
    expect(vnode).toHaveProperty('type', VNODE_TYPE_ELEM);
    expect(vnode).toHaveProperty('tag', 'div');
    expect(typeof vnode.attrs).toBe('object');
    expect(vnode.attrs).toHaveOnlyProperties(['id']);
    expect(vnode.attrs).toHaveProperty('id', 'test');
    expect(vnode).toHaveProperty('children', []);
  });

});