import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('DOM Attributes with z.elem()', () => {

  test('Handles string attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {id: 'test'});
    z.mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBe('test');
  });

  test('Handles attribute "class" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', {
      class: 'test',
    });
    z.mount(app, node);
    expect(node.dom.className).toEqual('test');
  });

  test('Handles attribute "class" array', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', {
      class: ['test', 'test2'],
    });
    z.mount(app, node);
    expect(node.dom.className).toEqual('test test2');
  });

  test('Handles attribute "style" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', {
      style: 'background-color: red'
    });
    z.mount(app, node);
    expect((node.dom as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Handles attribute "style" object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', {
      style: {
        backgroundColor: 'red',
      }
    });
    z.mount(app, node);
    expect((node.dom as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Attribute of null is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {id: null});
    z.mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of undefined is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {id: undefined});
    z.mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of false is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {id: false});
    z.mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of true is equivalent to attribute="attribute"', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {disabled: true});
    z.mount(app, el1);
    expect(el1.dom.getAttribute('disabled')).toBe('disabled');
  });

  test('Attribute starting with "on" is applied as a function', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLElement).toBe(true);
    expect(typeof (el1.dom as HTMLElement).onclick).toBe('function');
  });

  test('Attribute starting with "on" is removed as expected when drawn immediately', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let enabled = true;
    const callback = jest.fn();
    const compDef = z.compDef({
      draw: vNode => z.elem('div', {
        onclick: enabled ? callback : null
      })
    })
    const node = z.comp(compDef);
    z.mount(app, node);
    // *** add tests!!!
    enabled = false;
    node.draw(true);
  });

  // *** add tests!!!
  //test('Attribute starting with "on" is removed as expected when drawn deferred', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  let enabled = true;
  //  const callback = jest.fn();
  //  const compDef = z.compDef({
  //    draw: vNode => z.elem('div', {
  //      onclick: enabled ? callback : null
  //    })
  //  })
  //  const node = z.comp(compDef);
  //  z.mount(app, node);
  //  // *** add tests!!!
  //  enabled = false;
  //  node.draw();
  //  jest.advanceTimersByTime(global.FRAME_TIME);
  //});

  test('Attribute starting with "on" is removed as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    const node2 = z.elem('div', {
    });
    z.mount(app, node1);
    expect(node1.dom instanceof HTMLElement).toEqual(true);
    expect(typeof (node1.dom as HTMLElement).onclick).toEqual('function');
    z.mount(app, node2);
    expect(node2.dom instanceof HTMLElement).toEqual(true);
    expect((node2.dom as HTMLElement).onclick).toEqual(null);
  });

});