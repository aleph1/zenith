import { describe, test, expect, vi } from 'vitest';
import { flushMicrotasks } from './helpers';
import { elem, comp, bind } from '../src/index';

describe('DOM Attributes with elem()', () => {

  test('Handles string attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: 'test'});
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.getAttribute('id')).toBe('test');
  });

  test('Handles attribute "class" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      class: 'test',
    });
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.className).toEqual('test');
  });

  test('Handles attribute "style" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: 'background-color: red'
    });
    bind(app, el1);
    flushMicrotasks();
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Handles attribute "style" object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: {
        backgroundColor: 'red',
      }
    });
    bind(app, el1);
    flushMicrotasks();
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
  });

  test('Style property is updated', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: {
        backgroundColor: 'red',
      }
    });
    const el2 = elem('div', {
      style: {
        backgroundColor: 'blue',
      }
    });
    bind(app, el1);
    flushMicrotasks();
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
    bind(app, el2);
    flushMicrotasks();
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('blue');
  });

  test('Style property is cleared when set to null', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');

    const el1 = elem('div', {
      style: { backgroundColor: 'red' },
    });

    const el2 = elem('div', {
      style: { backgroundColor: null },
    });

    bind(app, el1);
    flushMicrotasks();

    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');

    bind(app, el2);
    flushMicrotasks();

    expect((el2.el as HTMLElement).style.backgroundColor).toEqual('');
  });

  test('Style property is removed when omitted', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');

    const el1 = elem('div', {
      style: { backgroundColor: 'red' },
    });

    const el2 = elem('div', {
      style: {},
    });

    bind(app, el1);
    flushMicrotasks();

    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');

    bind(app, el2);
    flushMicrotasks();

    expect((el2.el as HTMLElement).style.backgroundColor).toEqual('');
  });

  test('Style attribute is removed when omitted', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');

    const el1 = elem('div', {
      style: { backgroundColor: 'red' },
    });

    const el2 = elem('div', {});

    bind(app, el1);
    flushMicrotasks();

    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');

    bind(app, el2);
    flushMicrotasks();

    expect((el2.el as HTMLElement).style.backgroundColor).toEqual('');
  });

  test('Nested Attribute in style removed as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');

    const el1 = elem('div', {
      style: { backgroundColor: 'red' },
    });

    const el2 = elem('div', {
      style: {},
    });

    bind(app, el1);
    flushMicrotasks();

    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');

    bind(app, el2);
    flushMicrotasks();

    expect((el2.el as HTMLElement).style.backgroundColor).toEqual('');
  });

  test('Attribute of null is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: null});
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of undefined is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: undefined});
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of false is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: false});
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of true is equivalent to attribute="attribute"', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {disabled: true});
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el.getAttribute('disabled')).toBe('disabled');
  });

  test('Attribute starting with "on" is applied as a function', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    bind(app, el1);
    flushMicrotasks();
    expect(el1.el instanceof HTMLElement).toBe(true);
    expect(typeof (el1.el as HTMLElement).onclick).toBe('function');
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
  //  bind(app, node);
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
  //  bind(app, node);
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
    bind(app, node1);
    flushMicrotasks();
    expect(node1.el instanceof HTMLElement).toEqual(true);
    expect(typeof (node1.el as HTMLElement).onclick).toEqual('function');
    bind(app, node2);
    flushMicrotasks();
    expect(node2.el instanceof HTMLElement).toEqual(true);
    expect((node2.el as HTMLElement).onclick).toEqual(null);
  });

});