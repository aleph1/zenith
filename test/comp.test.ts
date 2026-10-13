import { describe, test, expect, vi } from 'vitest';
import { bind, comp, compDef, draw, elem, sync } from '../src/index';
import { VNODE_COMP } from '../src/vNode.defs';
import { redraw } from './utils';

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

describe('Component memoization', () => {
  test('$memo: true skips redraw when attributes are the same object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const attrs = { label: 'same' };
    const render = vi.fn(() => elem('span', 'same'));
    const Child = compDef({ $memo: true, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(1);
  });

  test('$memo: true redraws when the attributes object changes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let attrs = { label: 'a' };
    const render = vi.fn((vNode: any) => elem('span', vNode.attrs.label));
    const Child = compDef({ $memo: true, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    attrs = { label: 'b' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(2);
    expect(app.textContent).toBe('b');
  });

  test('a custom $memo predicate controls whether an update is skipped', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let attrs = { label: 'a' };
    const memo = vi.fn((next: any, prev: any) => next.label === prev.label);
    const render = vi.fn((vNode: any) => elem('span', vNode.attrs.label));
    const Child = compDef({ $memo: memo, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    attrs = { label: 'a' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(1);
    attrs = { label: 'b' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(2);
    expect(memo).toHaveBeenCalled();
    expect(app.textContent).toBe('b');
  });
});