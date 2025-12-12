import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  text,
  comp,
  mount,
  sync,
} from '../src/index';

describe('Lifecycle', () => {

  test('comp() with init is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const initFn = vi.fn();
    const compDef = {
      init: initFn,
      draw: () => elem('div'),
    };
    const vNode = comp(compDef);
    expect(initFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(initFn).toHaveBeenCalledTimes(1);
    vNode.draw();
    sync();
    expect(initFn).toHaveBeenCalledTimes(1);
  });

  test('comp() with draw is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const drawFn = vi.fn(() => elem('div'));
    const compDef = {
      draw: drawFn
    };
    const vNode = comp(compDef);
    expect(drawFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(drawFn).toHaveBeenCalledTimes(1);
    vNode.draw();
    sync();
    expect(drawFn).toHaveBeenCalledTimes(2);
  });

  test('comp() with drawn is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const drawnFn = vi.fn(() => elem('div'));
    const compDef = {
      draw: () => elem('div'),
      drawn: drawnFn
    };
    const vNode = comp(compDef);
    expect(drawnFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(drawnFn).toHaveBeenCalledTimes(1);
    vNode.draw();
    sync();
    expect(drawnFn).toHaveBeenCalledTimes(2);
  });

  test('comp() with remove is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removeFn = vi.fn();
    const compDef = {
      draw: () => elem('div'),
      remove: removeFn
    };
    const vNode = comp(compDef);
    expect(removeFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(removeFn).toHaveBeenCalledTimes(0);
    vNode.draw();
    sync();
    expect(removeFn).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(removeFn).toHaveBeenCalledTimes(1);
  });

  test('comp() with remove returning non-promise removes immediately', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removeFn = vi.fn(() => 'invalid'); 
    const compDef = {
      draw: () => elem('div', text('test')),
      remove: removeFn,
    };
    const vNode = comp(compDef);
    mount(app, vNode);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(app.textContent).toBe('test');
    mount(app, null);
    expect(removeFn).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('');
  });

  test('comp() with removed is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removedFn = vi.fn();
    const compDef = {
      draw: () => elem('div'),
      removed: removedFn
    };
    const vNode = comp(compDef);
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(removedFn).toHaveBeenCalledTimes(0);
    vNode.draw();
    sync();
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(removedFn).toHaveBeenCalledTimes(1);
  });

  test('comp() lifecycle hooks are called in correct order', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const initFn = vi.fn();
    const drawFn = vi.fn(() => elem('div'));
    const drawnFn = vi.fn();
    const removeFn = vi.fn();
    const removedFn = vi.fn();
    const compDef = {
      init: initFn,
      draw: drawFn,
      drawn: drawnFn,
      remove: removeFn,
      removed: removedFn,
    };
    const initSpy = vi.spyOn(compDef, 'init');
    const drawSpy = vi.spyOn(compDef, 'draw');
    const drawnSpy = vi.spyOn(compDef, 'drawn');
    const removeSpy = vi.spyOn(compDef, 'remove');
    const removedSpy = vi.spyOn(compDef, 'removed');
    const vNode = comp(compDef);
    expect(initFn).toHaveBeenCalledTimes(0);
    expect(drawFn).toHaveBeenCalledTimes(0);
    expect(drawFn).toHaveBeenCalledTimes(0);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(1);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(removedFn).toHaveBeenCalledTimes(0);
    vNode.draw();
    sync();
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(removeFn).toHaveBeenCalledTimes(1);
    expect(removedFn).toHaveBeenCalledTimes(1);
    const initOrder = initSpy.mock.invocationCallOrder[0];
    const drawOrder = drawSpy.mock.invocationCallOrder[0];
    const drawnOrder = drawnSpy.mock.invocationCallOrder[0];
    const removeOrder = removeSpy.mock.invocationCallOrder[0];
    const removedOrder = removedSpy.mock.invocationCallOrder[0];
    expect(initOrder).toBeLessThan(drawOrder);
    expect(drawOrder).toBeLessThan(drawnOrder);
    expect(drawnOrder).toBeLessThan(removeOrder);
    expect(removeOrder).toBeLessThan(removedOrder);
  });

  test('Throws error when comp.remove() returns Promise without key', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => elem('div'),
      remove: vi.fn(() => new Promise()),
    };
    const vNode = comp(compDef);
    mount(app, vNode);
    expect(() => {
      mount(app, null);
    }).toThrow(Error);
  });

  test('comp.removed() on unmount when parent comp() has GUI', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removedFn1 = vi.fn();
    const removedFn2 = vi.fn();
    const listItemDef = {
      draw: () => elem('div'),
      removed: removedFn2
    };
    const listDef = {
      draw: () => elem('div',
        comp(listItemDef)
      ),
      removed: removedFn1
    };
    const vNode = comp(listDef);
    const listDefRemoved1Spy = vi.spyOn(listDef, 'removed');
    const listDefRemoved2Spy = vi.spyOn(listItemDef, 'removed');
    expect(removedFn1).toHaveBeenCalledTimes(0);
    expect(removedFn2).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(removedFn1).toHaveBeenCalledTimes(0);
    expect(removedFn2).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(removedFn1).toHaveBeenCalledTimes(1);
    expect(removedFn2).toHaveBeenCalledTimes(1);
    const listDefRemoved1Order = listDefRemoved1Spy.mock.invocationCallOrder[0];
    const listDefRemoved2Order = listDefRemoved2Spy.mock.invocationCallOrder[0];
    expect(listDefRemoved1Order).toBeLessThan(listDefRemoved2Order);
  });

  test('comp.removed() on unmount when parent comp() has no GUI', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removedFn1 = vi.fn();
    const removedFn2 = vi.fn();
    const listItemDef = {
      draw: () => elem('div'),
      removed: removedFn2
    };
    const listDef = {
      draw: () => comp(listItemDef),
      removed: removedFn1
    };
    const vNode = comp(listDef);
    const listDefRemoved1Spy = vi.spyOn(listDef, 'removed');
    const listDefRemoved2Spy = vi.spyOn(listItemDef, 'removed');
    expect(removedFn1).toHaveBeenCalledTimes(0);
    expect(removedFn2).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(removedFn1).toHaveBeenCalledTimes(0);
    expect(removedFn2).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(removedFn1).toHaveBeenCalledTimes(1);
    expect(removedFn2).toHaveBeenCalledTimes(1);
    const listDefRemoved1Order = listDefRemoved1Spy.mock.invocationCallOrder[0];
    const listDefRemoved2Order = listDefRemoved2Spy.mock.invocationCallOrder[0];
    expect(listDefRemoved1Order).toBeLessThan(listDefRemoved2Order);
  });

  test('comp.removed() on unmount with parent is elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removedFn = vi.fn();
    const compDef = {
      draw: () => elem('div'),
      removed: removedFn
    };
    const vNode = elem('div', comp(compDef));
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, vNode);
    expect(removedFn).toHaveBeenCalledTimes(0);
    mount(app, null);
    expect(removedFn).toHaveBeenCalledTimes(1);
  });

  // *** FIX!
  /*
  test('Clears removal flag when updating a component that was being removed', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    const compDefRemove = vi.fn(() => new Promise(resolve => setTimeout(resolve, 50)));
    const compDefDestroy = vi.fn();
    const compDef = {
      draw: () => elem('div', text('test')),
      remove: compDefRemove,
      destroy: compDefDestroy,
    };
    
    // Mount component with key
    mount(app, comp(compDef, { key: '1' }));
    expect(app.textContent).toBe('test');
    expect(compDefRemove).toHaveBeenCalledTimes(0);
    expect(compDefDestroy).toHaveBeenCalledTimes(0);
    
    // Mark for removal
    mount(app, comp(compDef, { key: '1', $remove: true }));
    sync();
     // Still in DOM (deferred)
    expect(app.textContent).toBe('test');
    expect(compDefRemove).toHaveBeenCalledTimes(1);
    expect(compDefDestroy).toHaveBeenCalledTimes(0);
    
    // Un-delete by removing $remove flag
    mount(app, comp(compDef, { key: '1', $remove: false }));
    sync();
    expect(app.textContent).toBe('test');
    expect(compDefRemove).toHaveBeenCalledTimes(1);
    expect(compDefDestroy).toHaveBeenCalledTimes(0);
    
    // Wait for original removal promise to resolve
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // component should still be alive and not have been destroyed
    expect(app.textContent).toBe('test');
    expect(compDefRemove).toHaveBeenCalledTimes(1);
    expect(compDefDestroy).toHaveBeenCalledTimes(0);

    //const deferredPromise = generateDeferredPromise();
    //  const listItemDef = {
    //    draw: vNode => elem('li', text(vNode.attrs.value)),
    //    remove: vNode => deferredPromise.promise,
    //  };
    //  const listDef = {
    //    draw: vNode => elem('ul', values.map(value => comp(listItemDef, {value})))
    //  };
    //  const node = comp(listDef);
    //  mount(app, node);
    //  expect(node.children[0].children.length).toEqual(2);
    //  values.pop();
    //  node.draw();
    //  sync();
    //  expect(node.children[0].children.length).toEqual(2);
    //  await deferredPromise.resolve();
    //  expect(node.children[0].children.length).toEqual(1);
  });
  */

});