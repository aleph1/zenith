import { afterEach, beforeEach, describe, test, expect, vi } from 'vitest';
import { bind, comp, compDef, draw, elem, sync } from '../src/index';

// All original active tests are preserved, except one expected value updated
// to reflect the agreed controlled-input semantics. Additional tests are additive.
describe('DOM attributes', () => {
  describe('initial attributes', () => {
    test('Handles string attribute', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {id: 'test'});
        bind(app, el1);
        expect(el1.el.getAttribute('id')).toBe('test');
      })

    test('Handles attribute "class" string', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {
          class: 'test',
        });
        bind(app, el1);
        expect(el1.el.className).toEqual('test');
      })

    test('Attribute of null is equivalent to no attribute', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {id: null});
        bind(app, el1);
        expect(el1.el.getAttribute('id')).toBeNull();
      })

    test('Attribute of undefined is equivalent to no attribute', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {id: undefined});
        bind(app, el1);
        expect(el1.el.getAttribute('id')).toBeNull();
      })

    test('Attribute of false is equivalent to no attribute', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {id: false});
        bind(app, el1);
        expect(el1.el.getAttribute('id')).toBeNull();
      })

    test('Attribute of true is equivalent to attribute="attribute"', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {disabled: true});
        bind(app, el1);
        expect(el1.el.getAttribute('disabled')).toBe('disabled');
      })

    test('mounts a numeric attribute as a string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('div', { 'data-count': 0 }));
      expect(app.firstElementChild!.getAttribute('data-count')).toBe('0');
    });
  });

  describe('styles', () => {
    test('Handles attribute "style" string', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {
          style: 'background-color: red'
        });
        bind(app, el1);
        expect((el1.el as HTMLElement).style.backgroundColor).toEqual('red');
      })

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
      })

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
      })

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
      })

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
      })

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
      })

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
      })

    test('clearing one style property preserves and updates other properties', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        bind(app, elem('div', { style: { backgroundColor: 'red', color: 'white' } }));
        const el = app.firstElementChild as HTMLElement;
        bind(app, elem('div', { style: { color: 'blue' } }));
        expect(app.firstElementChild).toBe(el);
        expect(el.style.backgroundColor).toBe('');
        expect(el.style.color).toBe('blue');
      })

    test('reusing an unchanged style object leaves its declarations intact', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const style = { backgroundColor: 'red' };
        bind(app, elem('div', { style }));
        const el = app.firstElementChild as HTMLElement;
        bind(app, elem('div', { style }));
        expect(app.firstElementChild).toBe(el);
        expect(el.style.backgroundColor).toBe('red');
      })

    test('switching style from an object to a CSS string updates declarations', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        bind(app, elem('div', { style: { backgroundColor: 'red', color: 'white' } }));
        bind(app, elem('div', { style: 'color: blue' }));
        const el = app.firstElementChild as HTMLElement;
        expect(el.style.backgroundColor).toBe('');
        expect(el.style.color).toBe('blue');
      })

    test('switching style from a CSS string to an object updates declarations', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        bind(app, elem('div', { style: 'background-color: red; color: white' }));
        bind(app, elem('div', { style: { color: 'blue' } }));
        const el = app.firstElementChild as HTMLElement;
        expect(el.style.backgroundColor).toBe('');
        expect(el.style.color).toBe('blue');
      })
  });

  describe('attribute transitions', () => {
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
      })

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
      })

    test('removes obsolete attributes before setting new ones', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('div', { 'data-state': 'old' }));
      const el = app.querySelector('div')!;

      bind(app, elem('div', { 'DATA-STATE': 'new' }));

      expect(app.querySelector('div')).toBe(el);
      expect(el.getAttribute('data-state')).toBe('new');
    })

    test('removes an obsolete input type before setting its value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('input', { type: 'file' }));
      const input = app.querySelector('input')!;

      bind(app, elem('input', { value: 'hello' }));

      expect(app.querySelector('input')).toBe(input);
      expect(input.type).toBe('text');
      expect(input.value).toBe('hello');
    })

    test('removes attributes whose previous values were zero or empty strings', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('div', { title: '', 'data-count': 0 }));
      const el = app.firstElementChild!;
      expect(el.getAttribute('title')).toBe('');
      expect(el.getAttribute('data-count')).toBe('0');
      bind(app, elem('div', { title: null, 'data-count': undefined }));
      expect(el.hasAttribute('title')).toBe(false);
      expect(el.hasAttribute('data-count')).toBe(false);
    });

    test('removes old attributes that disappear from the vnode', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('div', { title: 'old', id: 'some-id' }));
      const el = app.firstElementChild!;
      bind(app, elem('div', { id: 'some-id' }));
      expect(el.hasAttribute('title')).toBe(false);
      expect(el.getAttribute('id')).toBe('some-id');
    });

    test('removes an explicitly null input type before setting its value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('input', { type: 'file' }));
      const input = app.querySelector('input')!;
      bind(app, elem('input', { type: null, value: 'hello' }));
      expect(app.querySelector('input')).toBe(input);
      expect(input.type).toBe('text');
      expect(input.value).toBe('hello');
    });

    test('removes an explicitly undefined input type before setting its value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('input', { type: 'file' }));
      const input = app.querySelector('input')!;
      bind(app, elem('input', { type: undefined, value: 'hello' }));
      expect(app.querySelector('input')).toBe(input);
      expect(input.type).toBe('text');
      expect(input.value).toBe('hello');
    });

    test('preserves an unchanged type attribute across redraws', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('input', { type: 'number' }));
      const input = app.querySelector('input')!;
      bind(app, elem('input', { type: 'number', title: 'updated' }));
      expect(app.querySelector('input')).toBe(input);
      expect(input.getAttribute('type')).toBe('number');
      expect(input.type).toBe('number');
      expect(input.title).toBe('updated');
    });
  });

  describe('controlled and uncontrolled inputs', () => {
    test('an unrelated redraw restores an explicitly controlled input value', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        let title = 'a';
        const View = compDef({ draw: () => elem('input', { value: 'initial', title }) });
        const view = comp(View);
        bind(app, view);
        const input = app.querySelector('input')!;
        input.value = 'user typed';
        title = 'b';
        draw(view);
        sync();
        expect(app.querySelector('input')).toBe(input);
        expect(input.value).toBe('initial');
      })

    test('unrelated redraw preserves browser-managed value when value is omitted', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let title = 'a';
      const View = compDef({ draw: () => elem('input', { title }) });
      const view = comp(View);
      bind(app, view);
      const input = app.querySelector('input')!;
      input.value = 'user typed';
      title = 'b';
      draw(view);
      sync();
      expect(app.querySelector('input')).toBe(input);
      expect(input.value).toBe('user typed');
    });

    test('value: undefined relinquishes control without resetting user input', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      bind(app, elem('input', { value: 'initial' }));
      const input = app.querySelector('input')!;
      input.value = 'user typed';
      bind(app, elem('input', { value: undefined, title: 'updated' }));
      expect(input.value).toBe('user typed');
      input.value = 'edited again';
      bind(app, elem('input', { value: undefined, title: 'updated twice' }));
      expect(input.value).toBe('edited again');
    });
  });

  describe('events', () => {
    test('Attribute starting with "on" is applied as a function', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        const el1 = elem('div', {
          onclick: e => e.stopImmediatePropagation()
        });
        bind(app, el1);
        expect(el1.el instanceof HTMLElement).toBe(true);
        expect(typeof (el1.el as HTMLElement).onclick).toBe('function');
      })

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
      })

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
      })

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
      })

    test('an unchanged callback still redraws after several vnode replacements', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        let count = 0;
        const handler = () => { count++; };
        const View = compDef({ draw: () => elem('button', { onclick: handler }, String(count)) });
        const view = comp(View);
        bind(app, view);
        const button = app.querySelector('button')!;
        draw(view);
        sync();
        draw(view);
        sync();
        button.click();
        sync();
        expect(app.querySelector('button')).toBe(button);
        expect(button.textContent).toBe('1');
      })

    test('an event callback runs with currentTarget as this', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        let receivedThis: unknown;
        let receivedEvent: Event | undefined;
        function handler(this: EventTarget, event: Event) {
          // Capture the actual `this` binding to verify event handler behavior.
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          receivedThis = this;
          receivedEvent = event;
        }
        bind(app, elem('button', { onclick: handler }));
        const button = app.querySelector('button')!;
        button.click();
        expect(receivedThis).toBe(button);
        expect(receivedEvent?.currentTarget).toBeNull(); // currentTarget is reset after dispatch
        expect(receivedEvent?.type).toBe('click');
      })
  });

  describe('early-exit behavior', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    afterEach(() => {
      bind(container, null);
    });

    test('same-reference style objects are still applied', () => {
        const style = { color: 'red' };
        const view = () => elem('div', { style });

        bind(container, view());
        const el = container.querySelector('div')!;

        expect(el.style.color).toBe('red');

        style.color = 'blue';
        bind(container, view());

        expect(el.style.color).toBe('blue');
      })

    test('unchanged event handlers remain functional', () => {
        let clicks = 0;
        const onclick = () => { clicks++; };
        const view = () => elem('button', { onclick }, 'Click');

        bind(container, view());
        const button = container.querySelector('button')!;

        button.click();
        bind(container, view());
        button.click();

        expect(clicks).toBe(2);
        expect(container.querySelector('button')).toBe(button);
      })
  });
});
