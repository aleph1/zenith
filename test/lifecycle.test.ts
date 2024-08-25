import z from '../src/index';

describe('Lifecycle', () => {

  test('z.comp() with init is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const initFn = jest.fn();
    const compDef = z.compDef({
      init: initFn,
      draw: () => z.elem('div'),
    });
    const vNode = z.comp(compDef);
    expect(initFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(initFn).toHaveBeenCalledTimes(1);
    vNode.draw(true);
    expect(initFn).toHaveBeenCalledTimes(1);
  });

  test('z.comp() with draw is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const drawFn = jest.fn(() => z.elem('div'));
    const compDef = z.compDef({
      draw: drawFn
    });
    const vNode = z.comp(compDef);
    expect(drawFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(drawFn).toHaveBeenCalledTimes(1);
    vNode.draw(true);
    expect(drawFn).toHaveBeenCalledTimes(2);
  });

  test('z.comp() with drawn is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const drawnFn = jest.fn(() => z.elem('div'));
    const compDef = z.compDef({
      draw: () => z.elem('div'),
      drawn: drawnFn
    });
    const vNode = z.comp(compDef);
    expect(drawnFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(drawnFn).toHaveBeenCalledTimes(1);
    vNode.draw(true);
    expect(drawnFn).toHaveBeenCalledTimes(2);
  });

  test('z.comp() with remove is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const removeFn = jest.fn();
    const compDef = z.compDef({
      draw: () => z.elem('div'),
      remove: removeFn
    });
    const vNode = z.comp(compDef);
    expect(removeFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(removeFn).toHaveBeenCalledTimes(0);
    vNode.draw(true);
    expect(removeFn).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(removeFn).toHaveBeenCalledTimes(1);
  });

  test('z.comp() with destroy is called as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const destroyFn = jest.fn();
    const compDef = z.compDef({
      draw: () => z.elem('div'),
      destroy: destroyFn
    });
    const vNode = z.comp(compDef);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    vNode.draw(true);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(destroyFn).toHaveBeenCalledTimes(1);
  });

  test('z.comp() lifecycle hooks are called in correct order', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const initFn = jest.fn();
    const drawFn = jest.fn(() => z.elem('div'));
    const drawnFn = jest.fn();
    const removeFn = jest.fn();
    const destroyFn = jest.fn();
    const compDef = z.compDef({
      init: initFn,
      draw: drawFn,
      drawn: drawnFn,
      remove: removeFn,
      destroy: destroyFn,
    });
    const initSpy = jest.spyOn(compDef, 'init');
    const drawSpy = jest.spyOn(compDef, 'draw');
    const drawnSpy = jest.spyOn(compDef, 'drawn');
    const removeSpy = jest.spyOn(compDef, 'remove');
    const destroySpy = jest.spyOn(compDef, 'destroy');
    const vNode = z.comp(compDef);
    expect(initFn).toHaveBeenCalledTimes(0);
    expect(drawFn).toHaveBeenCalledTimes(0);
    expect(drawFn).toHaveBeenCalledTimes(0);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(1);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    vNode.draw(true);
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(removeFn).toHaveBeenCalledTimes(0);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(initFn).toHaveBeenCalledTimes(1);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(drawFn).toHaveBeenCalledTimes(2);
    expect(removeFn).toHaveBeenCalledTimes(1);
    expect(destroyFn).toHaveBeenCalledTimes(1);
    const initOrder = initSpy.mock.invocationCallOrder[0];
    const drawOrder = drawSpy.mock.invocationCallOrder[0];
    const drawnOrder = drawnSpy.mock.invocationCallOrder[0];
    const removeOrder = removeSpy.mock.invocationCallOrder[0];
    const destroyOrder = destroySpy.mock.invocationCallOrder[0];
    expect(initOrder).toBeLessThan(drawOrder);
    expect(drawOrder).toBeLessThan(drawnOrder);
    expect(drawnOrder).toBeLessThan(removeOrder);
    expect(removeOrder).toBeLessThan(destroyOrder);
  });

  test('Destroying z.comp() on unmount when parent z.comp() has GUI', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const destroyFn1 = jest.fn();
    const destroyFn2 = jest.fn();
    const listItemDef = z.compDef({
      draw: () => z.elem('div'),
      destroy: destroyFn2
    });
    const listDef = z.compDef({
      draw: () => z.elem('div',
        z.comp(listItemDef)
      ),
      destroy: destroyFn1
    });
    const vNode = z.comp(listDef);
    const listDefDestroy1Spy = jest.spyOn(listDef, 'destroy');
    const listDefDestroy2Spy = jest.spyOn(listItemDef, 'destroy');
    expect(destroyFn1).toHaveBeenCalledTimes(0);
    expect(destroyFn2).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(destroyFn1).toHaveBeenCalledTimes(0);
    expect(destroyFn2).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(destroyFn1).toHaveBeenCalledTimes(1);
    expect(destroyFn2).toHaveBeenCalledTimes(1);
    const listDefDestroy1Order = listDefDestroy1Spy.mock.invocationCallOrder[0];
    const listDefDestroy2Order = listDefDestroy2Spy.mock.invocationCallOrder[0];
    expect(listDefDestroy1Order).toBeLessThan(listDefDestroy2Order);
  });

  test('Destroying z.comp() on unmount when parent z.comp() has no GUI', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const destroyFn1 = jest.fn();
    const destroyFn2 = jest.fn();
    const listItemDef = z.compDef({
      draw: () => z.elem('div'),
      destroy: destroyFn2
    });
    const listDef = z.compDef({
      draw: () => z.comp(listItemDef),
      destroy: destroyFn1
    });
    const vNode = z.comp(listDef);
    const listDefDestroy1Spy = jest.spyOn(listDef, 'destroy');
    const listDefDestroy2Spy = jest.spyOn(listItemDef, 'destroy');
    expect(destroyFn1).toHaveBeenCalledTimes(0);
    expect(destroyFn2).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(destroyFn1).toHaveBeenCalledTimes(0);
    expect(destroyFn2).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(destroyFn1).toHaveBeenCalledTimes(1);
    expect(destroyFn2).toHaveBeenCalledTimes(1);
    const listDefDestroy1Order = listDefDestroy1Spy.mock.invocationCallOrder[0];
    const listDefDestroy2Order = listDefDestroy2Spy.mock.invocationCallOrder[0];
    expect(listDefDestroy1Order).toBeLessThan(listDefDestroy2Order);
  });

  test('Destroying z.comp() on unmount with parent is z.elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const destroyFn = jest.fn();
    const compDef = z.compDef({
      draw: () => z.elem('div'),
      destroy: destroyFn
    });
    const vNode = z.elem('div', z.comp(compDef));
    const compDefDestroySpy = jest.spyOn(compDef, 'destroy');
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, vNode);
    expect(destroyFn).toHaveBeenCalledTimes(0);
    z.mount(app, null);
    expect(destroyFn).toHaveBeenCalledTimes(1);
  });

});