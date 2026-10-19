/**
 * DEBUG-only branches of src/index.ts.
 * DEBUG is read when the module is evaluated, so these tests deliberately
 * import a fresh module after setting window.DEBUG = true.
 *
 * These tests must run in Vitest's DOM environment (jsdom or happy-dom).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type Framework = typeof import('../src/index');
let lib: Framework;
let app: HTMLElement;

beforeEach(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app')!;
  window.DEBUG = true;
  vi.resetModules();
  lib = await import('../src/index');
});

afterEach(() => {
  delete window.DEBUG;
  vi.resetModules();
  vi.restoreAllMocks();
});

test('Element attributes are frozen in DEBUG mode', () => {
  const node = lib.elem('div', { id: 'test' });
  expect(Object.isFrozen(node.attrs)).toBe(true);
});

test('comp() attributes are frozen in DEBUG mode', () => {
  const Component = lib.compDef({
    draw: () => lib.elem('div')
  });
  expect(Object.isFrozen(lib.comp(Component).attrs)).toBe(true);
  expect(Object.isFrozen(lib.comp(Component, { id: 'test' }).attrs)).toBe(true);
});

describe('Development-only validation', () => {
  test.each([
    ['missing draw', {}, /draw function/],
    ['invalid draw', { draw: 1 }, /draw must be a function/],
    ['invalid init', { draw: () => null, init: 1 }, /init must be a function/],
    ['invalid drawn', { draw: () => null, drawn: 1 }, /drawn must be a function/],
    ['invalid remove', { draw: () => null, remove: 1 }, /remove must be a function/],
    ['invalid removed', { draw: () => null, removed: 1 }, /removed must be a function/],
    ['invalid $memo', { draw: () => null, $memo: 'yes' }, /\$memo must be a boolean or function/],
  ])('%s', (_description, definition, message) => {
    expect(() => lib.compDef(definition as any)).toThrow(message as RegExp);
  });

  test('rejects an unkeyed component returning a removal Promise', () => {
    let show = true;
    const Leaving = lib.compDef({
      draw: () => lib.elem('i', 'leaving'),
      remove: () => new Promise<void>(() => {}),
    });
    const View = lib.compDef({ draw: () => show ? lib.comp(Leaving) : [] });
    const view = lib.comp(View);
    lib.bind(app, view);
    show = false;
    expect(() => { lib.draw(view); lib.sync(); }).toThrow(/requires a key/i);
  });

  // This deliberately simulates a broken parent link. It is an internal guard,
  // rather than a normal supported state transition.
  test('warns when deferred removal resolves with no parent link', async () => {
    let finish!: () => void;
    const Leaving = lib.compDef({
      draw: () => lib.elem('i', 'leaving'),
      remove: () => new Promise<void>(resolve => { finish = resolve; }),
    });
    let show = true;
    const View = lib.compDef({
      draw: () => lib.elem('section',
        ...(show
          ? [lib.comp(Leaving, { $key: 'leave' }), lib.elem('b', { $key: 'keep' }, 'keep')]
          : [lib.elem('b', { $key: 'keep' }, 'keep')]),
      ),
    });
    const view = lib.comp(View);
    lib.bind(app, view);
    const leaving = (view.nodes[0] as any).nodes[0] as any;
    show = false;
    lib.draw(view);
    lib.sync();
    // Invalid internal state to exercise the defensive console.warn branch.
    leaving.$p = null;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    finish();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Promise resolved'),
      expect.any(String),
    );
  });

  test('rejects duplicate sibling keys in debug mode', () => {
    expect(() => lib.elem('ul',
      lib.elem('li', { $key: 'a' }, 'First'),
      lib.elem('li', { $key: 'a' }, 'Second')
    )).toThrow(/Duplicate sibling key/);
  });

  test('Surgical draw throws on non-component in DEBUG mode', () => {
    const node = lib.elem('div', { id: 'test' });
    expect(() => {
      // @ts-expect-error Testing an invalid surgical draw argument
      lib.draw(node, true);
    }).toThrow('Surgical redraw requires a component vnode');
  });

});