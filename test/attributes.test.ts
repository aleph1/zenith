import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  comp,
  mount,
} from '../src/index';

describe('DOM Attributes with elem()', () => {

  test('Handles string attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: 'test'});
    mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBe('test');
  });

  test('Handles attribute "class" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      class: 'test',
    });
    mount(app, el1);
    expect(el1.dom.className).toEqual('test');
  });

  test('Handles attribute "class" array', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      class: ['test', 'test2'],
    });
    mount(app, el1);
    expect(el1.dom.className).toEqual('test test2');
  });

  test('Handles attribute "style" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: 'background-color: red'
    });
    mount(app, el1);
    expect((el1.dom as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Handles attribute "style" object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: {
        backgroundColor: 'red',
      }
    });
    mount(app, el1);
    expect((el1.dom as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Attribute of null is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: null});
    mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of undefined is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: undefined});
    mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of false is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: false});
    mount(app, el1);
    expect(el1.dom.getAttribute('id')).toBeNull();
  });

  test('Attribute of true is equivalent to attribute="attribute"', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {disabled: true});
    mount(app, el1);
    expect(el1.dom.getAttribute('disabled')).toBe('disabled');
  });

  test('Attribute starting with "on" is applied as a function', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLElement).toBe(true);
    expect(typeof (el1.dom as HTMLElement).onclick).toBe('function');
  });

  //test('Attribute starting with "on" is removed as expected when drawn immediately', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  let enabled = true;
  //  const callback = vi.fn();
  //  const compDef = {
  //    draw: _vNode => elem('div', {
  //      onclick: enabled ? callback : null
  //    })
  //  };
  //  const node = comp(compDef);
  //  mount(app, node);
  //  // *** add tests!!!
  //  enabled = false;
  //  node.draw();
  // sync();
  //});

  // *** add tests!!!
  //test('Attribute starting with "on" is removed as expected when drawn deferred', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  let enabled = true;
  //  const callback = vi.fn();
  //  const compDef = {
  //    draw: vNode => elem('div', {
  //      onclick: enabled ? callback : null
  //    })
  //  };
  //  const node = comp(compDef);
  //  mount(app, node);
  //  // *** add tests!!!
  //  enabled = false;
  //  node.draw();
  //  sync();
  //});

  test('Attribute starting with "on" is removed as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    const node2 = elem('div', {
    });
    mount(app, node1);
    expect(node1.dom instanceof HTMLElement).toEqual(true);
    expect(typeof (node1.dom as HTMLElement).onclick).toEqual('function');
    mount(app, node2);
    expect(node2.dom instanceof HTMLElement).toEqual(true);
    expect((node2.dom as HTMLElement).onclick).toEqual(null);
  });

});