import { describe, test, expect, vi } from 'vitest';
import { bind, comp, compDef, redraw, elem, sync } from '../src/index';
import { VNODE_COMP } from '../src/vNode.defs';

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

  test('Returns a vNode with an empty attrs object', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef);
    expect(comp1.attrs).toEqual({});
  });

  test('Returns a vNode with the expected attributes', () => {
    const compDef = {
      draw: () => null
    };
    const comp1 = comp(compDef, { id: 'test' });
    expect(comp1.attrs).toEqual({ id: 'test' });
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
    sync();
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
    sync();
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
    sync();
    expect(render).toHaveBeenCalledTimes(1);
    attrs = { label: 'b' };
    redraw(parent);
    sync();
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
            init: vNode => {
                initialized.push(vNode);
            },
            draw: vNode => {
                rendered.push(vNode);
                return elem('span', vNode.attrs.label);
            },
            removed(vNode) {
                removed.push(vNode);
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
            init: vNode => {
                instances.set(vNode.attrs.id, vNode);
            },
            draw: vNode => elem('span', vNode.attrs.id),
            removed: vNode => {
                removed.push(vNode);
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

    const Child = compDef({
        init() {
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
      redraw(child, true);
      sync();

      expect([...container.firstElementChild.children]
          .map(el => el.textContent)
      ).toEqual(['Before', 'A', 'B', 'After']);

      visible = false;
      redraw(child, true);
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
    redraw(child!, true);
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
        init: vNode => { child = vNode; },
        draw: () => visible ? elem('span', 'Child') : [],
    });

    const Middle = compDef({
        init: vNode => { middle = vNode; },
        draw: () => extra
                ? [comp(Child), elem('b', 'Extra')]
                : comp(Child),
    });

    const Outer = compDef({
        draw: () => comp(Middle),
    });

    bind(container, elem('div', comp(Outer)));

    visible = true;
    redraw(child!, true);
    sync();

    expect(container.textContent).toBe('Child');

    extra = true;
    redraw(middle!, true);

    expect(() => sync()).not.toThrow();
    expect(container.textContent).toBe('ChildExtra');

    bind(container, null);
});

test('preserves component state across redraws and keyed moves', () => {
    const container = document.createElement('div');
    const instances = new Map<string, ReturnType<typeof comp>>();

    const Counter = compDef({
        init(vnode) {
            vnode.state = { count: 0 };
            instances.set(vnode.attrs.$key, vnode);
        },

        draw(vnode) {
            return elem('span', vnode.state!.count);
        }
    });

    const render = (keys: string[]) =>
        elem('div', keys.map($key =>
            comp(Counter, { $key })
        ));

    bind(container, render(['a', 'b']));

    const a = instances.get('a')!;
    const b = instances.get('b')!;

    a.state!.count = 5;

    // Mutating state does not automatically redraw.
    expect(container.textContent).toBe('00');

    redraw(a, true);
    sync();

    expect(container.textContent).toBe('50');

    // Reordering retains the original component instances.
    bind(container, render(['b', 'a']));

    expect(instances.get('a')).toBe(a);
    expect(instances.get('b')).toBe(b);
    expect(a.state!.count).toBe(5);
    expect(b.state!.count).toBe(0);
    expect(container.textContent).toBe('05');

    bind(container, null);
});

test('preserves state through cleanup and resets it on remount', () => {
    const container = document.createElement('div');

    let initCount = 0;
    const removedStates: number[] = [];

    const Counter = compDef({
        init(vnode) {
            vnode.state = { id: ++initCount };
        },

        draw(vnode) {
            return elem('span', vnode.state!.id);
        },

        removed(vnode) {
            removedStates.push(vnode.state!.id);
        }
    });

    bind(container, comp(Counter));

    expect(container.textContent).toBe('1');

    bind(container, null);

    expect(removedStates).toEqual([1]);

    bind(container, comp(Counter));

    expect(container.textContent).toBe('2');
    expect(initCount).toBe(2);

    bind(container, null);

    expect(removedStates).toEqual([1, 2]);
});

test('removed components cannot redraw their former parent', () => {
    const container = document.createElement('div');

    let child: ReturnType<typeof comp>;
    let visible = true;
    let renders = 0;

    const Child = compDef({
        init(vnode) {
            child = vnode;
        },
        draw() {
            return elem('span', 'Child');
        }
    });

    const Parent = compDef({
        draw() {
            renders++;
            return elem('div',
                visible
                    ? comp(Child)
                    : elem('span', 'Removed')
            );
        }
    });

    const root = bind(container, comp(Parent));

    visible = false;
    redraw(root);
    sync();

    expect(container.textContent).toBe('Removed');

    const before = renders;

    // This component has already been destroyed.
    redraw(child!);
    sync();

    // Its former parent must not redraw.
    expect(renders).toBe(before);
    expect(container.textContent).toBe('Removed');

    bind(container, null);
});
describe('content outlet convention', () => {
  test('renders externally supplied nodes and updates them with a targeted redraw', () => {
    const container = document.createElement('div');
    const Outlet = compDef({ draw: vNode => vNode.attrs.$nodes });
    const outlet = comp(Outlet, { $nodes: [] });

    bind(container, elem('div', elem('i', 'Before'), outlet, elem('i', 'After')));
    expect(container.textContent).toBe('BeforeAfter');

    outlet.attrs = { $nodes: [elem('span', 'First')] };
    redraw(outlet, true);
    sync();

    const span = container.querySelector('span');
    expect(container.textContent).toBe('BeforeFirstAfter');

    outlet.attrs = { $nodes: [elem('span', 'Updated')] };
    redraw(outlet, true);
    sync();

    expect(container.querySelector('span')).toBe(span);
    expect(container.textContent).toBe('BeforeUpdatedAfter');

    bind(container, null);
  });

  test('reorders keyed contributions without remounting unchanged components', () => {
    const container = document.createElement('div');
    const initialized = new Map<string, ReturnType<typeof comp>>();
    const removed = vi.fn();
    let outlet!: ReturnType<typeof comp>;
    let ids = ['a', 'b', 'c'];

    const Item = compDef({
      init(vNode) {
        initialized.set(vNode.attrs.id, vNode);
      },
      draw(vNode) {
        return elem('button', vNode.attrs.id);
      },
      removed
    });
    const Outlet = compDef({
      init(vNode) {
        outlet = vNode;
      },
      draw() {
        return ids.map(id => comp(Item, { $key: id, id }));
      }
    });

    bind(container, elem('div', elem('i', 'Before'), comp(Outlet), elem('i', 'After')));
    const buttons = new Map(['a', 'b', 'c'].map(id => [
      id, [...container.querySelectorAll('button')].find(el => el.textContent === id)!
    ]));

    ids = ['c', 'a', 'b'];
    redraw(outlet, true);
    sync();

    expect([...container.querySelectorAll('button')].map(el => el.textContent)).toEqual(ids);
    for (const id of ids) {
      expect([...container.querySelectorAll('button')].find(el => el.textContent === id))
        .toBe(buttons.get(id));
    }
    expect(initialized.size).toBe(3);
    expect(removed).not.toHaveBeenCalled();

    ids = ['c', 'd', 'a'];
    redraw(outlet, true);
    sync();

    expect([...container.querySelectorAll('button')].map(el => el.textContent)).toEqual(ids);
    expect(container.textContent).toBe('BeforecdaAfter');
    expect([...container.querySelectorAll('button')].find(el => el.textContent === 'c'))
      .toBe(buttons.get('c'));
    expect([...container.querySelectorAll('button')].find(el => el.textContent === 'a'))
      .toBe(buttons.get('a'));
    expect(initialized.size).toBe(4);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledWith(initialized.get('b'));

    bind(container, null);
  });

  test('withdraws contributions when their owning components unmount', () => {
    const container = document.createElement('div');
    const contributions = new Map<string, string>();
    const removed = vi.fn();
    let outlet!: ReturnType<typeof comp>;

    const Controls = compDef({
      draw(vNode) {
        return elem('button', vNode.attrs.label);
      }
    });
    const Outlet = compDef({
      init(vNode) {
        outlet = vNode;
      },
      draw() {
        return [...contributions].map(([id, label]) =>
          comp(Controls, { $key: id, label })
        );
      }
    });
    const Owner = compDef({
      init(vNode) {
        contributions.set(vNode.attrs.id, vNode.attrs.id);
        redraw(outlet, true);
      },
      draw(vNode) {
        return elem('span', vNode.attrs.id);
      },
      removed(vNode) {
        contributions.delete(vNode.attrs.id);
        removed(vNode);
        redraw(outlet, true);
      }
    });
    const render = (ids: string[]) => elem('div',
      elem('aside', comp(Outlet)),
      elem('main', ids.map(id => comp(Owner, { $key: id, id })))
    );

    bind(container, render(['brush', 'crop']));
    sync();
    expect([...container.querySelectorAll('aside button')].map(el => el.textContent))
      .toEqual(['brush', 'crop']);
    expect(contributions.size).toBe(2);

    bind(container, render(['crop']));
    sync();
    expect([...container.querySelectorAll('aside button')].map(el => el.textContent))
      .toEqual(['crop']);
    expect(contributions.has('brush')).toBe(false);
    expect(removed).toHaveBeenCalledTimes(1);

    bind(container, render([]));
    sync();
    expect(container.querySelectorAll('aside button')).toHaveLength(0);
    expect(contributions.size).toBe(0);
    expect(removed).toHaveBeenCalledTimes(2);

    bind(container, null);
  });

  test('preserves sibling order and ancestor roots across empty and multi-root transitions', () => {
    const container = document.createElement('div');
    let outlet!: ReturnType<typeof comp>;
    let wrapper!: ReturnType<typeof comp>;
    let content: any = null;

    const Outlet = compDef({
      init(vNode) {
        outlet = vNode;
      },
      draw: () => content
    });
    const Wrapper = compDef({
      init(vNode) {
        wrapper = vNode;
      },
      draw: () => comp(Outlet)
    });

    bind(container, elem('div', elem('i', 'Before'), comp(Wrapper), elem('i', 'After')));
    const parent = container.firstElementChild!;
    const children = () => [...parent.children].map(el => el.textContent);
    expect(children()).toEqual(['Before', 'After']);
    expect(wrapper.el).toBeNull();

    content = [elem('b', 'A'), elem('b', 'B')];
    redraw(outlet, true);
    sync();
    expect(children()).toEqual(['Before', 'A', 'B', 'After']);
    expect(wrapper.el).toBe(parent.children[1]);
    expect(outlet.el).toBe(wrapper.el);

    content = elem('strong', 'Single');
    redraw(outlet, true);
    sync();
    expect(children()).toEqual(['Before', 'Single', 'After']);
    expect(wrapper.el).toBe(parent.children[1]);

    content = null;
    redraw(outlet, true);
    sync();
    expect(children()).toEqual(['Before', 'After']);
    expect(wrapper.el).toBeNull();
    expect(outlet.el).toBeNull();

    bind(container, null);
  });
});
