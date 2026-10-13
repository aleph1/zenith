import { describe, test, expect, vi } from 'vitest';
import { bind, comp, compDef, draw, elem, sync } from '../src/index';
import { redraw } from './utils';


describe('DOM Attributes with elem()', () => {

  test('Handles string attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: 'test'});
    bind(app, el1);
    expect(el1.el.getAttribute('id')).toBe('test');
  });

  test('Handles attribute "class" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      class: 'test',
    });
    bind(app, el1);
    expect(el1.el.className).toEqual('test');
  });

  test('Handles attribute "style" string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: 'background-color: red'
    });
    bind(app, el1);
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
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
    bind(app, el2);
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
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
    bind(app, el2);
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
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
    bind(app, el2);
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
    expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
    bind(app, el2);
    expect((el2.el as HTMLElement).style.backgroundColor).toEqual('');
  });

  test('Style property removal preserves other properties', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      style: {
        backgroundColor: 'red',
        color: 'white',
      },
    });
    const el2 = elem('div', {
      style: {
        color: 'blue',
      },
    });
    bind(app, el1);
    const el = el1.el as HTMLElement;
    expect(el.style.backgroundColor).toBe('red');
    expect(el.style.color).toBe('white');
    bind(app, el2);
    expect(el2.el).toBe(el);
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.color).toBe('blue');
  });

  test('Attribute of null is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: null});
    bind(app, el1);
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of undefined is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: undefined});
    bind(app, el1);
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of false is equivalent to no attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {id: false});
    bind(app, el1);
    expect(el1.el.getAttribute('id')).toBeNull();
  });

  test('Attribute of true is equivalent to attribute="attribute"', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {disabled: true});
    bind(app, el1);
    expect(el1.el.getAttribute('disabled')).toBe('disabled');
  });

  test('Attribute starting with "on" is applied as a function', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = elem('div', {
      onclick: e => e.stopImmediatePropagation()
    });
    bind(app, el1);
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
    expect(node1.el instanceof HTMLElement).toEqual(true);
    expect(typeof (node1.el as HTMLElement).onclick).toEqual('function');
    bind(app, node2);
    expect(node2.el instanceof HTMLElement).toEqual(true);
    expect((node2.el as HTMLElement).onclick).toEqual(null);
  });

});

describe('Attribute transitions', () => {
  test('clearing one style property preserves and updates other properties', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    bind(app, elem('div', { style: { backgroundColor: 'red', color: 'white' } }));
    const el = app.firstElementChild as HTMLElement;
    bind(app, elem('div', { style: { color: 'blue' } }));
    expect(app.firstElementChild).toBe(el);
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.color).toBe('blue');
  });

  test('reusing an unchanged style object leaves its declarations intact', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const style = { backgroundColor: 'red' };
    bind(app, elem('div', { style }));
    const el = app.firstElementChild as HTMLElement;
    bind(app, elem('div', { style }));
    expect(app.firstElementChild).toBe(el);
    expect(el.style.backgroundColor).toBe('red');
  });

  test('switching style from an object to a CSS string updates declarations', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    bind(app, elem('div', { style: { backgroundColor: 'red', color: 'white' } }));
    bind(app, elem('div', { style: 'color: blue' }));
    const el = app.firstElementChild as HTMLElement;
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.color).toBe('blue');
  });

  test('switching style from a CSS string to an object updates declarations', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    bind(app, elem('div', { style: 'background-color: red; color: white' }));
    bind(app, elem('div', { style: { color: 'blue' } }));
    const el = app.firstElementChild as HTMLElement;
    expect(el.style.backgroundColor).toBe('');
    expect(el.style.color).toBe('blue');
  });

  test('boolean attributes survive true → false → true', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    bind(app, elem('button', { disabled: true }));
    const el = app.firstElementChild as HTMLButtonElement;
    expect(el.disabled).toBe(true);
    bind(app, elem('button', { disabled: false }));
    expect(el.disabled).toBe(false);
    bind(app, elem('button', { disabled: true }));
    expect(el.disabled).toBe(true);
  });

  test('a scalar attribute survives string → null → number → string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    bind(app, elem('div', { title: 'first' }));
    const el = app.firstElementChild!;
    bind(app, elem('div', { title: null }));
    expect(el.hasAttribute('title')).toBe(false);
    bind(app, elem('div', { title: 42 }));
    expect(el.getAttribute('title')).toBe('42');
    bind(app, elem('div', { title: 'last' }));
    expect(el.getAttribute('title')).toBe('last');
  });

  test('an unrelated input redraw does not reset an edited value', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let title = 'a';
    const View = compDef({ draw: () => elem('input', { value: 'initial', title }) });
    const view = comp(View);
    bind(app, view);
    const input = app.querySelector('input')!;
    input.value = 'user typed';
    title = 'b';
    redraw(view);
    expect(app.querySelector('input')).toBe(input);
    expect(input.value).toBe('user typed');
  });
});

describe('Events', () => {
  test('replacing a callback stops invoking the previous callback', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const oldHandler = vi.fn();
    const newHandler = vi.fn();
    bind(app, elem('button', { onclick: oldHandler }));
    const button = app.querySelector('button')!;
    button.click();
    bind(app, elem('button', { onclick: newHandler }));
    button.click();
    expect(oldHandler).toHaveBeenCalledTimes(1);
    expect(newHandler).toHaveBeenCalledTimes(1);
  });

  test('setting a callback to null removes it', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const handler = vi.fn();
    bind(app, elem('button', { onclick: handler }));
    const button = app.querySelector('button')!;
    bind(app, elem('button', { onclick: null }));
    expect(button.onclick).toBeNull();
    button.click();
    expect(handler).not.toHaveBeenCalled();
  });

  test('an unchanged callback still redraws after several vnode replacements', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let count = 0;
    const handler = () => { count++; };
    const View = compDef({ draw: () => elem('button', { onclick: handler }, String(count)) });
    const view = comp(View);
    bind(app, view);
    const button = app.querySelector('button')!;
    redraw(view);
    redraw(view);
    button.click();
    sync();
    expect(app.querySelector('button')).toBe(button);
    expect(button.textContent).toBe('1');
  });

  test('an event callback runs with currentTarget as this', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let receivedThis: unknown;
    let receivedEvent: Event | undefined;
    function handler(this: EventTarget, event: Event) {
      receivedThis = this;
      receivedEvent = event;
    }
    bind(app, elem('button', { onclick: handler }));
    const button = app.querySelector('button')!;
    button.click();
    expect(receivedThis).toBe(button);
    expect(receivedEvent?.currentTarget).toBeNull(); // currentTarget is reset after dispatch
    expect(receivedEvent?.type).toBe('click');
  });
});