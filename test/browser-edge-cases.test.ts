import { describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, redraw, elem, sync } from '../src/index';

// Place this file in test/browser-edge-cases.test.ts.
// Some tests intentionally establish NEW desired guarantees and may fail
// until the implementation is adjusted.

describe('redraws after component removal', () => {
  test('ignores a targeted redraw after unbinding', () => {
    const container = document.createElement('div');
    let instance: ReturnType<typeof comp> | undefined;
    let visible = false;

    const Child = compDef({
      init: vNode => { instance = vNode; },
      draw: () => { return visible ? elem('span', 'Ghost') : []; }
    });

    bind(container, comp(Child));
    bind(container, null);

    visible = true;
    expect(() => { redraw(instance!, true); sync(); }).not.toThrow();
    expect(container.childNodes).toHaveLength(0);
  });

  test('ignores a non-surgical redraw after unbinding', () => {
    const container = document.createElement('div');
    let instance: ReturnType<typeof comp> | undefined;
    let value = 'First';

    const Child = compDef({
      init: vNode => { instance = vNode; },
      draw: () => { return elem('span', value); }
    });

    bind(container, comp(Child));
    bind(container, null);

    value = 'Ghost';
    expect(() => { redraw(instance!); sync(); }).not.toThrow();
    expect(container.childNodes).toHaveLength(0);
  });

  test('ignores a targeted redraw after removing a child from a live tree', () => {
    const container = document.createElement('div');
    let instance: ReturnType<typeof comp> | undefined;

    const Child = compDef({
      init: vNode => { instance = vNode; },
      draw: () => { return elem('span', 'Removed child'); }
    });

    bind(container, elem('div', comp(Child)));
    bind(container, elem('div', elem('b', 'Survivor')));

    expect(() => { redraw(instance!, true); sync(); }).not.toThrow();
    expect(container.textContent).toBe('Survivor');

    bind(container, null);
  });
});

describe('live form control properties', () => {
  test('updates checkbox checkedness after user interaction', () => {
    const container = document.createElement('div');
    const render = (checked: boolean) => elem('input', { type: 'checkbox', checked });

    bind(container, render(true));
    const input = container.querySelector('input')!;
    expect(input.checked).toBe(true);

    // Browser interactions make the live property diverge from the HTML attribute.
    input.checked = false;
    bind(container, render(false));
    bind(container, render(true));

    expect(container.querySelector('input')).toBe(input);
    expect(input.checked).toBe(true);
    bind(container, null);
  });

  test('applies the initial value of a select after options are created', () => {
    const container = document.createElement('div');

    bind(container, elem('select', { value: 'b' },
      elem('option', { value: 'a' }, 'A'),
      elem('option', { value: 'b' }, 'B')
    ));

    expect(container.querySelector('select')!.value).toBe('b');
    bind(container, null);
  });

  test('updates a textarea value after user editing', () => {
    const container = document.createElement('div');
    const render = (value: string) => elem('textarea', { value });

    bind(container, render('First'));
    const textarea = container.querySelector('textarea')!;
    textarea.value = 'User edit';

    bind(container, render('Second'));
    expect(textarea.value).toBe('Second');
    bind(container, null);
  });
});

describe('reconciled event handlers', () => {
  test('a stable handler still redraws after its element vnode is replaced', () => {
    const container = document.createElement('div');
    let count = 0;
    const onClick = () => { count++; };

    const Counter = compDef({
      draw: () => { return elem('button', { onclick: onClick }, String(count)); }
    });

    bind(container, comp(Counter));
    const button = container.querySelector('button')!;

    // The DOM button and handler function remain the same; its vnode is replaced.
    bind(container, comp(Counter));
    expect(container.querySelector('button')).toBe(button);

    button.click();
    sync();
    expect(count).toBe(1);
    expect(button.textContent).toBe('1');
    bind(container, null);
  });

  test('replaces and removes event handlers without calling old callbacks', () => {
    const container = document.createElement('div');
    const oldHandler = vi.fn();
    const nextHandler = vi.fn();

    bind(container, elem('button', { onclick: oldHandler }, 'Click'));
    const button = container.querySelector('button')!;

    bind(container, elem('button', { onclick: nextHandler }, 'Click'));
    button.click();
    sync();
    expect(oldHandler).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledTimes(1);

    bind(container, elem('button', 'Click'));
    button.click();
    sync();
    expect(nextHandler).toHaveBeenCalledTimes(1);
    bind(container, null);
  });
});