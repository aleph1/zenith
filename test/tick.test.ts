import z from '../src/index';

describe('Tick', () => {

  test('z.elem() ticks as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const tick = jest.fn();
    const el1 = z.elem('div', {
      tick
    });
    z.mount(app, el1);
    expect(tick).not.toBeCalled();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  test('z.elem() stops ticking when destroyed', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const tick = jest.fn();
    const el1 = z.elem('div', {
      tick
    });
    const el2 = z.elem('div');
    z.mount(app, el1);
    z.mount(app, null);
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(tick).not.toBeCalled();
  });

  test('z.comp() ticks as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const tick = jest.fn();
    const compDef = z.compDef({
      draw: vNode => z.elem('div'),
      tick
    });
    const comp1 = z.comp(compDef);
    z.mount(app, comp1);
    expect(tick).not.toBeCalled();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  test('z.comp() stops ticking when destroyed', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const tick = jest.fn();
    const compDef = z.compDef({
      draw: vNode => z.elem('div'),
      tick
    });
    const comp1 = z.comp(compDef);
    z.mount(app, comp1);
    z.mount(app, null);
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(tick).not.toBeCalled();
  });

});