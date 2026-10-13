/**
 * Additional branch/edge-case coverage for src/index.ts.
 * Uses the same DOM environment as the existing Vitest tests.
 *
 * These are behavioural assertions, not implementation-detail coverage hacks.
 * See coverage.debug.test.ts for development-only validation branches.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, draw, elem, node, sync } from '../src/index';

let app: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app')!;
});

const update = (view: ReturnType<typeof comp>) => {
  draw(view);
  sync();
};
const texts = (parent: Element) => Array.from(parent.children, el => el.textContent);

// 145: focus restoration after the DOM operation changes document.activeElement.
describe('Focus and input events', () => {
  test('restores focus after a redraw steals it', () => {
    const original = document.createElement('input');
    const other = document.createElement('button');
    document.body.append(original, other);
    let stealFocus = false;
    const View = compDef({
      draw: () => elem('span', 'content'),
      drawn: () => { if (stealFocus) other.focus(); },
    });
    const view = comp(View);
    bind(app, view);
    original.focus();
    expect(document.activeElement).toBe(original);

    stealFocus = true;
    update(view);
    expect(document.activeElement).toBe(original);
  });

  // 403, 428, 446: input type ordering, value assignment and removed attrs.
  test('updates input type/value and removes an omitted attribute', () => {
    let value = 'first';
    let kind = 'text';
    let includeTitle = true;
    const View = compDef({
      draw: () => elem('input', {
        type: kind,
        value,
        ...(includeTitle ? { title: 'old-title' } : {}),
      }),
    });
    const view = comp(View);
    bind(app, view);
    const input = app.querySelector('input')!;
    expect(input.type).toBe('text');
    expect(input.value).toBe('first');
    expect(input.title).toBe('old-title');

    kind = 'password';
    value = 'second';
    includeTitle = false;
    update(view);
    expect(app.querySelector('input')).toBe(input);
    expect(input.type).toBe('password');
    expect(input.value).toBe('second');
    expect(input.hasAttribute('title')).toBe(false);
  });

  // 414-419: callback returning false prevents default/propagation and redraws.
  test('an event handler returning false cancels the event and redraws', () => {
    let count = 0;
    const ancestor = vi.fn();
    app.addEventListener('click', ancestor);
    const View = compDef({
      draw: () => elem('button', { onclick: () => { count++; return false; } }, String(count)),
    });
    bind(app, comp(View));
    const button = app.querySelector('button')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    sync();

    expect(event.defaultPrevented).toBe(true);
    expect(ancestor).not.toHaveBeenCalled();
    expect(button.textContent).toBe('1');
  });

  test('e.draw = false suppresses the automatic event redraw', () => {
    let count = 0;
    const View = compDef({
      draw: () => elem('button', { onclick: () => { count++; } }, String(count)),
    });
    const view = comp(View);
    bind(app, view);
    const button = app.querySelector('button')!;
    const event = new MouseEvent('click', { bubbles: true }) as MouseEvent & { draw?: boolean };
    event.draw = false;
    button.dispatchEvent(event);
    sync();
    expect(count).toBe(1);
    expect(button.textContent).toBe('0');

    update(view);
    expect(button.textContent).toBe('1');
  });
});

describe('Flattening and raw DOM nodes', () => {
  // 197-198: mixed primitive and keyed children are invalid.
  test('rejects a string among keyed element children', () => {
    expect(() => elem('div', elem('span', { $key: 'a' }, 'a'), 'unkeyed text'))
      .toThrow(/keys/i);
  });

  // 492-493, 669: native node wrapping. 293-296: identity-preserving replacement.
  test('mounts a supplied DOM element without recreating it', () => {
    const native = document.createElement('strong');
    native.textContent = 'external';
    bind(app, node(native));
    expect(app.firstElementChild).toBe(native);
  });

  test('replaces one native DOM node with another', () => {
    const first = document.createElement('i');
    const second = document.createElement('b');
    first.textContent = 'first';
    second.textContent = 'second';
    let current = first;
    const View = compDef({ draw: () => elem('section', node(current)) });
    const view = comp(View);
    bind(app, view);
    expect(app.querySelector('section')!.firstElementChild).toBe(first);

    current = second;
    update(view);
    const section = app.querySelector('section')!;
    expect(section.childElementCount).toBe(1);
    expect(section.firstElementChild).toBe(second);
    expect(first.isConnected).toBe(false);
  });

  test('keeps the same native DOM node when the wrapper changes', () => {
    const native = document.createElement('em');
    const View = compDef({ draw: () => elem('section', node(native)) });
    const view = comp(View);
    bind(app, view);
    update(view);
    expect(app.querySelector('section')!.firstElementChild).toBe(native);
  });
});

describe('Additional keyed reconciliation branches', () => {
  // 221, 304: the old last keyed component has no DOM root; match is updated.
  test('inserts next to an initially empty keyed component', () => {
    const Empty = compDef({ draw: () => [] });
    let add = false;
    const View = compDef({
      draw: () => elem('section',
        add ? elem('b', { $key: 'new' }, 'new') : null,
        comp(Empty, { $key: 'empty' }),
      ),
    });
    const view = comp(View);
    bind(app, view);
    expect(app.querySelector('section')!.childElementCount).toBe(0);
    add = true;
    update(view);
    expect(texts(app.querySelector('section')!)).toEqual(['new']);
  });

  // 290-291: same key, different component definition.
  test('replaces a keyed component when its definition changes', () => {
    const A = compDef({ draw: () => elem('i', 'A') });
    const B = compDef({ draw: () => elem('b', 'B') });
    let definition = A;
    const View = compDef({ draw: () => elem('section', comp(definition, { $key: 'stable' })) });
    const view = comp(View);
    bind(app, view);
    definition = B;
    update(view);
    expect(app.querySelector('section')!.textContent).toBe('B');
    expect(app.querySelector('section')!.children).toHaveLength(1);
    expect(app.querySelector('section b')).not.toBeNull();
  });

  // 357-358: do not create an already-$remove-marked key with no old match.
  test('does not mount a newly introduced keyed item marked $remove', () => {
    let includeRemoval = false;
    const View = compDef({
      draw: () => elem('section',
        includeRemoval ? elem('i', { $key: 'discard', $remove: true }, 'discard') : null,
        elem('b', { $key: 'keep' }, 'keep'),
      ),
    });
    const view = comp(View);
    bind(app, view);
    includeRemoval = true;
    update(view);
    expect(texts(app.querySelector('section')!)).toEqual(['keep']);
  });

  // 343-348: a component with a synchronous remove() is discarded on $remove.
  test('completes a keyed $remove when remove() is synchronous', () => {
    const removed = vi.fn();
    let reverseAndRemove = false;
    const Leaving = compDef({ draw: () => elem('i', 'leaving'), remove: removed });
    const View = compDef({
      draw: () => elem('section',
        ...(reverseAndRemove
          ? [elem('b', { $key: 'keep' }, 'keep'), comp(Leaving, { $key: 'leave', $remove: true })]
          : [comp(Leaving, { $key: 'leave' }), elem('b', { $key: 'keep' }, 'keep')]),
      ),
    });
    const view = comp(View);
    bind(app, view);
    reverseAndRemove = true;
    update(view);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(texts(app.querySelector('section')!)).toEqual(['keep']);
  });

  // 556: the reconciler must not run remove() a second time while pending.
  test('dropping an already-removing keyed component does not call remove twice', async () => {
    let finish!: () => void;
    const removed = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const Leaving = compDef({ draw: () => elem('i', 'leaving'), remove: removed });
    let mode: 'initial' | 'pending' | 'gone' = 'initial';
    const View = compDef({
      draw: () => elem('section',
        ...(mode === 'initial'
          ? [comp(Leaving, { $key: 'leave' }), elem('b', { $key: 'keep' }, 'keep')]
          : mode === 'pending'
            ? [elem('b', { $key: 'keep' }, 'keep'), comp(Leaving, { $key: 'leave', $remove: true })]
            : [elem('b', { $key: 'keep' }, 'keep')]),
      ),
    });
    const view = comp(View);
    bind(app, view);
    mode = 'pending';
    update(view);
    expect(removed).toHaveBeenCalledTimes(1);

    mode = 'gone';
    update(view);
    expect(removed).toHaveBeenCalledTimes(1);

    finish();
    await Promise.resolve();
    sync();
    expect(texts(app.querySelector('section')!)).toEqual(['keep']);
  });

  // 270, 343-345, 556: a pending removal can be revisited then cancelled.
  test('retains a pending keyed removal, and reuses it if reintroduced', async () => {
    let finish!: () => void;
    const removed = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const Leaving = compDef({ draw: () => elem('i', 'leaving'), remove: removed });
    let mode: 'initial' | 'removing' | 'retry' | 'restored' = 'initial';
    const View = compDef({
      draw: () => elem('section',
        ...(mode === 'initial' || mode === 'restored'
          ? [comp(Leaving, { $key: 'leave' }), elem('b', { $key: 'keep' }, 'keep')]
          : mode === 'removing'
            ? [elem('b', { $key: 'keep' }, 'keep'), comp(Leaving, { $key: 'leave', $remove: true })]
            : [comp(Leaving, { $key: 'leave', $remove: true }), elem('b', { $key: 'keep' }, 'keep')]),
      ),
    });
    const view = comp(View);
    bind(app, view);
    const original = app.querySelector('i')!;

    mode = 'removing';
    update(view);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(app.querySelector('i')).toBe(original);

    // Reverse the order again while the removal is still pending. This
    // exercises the 'already removing' branch without calling remove() twice.
    mode = 'retry';
    update(view);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(app.querySelector('i')).toBe(original);

    // Reintroducing the same key cancels the deferred removal.
    mode = 'restored';
    update(view);
    expect(app.querySelector('i')).toBe(original);
    finish();
    await Promise.resolve();
    sync();
    expect(app.querySelector('i')).toBe(original);
    expect(removed).toHaveBeenCalledTimes(1);
  });
});

describe('Unmount lifecycle cleanup', () => {
  // 521: when an enclosing element is destroyed, descendants receive remove().
  test('calls nested component remove and removed hooks on ancestor replacement', () => {
    const remove = vi.fn();
    const removed = vi.fn();
    const Inner = compDef({ draw: () => elem('i', 'inner'), remove, removed });
    let replace = false;
    const View = compDef({
      draw: () => replace
        ? elem('section', 'replacement')
        : elem('article', comp(Inner)),
    });
    const view = comp(View);
    bind(app, view);
    replace = true;
    update(view);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
  });

  // The current source calls _unmount twice on the element-owned empty path.
  // This is a regression assertion, not a workaround for that implementation.
  test('clearing an element with lifecycle-bearing children unmounts once', () => {
    const remove = vi.fn();
    const removed = vi.fn();
    const Inner = compDef({ draw: () => elem('i', 'inner'), remove, removed });
    let show = true;
    const View = compDef({
      draw: () => elem('section', show ? comp(Inner) : null),
    });
    const view = comp(View);
    bind(app, view);
    show = false;
    expect(() => update(view)).not.toThrow();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(app.querySelector('section')!.childNodes).toHaveLength(0);
  });
});
