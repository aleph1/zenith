import { describe, expect, test } from 'vitest';
import { bind, comp, compDef } from '../../src/index';
import { closest } from '../../src/helpers/closest';

describe('closest', () => {
  test('finds a matching ancestor', () => {
    const container = document.createElement('div');
    let found;

    const Child = compDef({
      draw: vNode => {
        found = closest(vNode, n => n.attrs && n.attrs.theme === 'dark');
        return null;
      }
    });

    const Parent = compDef({
      draw: () => comp(Child)
    });

    bind(container, comp(Parent, { theme: 'dark' }));

    expect(found?.$d).toBe(Parent);
    expect(found?.attrs.theme).toBe('dark');

    bind(container, null);
  });

  test('returns the nearest matching ancestor', () => {
    const container = document.createElement('div');
    let found;

    const Child = compDef({
      draw: vNode => {
        found = closest(vNode, n => !!(n.attrs && n.attrs.theme));
        return null;
      }
    });

    const Inner = compDef({
      draw: () => comp(Child)
    });

    const Outer = compDef({
      draw: () => comp(Inner, { theme: 'light' })
    });

    bind(container, comp(Outer, { theme: 'dark' }));

    expect(found?.$d).toBe(Inner);
    expect(found?.attrs.theme).toBe('light');

    bind(container, null);
  });

  test('skips ancestors that do not match', () => {
    const container = document.createElement('div');
    let found;

    const Child = compDef({
      draw: vNode => {
        found = closest(vNode, n => !!(n.attrs && n.attrs.theme));
        return null;
      }
    });

    const Middle = compDef({
      draw: () => comp(Child)
    });

    const Outer = compDef({
      draw: () => comp(Middle)
    });

    bind(container, comp(Outer, { theme: 'dark' }));

    expect(found?.$d).toBe(Outer);

    bind(container, null);
  });

  test('returns undefined when no ancestor matches', () => {
    const container = document.createElement('div');
    let found;

    const Child = compDef({
      draw: vNode => {
        found = closest(vNode, n => !!(n.attrs && n.attrs.theme));
        return null;
      }
    });

    bind(container, comp(Child));

    expect(found).toBeUndefined();

    bind(container, null);
  });
});
