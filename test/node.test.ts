import { describe, test, expect } from 'vitest';
import {
  node,
} from '../src/index';
import {
  VNODE_NODE
} from '../src/vNode.defs';

describe('node()', () => {

  test('node(elem) returns an object with the expected properties', () => {
    const elem1 = document.createElement('div');
    const node1 = node(elem1);
    expect(node1).toHaveProperty('type');
    expect(node1).toHaveProperty('tag');
    expect(node1).toHaveProperty('attrs');
    expect(node1).toHaveProperty('dom');
  });

  test('node(elem) returns an object with correct properties', () => {
    const elem1 = document.createElement('div');
    const node1 = node(elem1);
    expect(node1.type).toEqual(VNODE_NODE);
    expect(node1.tag).toEqual('div');
    expect(node1.attrs).toEqual({});
    expect(node1.dom).toBe(elem1);
  });

  test('node(elem) works with <svg>', () => {
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const node1 = node(elem1);
    expect(node1.tag).toBe('svg');
    expect(node1.dom).toBe(elem1);
  });

  test('node(elem) works with <math>', () => {
    const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math')
    const node1 = node(elem1);
    expect(node1.tag).toBe('math');
    expect(node1.dom).toBe(elem1);
  });

  test('node(elem) works with custom nodes', () => {
    class CustomElem extends HTMLElement {
      constructor() {
        super();
      }
    }
    customElements.define('custom-elem', CustomElem, { extends: 'div' });
    const wrap = document.createElement('div');
    const html = '<custom-elem></custom-elem>';
    wrap.insertAdjacentHTML('beforeend' , html);
    const elem1 = wrap.firstChild as Element;
    const node1 = node(elem1);
    expect(node1.tag).toBe('custom-elem');
    expect(node1.dom).toBe(elem1);
  });

});