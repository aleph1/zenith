import { describe, test, expect, vi } from 'vitest';
import { bind, comp, compDef, draw, elem, sync } from '../src/index';
import { VNODE_COMP } from '../src/vNode.defs';
import { redraw } from './utils';

describe('comp()', () => {
  test('Returns a vNode with the correct type', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.is).toBe(VNODE_COMP);
  });
  test('Returns a vNode with the correct type when an incorrect type is passed', () => {
    const compDef = {
      draw: () => null,
      type: 0
    };
    const comp1 = comp(compDef);
    expect(comp1.is).toBe(VNODE_COMP);
  });
  test('Returns a vNode with a frozen empty attrs object', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.attrs).toEqual({});
    expect(Object.isFrozen(comp1.attrs)).toBe(true);
  });
  test('Returns a vNode with a frozen attrs object with the expected properties', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef, {
      id: 'test'
    });
    expect(comp1.attrs).toEqual({id:'test'});
    expect(Object.isFrozen(comp1.attrs)).toBe(true);
  });
  test('Returns a vNode with the component definition as .tag', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.$d).toBe(compDef);
  });
});

describe('Component memoization', () => {
  test('$memo: true skips redraw when attributes are the same object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const attrs = { label: 'same' };
    const render = vi.fn(() => elem('span', 'same'));
    const Child = compDef({ $memo: true, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(1);
  });

  test('$memo: true redraws when the attributes object changes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let attrs = { label: 'a' };
    const render = vi.fn((vNode: any) => elem('span', vNode.attrs.label));
    const Child = compDef({ $memo: true, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    attrs = { label: 'b' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(2);
    expect(app.textContent).toBe('b');
  });

  test('a custom $memo predicate controls whether an update is skipped', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let attrs = { label: 'a' };
    const memo = vi.fn((next: any, prev: any) => next.label === prev.label);
    const render = vi.fn((vNode: any) => elem('span', vNode.attrs.label));
    const Child = compDef({ $memo: memo, draw: render });
    const Parent = compDef({ draw: () => comp(Child, attrs) });
    const parent = comp(Parent);
    bind(app, parent);
    attrs = { label: 'a' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(1);
    attrs = { label: 'b' };
    redraw(parent);
    expect(render).toHaveBeenCalledTimes(2);
    expect(memo).toHaveBeenCalled();
    expect(app.textContent).toBe('b');
  });
});

describe('stable component vnode identity', () => {
    test('preserves identity across parent redraws and attribute updates', () => {
        const container = document.createElement('div');
        const initialized = [];
        const rendered = [];
        const removed = [];

        const Child = compDef({
            init(vnode) {
                initialized.push(vnode);
            },
            draw(vnode) {
                rendered.push(vnode);
                return elem('span', vnode.attrs.label);
            },
            removed(vnode) {
                removed.push(vnode);
            }
        });

        bind(container, elem('div',
            comp(Child, { label: 'First' })
        ));

        const original = initialized[0];

        bind(container, elem('div',
            comp(Child, { label: 'Second' })
        ));

        expect(initialized).toHaveLength(1);
        expect(rendered.every(vnode => vnode === original)).toBe(true);
        expect(original.attrs.label).toBe('Second');
        expect(container.textContent).toBe('Second');

        bind(container, null);

        expect(removed).toEqual([original]);
    });

    test('preserves component identity when keyed siblings are reordered', () => {
        const container = document.createElement('div');
        const instances = new Map();
        const removed = [];

        const Item = compDef({
            init(vnode) {
                instances.set(vnode.attrs.id, vnode);
            },
            draw(vnode) {
                return elem('span', vnode.attrs.id);
            },
            removed(vnode) {
                removed.push(vnode);
            }
        });

        const render = ids => elem('div',
            ids.map(id => comp(Item, { $key: id, id }))
        );

        bind(container, render(['a', 'b', 'c']));

        const a = instances.get('a');
        const b = instances.get('b');
        const c = instances.get('c');

        bind(container, render(['c', 'a', 'b']));

        expect(container.textContent).toBe('cab');
        expect(instances.size).toBe(3);

        // The retained vnode references should still belong to the tree.
        const root = bind(container, render(['b', 'c', 'a']));
        const children = root.nodes[0].nodes;

        expect(children[0]).toBe(b);
        expect(children[1]).toBe(c);
        expect(children[2]).toBe(a);
        expect(container.textContent).toBe('bca');

        bind(container, null);

        expect(removed).toHaveLength(3);
        expect(removed).toContain(a);
        expect(removed).toContain(b);
        expect(removed).toContain(c);
    });

    test('preserves identity when a component changes portal targets', () => {
        const container = document.createElement('div');
        const targetA = document.createElement('div');
        const targetB = document.createElement('div');

        const initialized = [];
        const removed = [];

        const Child = compDef({
            init(vnode) {
                initialized.push(vnode);
            },
            draw(vnode) {
                return elem('span', vnode.attrs.label);
            },
            removed(vnode) {
                removed.push(vnode);
            }
        });

        const render = (to, label) =>
            elem('div', comp(Child, { to, label }));

        bind(container, render(targetA, 'First'));

        const original = initialized[0];

        expect(targetA.textContent).toBe('First');

        bind(container, render(targetB, 'Second'));

        expect(initialized).toHaveLength(1);
        expect(targetA.textContent).toBe('');
        expect(targetB.textContent).toBe('Second');
        expect(original.attrs.to).toBe(targetB);

        // Portal back into the normal DOM tree.
        bind(container, render(undefined, 'Third'));

        expect(targetB.textContent).toBe('');
        expect(container.textContent).toBe('Third');
        expect(initialized).toHaveLength(1);

        bind(container, null);

        expect(removed).toEqual([original]);
    });

    test('preserves component-owned data until removal', () => {
        const container = document.createElement('div');
        const state = new Map();
        const initialized = [];
        const removed = [];

        const Counter = compDef({
            init(vnode) {
                initialized.push(vnode);
                state.set(vnode, { count: 0 });
            },
            draw(vnode) {
                const counter = state.get(vnode);
                return elem('span',
                    `${vnode.attrs.label}: ${counter.count}`
                );
            },
            removed(vnode) {
                removed.push(vnode);
                state.delete(vnode);
            }
        });

        bind(container, elem('div',
            comp(Counter, { label: 'First' })
        ));

        const original = initialized[0];
        state.get(original).count = 5;

        bind(container, elem('div',
            comp(Counter, { label: 'Second' })
        ));

        expect(container.textContent).toBe('Second: 5');
        expect(initialized).toHaveLength(1);
        expect(state.size).toBe(1);
        expect(state.has(original)).toBe(true);

        bind(container, null);

        expect(removed).toEqual([original]);
        expect(state.size).toBe(0);
    });

    test('preserves identity when asynchronous removal is cancelled', async () => {
      const container = document.createElement('div');
      let resolveRemoval!: () => void;
      let original;
      let initCount = 0;
      let removeCount = 0;
      let removedCount = 0;

      const Child = compDef({
          init(vnode) {
              original = vnode;
              initCount++;
          },

          draw(vnode) {
              return elem('span', vnode.attrs.label);
          },

          remove() {
              removeCount++;
              return new Promise<void>(resolve => {
                  resolveRemoval = resolve;
              });
          },

          removed() {
              removedCount++;
          }
      });

      const render = (label: string, removing = false) =>
          elem('div',
              comp(Child, {
                  $key: 'child',
                  $remove: removing,
                  label
              })
          );

      // Mount the component.
      bind(container, render('First'));

      expect(initCount).toBe(1);
      expect(container.textContent).toBe('First');

      // Start a deferred removal.
      bind(container, render('First', true));

      expect(removeCount).toBe(1);
      expect(removedCount).toBe(0);
      expect(container.textContent).toBe('First');

      // Reintroduce the same keyed component before removal completes.
      bind(container, render('Second'));

      expect(initCount).toBe(1);
      expect(original.attrs.label).toBe('Second');
      expect(container.textContent).toBe('Second');

      // Resolve the original removal Promise.
      resolveRemoval();
      await Promise.resolve();

      // The cancelled removal must not destroy the retained component.
      expect(removedCount).toBe(0);
      expect(container.textContent).toBe('Second');
      expect(original.el.parentNode).not.toBeNull();

      // Verify the component can still update.
      bind(container, render('Third'));

      expect(original.attrs.label).toBe('Third');
      expect(container.textContent).toBe('Third');
      expect(initCount).toBe(1);

      // Cleanup: removal begins again, so resolve its new Promise.
      bind(container, null);

      expect(removedCount).toBe(1);
  });

  test('preserves an empty component instance across parent redraws', () => {
    const container = document.createElement('div');
    const init = vi.fn();
    const removed = vi.fn();
    let original;

    const Child = compDef({
        init(vnode) {
            original = vnode;
            init();
        },
        draw(vnode) {
            return vnode.attrs.visible
                ? elem('span', 'Visible')
                : [];
        },
        removed
    });

    const render = visible =>
        elem('div', comp(Child, { visible }));

    bind(container, render(false));
    expect(init).toHaveBeenCalledTimes(1);

    bind(container, render(true));

    expect(init).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('Visible');

    bind(container, null);
    expect(removed).toHaveBeenCalledTimes(1);
  });

  test('updates component el when its root element changes', () => {
      const container = document.createElement('div');
      let original;

      const Child = compDef({
          init(vnode) {
              original = vnode;
          },
          draw(vnode) {
              return elem(vnode.attrs.tag, 'Content');
          }
      });

      const render = tag =>
          elem('div', comp(Child, { tag }));

      bind(container, render('span'));

      const first = original.el;
      expect(first.tagName).toBe('SPAN');

      bind(container, render('strong'));

      const second = container.querySelector('strong');

      expect(second).not.toBeNull();
      expect(original.el).toBe(second);
      expect(original.el).not.toBe(first);

      bind(container, null);
  });

  test('inserts newly visible component content in sibling order', () => {
      const container = document.createElement('div');

      const Child = compDef({
          draw(vnode) {
              return vnode.attrs.visible
                  ? elem('span', 'Middle')
                  : [];
          }
      });

      const render = visible => elem('div',
          elem('span', 'Before'),
          comp(Child, { visible }),
          elem('span', 'After')
      );

      bind(container, render(false));
      bind(container, render(true));

      expect(
          [...container.firstElementChild.children]
              .map(el => el.textContent)
      ).toEqual(['Before', 'Middle', 'After']);

      bind(container, null);
  });

  test('preserves position when empty component gains multiple roots', () => {
      const container = document.createElement('div');
      let child;
      let visible = false;

      const Child = compDef({
          init(vnode) {
              child = vnode;
          },
          draw() {
              return visible
                  ? [elem('span', 'A'), elem('span', 'B')]
                  : [];
          }
      });

      bind(container, elem('div',
          elem('span', 'Before'),
          comp(Child),
          elem('span', 'After')
      ));

      visible = true;
      draw(child, true);
      sync();

      expect([...container.firstElementChild.children]
          .map(el => el.textContent)
      ).toEqual(['Before', 'A', 'B', 'After']);

      visible = false;
      draw(child, true);
      sync();

      expect([...container.firstElementChild.children]
          .map(el => el.textContent)
      ).toEqual(['Before', 'After']);

      bind(container, null);
  });

});

test('updates ancestor el when a nested component changes its root', () => {
    const container = document.createElement('div');
    let child: ReturnType<typeof comp>;
    let parent: ReturnType<typeof comp>;
    let visible = false;

    const Child = compDef({
        init(vnode) {
            child = vnode;
        },
        draw() {
            return visible ? elem('span', 'Visible') : [];
        }
    });

    const Parent = compDef({
        init(vnode) {
            parent = vnode;
        },
        draw() {
            return comp(Child);
        }
    });

    bind(container, elem('div', comp(Parent)));

    expect(parent!.el).toBeNull();
    expect(child!.el).toBeNull();

    visible = true;
    draw(child!, true);
    sync();

    expect(container.textContent).toBe('Visible');
    expect(parent!.el).toBe(child!.el);
    expect(parent!.el?.parentNode).toBe(container.firstChild);

    bind(container, null);
});

test('redraws nested components after their original root is replaced', () => {
    const container = document.createElement('div');

    let child: ReturnType<typeof comp>;
    let middle: ReturnType<typeof comp>;
    let visible = false;
    let extra = false;

    const Child = compDef({
        init(vnode) {
            child = vnode;
        },
        draw() {
            return visible ? elem('span', 'Child') : [];
        }
    });

    const Middle = compDef({
        init(vnode) {
            middle = vnode;
        },
        draw() {
            return extra
                ? [comp(Child), elem('b', 'Extra')]
                : comp(Child);
        }
    });

    const Outer = compDef({
        draw() {
            return comp(Middle);
        }
    });

    bind(container, elem('div', comp(Outer)));

    visible = true;
    draw(child!, true);
    sync();

    expect(container.textContent).toBe('Child');

    extra = true;
    draw(middle!, true);

    expect(() => sync()).not.toThrow();
    expect(container.textContent).toBe('ChildExtra');

    bind(container, null);
});