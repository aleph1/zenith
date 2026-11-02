
import { describe, expect, test } from 'vitest';
import { bind, comp, compDef, elem } from '../../src/index';
import { inject } from '../../src/helpers/inject';

describe('inject', () => {
  test('retrieves values from an ancestor provider', () => {
    const container = document.createElement('div');
    let injected: Record<string, any> = {};

    const Child = compDef({
      draw: vNode => {
        injected = inject(vNode, 'theme');
        return null;
      }
    });

    const Parent = compDef({
      init: vNode => {
        vNode.provide = { theme: 'dark' };
      },
      draw: () => comp(Child)
    });

    bind(container, comp(Parent));

    expect(injected).toEqual({ theme: 'dark' });

    bind(container, null);
  });

  test('uses the nearest provider for duplicate keys', () => {
    const container = document.createElement('div');
    let injected: Record<string, any> = {};

    const Child = compDef({
      draw: vNode => {
        injected = inject(vNode, 'theme');
        return null;
      }
    });

    const Inner = compDef({
      init: vNode => {
        vNode.provide = { theme: 'light' };
      },
      draw: () => comp(Child)
    });

    const Outer = compDef({
      init: vNode => {
        vNode.provide = { theme: 'dark' };
      },
      draw: () => comp(Inner)
    });

    bind(container, comp(Outer));

    expect(injected).toEqual({ theme: 'light' });

    bind(container, null);
  });

  test('collects different keys from multiple ancestors', () => {
    const container = document.createElement('div');
    let injected: Record<string, any> = {};

    const Child = compDef({
      draw: vNode => {
        injected = inject(vNode, 'theme', 'language');
        return null;
      }
    });

    const Inner = compDef({
      init: vNode => {
        vNode.provide = { language: 'en' };
      },
      draw: () => comp(Child)
    });

    const Outer = compDef({
      init: vNode => {
        vNode.provide = { theme: 'dark' };
      },
      draw: () => comp(Inner)
    });

    bind(container, comp(Outer));

    expect(injected).toEqual({
      theme: 'dark',
      language: 'en'
    });

    bind(container, null);
  });

  test('skips undefined values and continues searching ancestors', () => {
    const container = document.createElement('div');
    let injected: Record<string, any> = {};

    const Child = compDef({
      draw: vNode => {
        injected = inject(vNode, 'theme');
        return null;
      }
    });

    const Inner = compDef({
      init: vNode => {
        vNode.provide = { theme: undefined };
      },
      draw: () => comp(Child)
    });

    const Outer = compDef({
      init: vNode => {
        vNode.provide = { theme: 'dark' };
      },
      draw: () => comp(Inner)
    });

    bind(container, comp(Outer));

    expect(injected).toEqual({ theme: 'dark' });

    bind(container, null);
  });

  test('returns an empty object when no provider matches', () => {
    const container = document.createElement('div');
    let injected: Record<string, any> = {};

    const Child = compDef({
      draw: vNode => {
        injected = inject(vNode, 'missing');
        return null;
      }
    });

    bind(container, comp(Child));

    expect(injected).toEqual({});

    bind(container, null);
  });
});
