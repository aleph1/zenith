import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, diff, draw, elem, sync } from '../src/index';
import { redraw } from './utils'

const SVG = 'http://www.w3.org/2000/svg';
const MATH = 'http://www.w3.org/1998/Math/MathML';
const HTML = 'http://www.w3.org/1999/xhtml';

let app: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app')!;
});

const elementText = (parent: Element) =>
  Array.from(parent.children, el => el.textContent);

const elementTags = (parent: Element) =>
  Array.from(parent.children, el => el.tagName.toLowerCase());

const keyedItems = (keys: string[]) =>
  keys.map(key => elem('li', { $key: key, 'data-key': key }, key));

describe('Regression: keyed reconciliation and DOM order', () => {
  test('prepending a keyed item inserts it before the existing first child', () => {
    let keys = ['a', 'b'];
    const List = compDef({ draw: () => elem('ul', keyedItems(keys)) });
    const view = comp(List);
    bind(app, view);

    const ul = app.querySelector('ul')!;
    const a = ul.children[0];
    const b = ul.children[1];

    keys = ['x', 'a', 'b'];
    redraw(view);

    expect(elementText(ul)).toEqual(['x', 'a', 'b']);
    expect(ul.children[1]).toBe(a);
    expect(ul.children[2]).toBe(b);
  });

  test('rotating a keyed list preserves order and node identity', () => {
    let keys = ['a', 'b', 'c'];
    const List = compDef({ draw: () => elem('ul', keyedItems(keys)) });
    const view = comp(List);
    bind(app, view);

    const ul = app.querySelector('ul')!;
    const original = new Map(Array.from(ul.children, el => [el.textContent, el] as const));

    keys = ['c', 'a', 'b'];
    redraw(view);

    expect(elementText(ul)).toEqual(keys);
    for (const el of ul.children) {
      expect(el).toBe(original.get(el.textContent));
    }
  });

  test('inserting a keyed item in the middle preserves existing DOM nodes', () => {
    let keys = ['a', 'c'];
    const List = compDef({ draw: () => elem('ul', keyedItems(keys)) });
    const view = comp(List);
    bind(app, view);

    const ul = app.querySelector('ul')!;
    const a = ul.children[0];
    const c = ul.children[1];

    keys = ['a', 'b', 'c'];
    redraw(view);

    expect(elementText(ul)).toEqual(keys);
    expect(ul.children[0]).toBe(a);
    expect(ul.children[2]).toBe(c);
  });

  test('changing an unkeyed element tag keeps its sibling position', () => {
    let replaceTag = false;
    const View = compDef({
      draw: () => elem('section',
        elem(replaceTag ? 'strong' : 'div', 'first'),
        elem('b', 'second')
      )
    });
    const view = comp(View);
    bind(app, view);

    replaceTag = true;
    redraw(view);

    const section = app.querySelector('section')!;
    expect(elementTags(section)).toEqual(['strong', 'b']);
    expect(elementText(section)).toEqual(['first', 'second']);
  });

  test('keyed multi-root components move all their roots together', () => {
    let keys = ['a', 'b'];
    const Pair = compDef({
      draw: (vNode: any) => [
        elem('i', `${vNode.attrs.id}1`),
        elem('i', `${vNode.attrs.id}2`),
      ]
    });
    const View = compDef({
      draw: () => elem('section', keys.map(key => comp(Pair, { $key: key, id: key })))
    });
    const view = comp(View);
    bind(app, view);

    keys = ['b', 'a'];
    redraw(view);

    expect(elementText(app.querySelector('section')!)).toEqual(['b1', 'b2', 'a1', 'a2']);
  });
});

describe('Regression: component DOM ownership', () => {
  test('removing a multi-root component removes every DOM root', () => {
    let show = true;
    const Pair = compDef({ draw: () => [elem('i', 'one'), elem('i', 'two')] });
    const View = compDef({
      draw: () => elem('section',
        show ? comp(Pair) : null,
        elem('b', 'keep')
      )
    });
    const view = comp(View);
    bind(app, view);

    show = false;
    redraw(view);

    const section = app.querySelector('section')!;
    expect(elementTags(section)).toEqual(['b']);
    expect(elementText(section)).toEqual(['keep']);
  });

  test('a component becoming empty does not delete an unrelated sibling', () => {
    let show = true;
    const Child = compDef({ draw: () => show ? elem('i', 'child') : [] });
    const child = comp(Child);
    const View = compDef({ draw: () => elem('section', child, elem('b', 'keep')) });
    bind(app, comp(View));

    show = false;
    redraw(child, true);

    const section = app.querySelector('section')!;
    expect(elementTags(section)).toEqual(['b']);
    expect(section.textContent).toBe('keep');
  });

  test('surgical redraw of a nested component inserts siblings into the correct parent', () => {
    let addSecond = false;
    const Inner = compDef({
      draw: () => addSecond
        ? [elem('span', 'first'), elem('b', 'second')]
        : [elem('span', 'first')]
    });
    const Outer = compDef({ draw: () => comp(Inner) });
    const outer = comp(Outer);
    bind(app, outer);

    const inner = outer.nodes[0] as ReturnType<typeof comp>;
    addSecond = true;
    redraw(inner, true);

    expect(elementTags(app)).toEqual(['span', 'b']);
    expect(elementText(app)).toEqual(['first', 'second']);
    expect(app.querySelector('span b')).toBeNull();
  });

  test('calling bind twice replaces the previous bound tree', () => {
    bind(app, elem('p', 'old'));
    bind(app, elem('p', 'new'));

    expect(elementTags(app)).toEqual(['p']);
    expect(app.textContent).toBe('new');
  });
});

describe('Regression: lifecycle and redraw scheduling', () => {
  test('removed hooks still run after an intervening element vnode update', () => {
    let showOuter = true;
    const removed = vi.fn();
    const Inner = compDef({ draw: () => elem('span', 'inner'), removed });
    const Outer = compDef({ draw: () => elem('div', comp(Inner)) });
    const View = compDef({
      draw: () => showOuter ? comp(Outer) : elem('p', 'replacement')
    });
    const view = comp(View);
    bind(app, view);

    const outer = view.nodes[0] as ReturnType<typeof comp>;
    redraw(outer, true); // Replaces an intermediate element vnode.
    showOuter = false;
    redraw(view);

    expect(removed).toHaveBeenCalledTimes(1);
  });

  test('resolving deferred removal does not splice an unrelated sibling', async () => {
    let showLeaving = true;
    let finishRemoval!: () => void;
    const Leaving = compDef({
      draw: () => elem('i', 'leaving'),
      remove: () => new Promise<void>(resolve => { finishRemoval = resolve; })
    });
    const Staying = compDef({ draw: () => elem('b', 'staying') });
    const View = compDef({
      draw: () => showLeaving
        ? [comp(Leaving, { $key: 'leaving' }), comp(Staying, { $key: 'staying' })]
        : [comp(Staying, { $key: 'staying' })]
    });
    const view = comp(View);
    bind(app, view);

    showLeaving = false;
    redraw(view);
    expect(elementText(app)).toContain('staying');

    finishRemoval();
    await Promise.resolve();
    sync();

    expect(view.nodes).toHaveLength(1);
    expect(elementText(app)).toEqual(['staying']);
  });

  test('a redraw requested by drawn() is not lost during the current flush', async () => {
    let version = 0;
    const View = compDef({
      draw: () => elem('span', String(version)),
      drawn: (vNode: any) => {
        if (version === 1) {
          version = 2;
          draw(vNode, true);
        }
      }
    });
    const view = comp(View);
    bind(app, view);

    version = 1;
    draw(view, true);
    await Promise.resolve();
    await Promise.resolve();
    sync();

    expect(app.textContent).toBe('2');
  });

  test('a surgical redraw clears the stale flag of a memoized component', () => {
    const props = { label: 'constant' };
    const renderMemo = vi.fn(() => elem('span', 'memo'));
    const Memo = compDef({ $memo: true, draw: renderMemo });
    const Parent = compDef({ draw: () => comp(Memo, props) });
    const parent = comp(Parent);
    bind(app, parent);

    const memo = parent.nodes[0] as ReturnType<typeof comp>;
    expect(renderMemo).toHaveBeenCalledTimes(1);

    redraw(memo, true);
    expect(renderMemo).toHaveBeenCalledTimes(2);

    redraw(parent); // Same component definition and exact same props object.
    expect(renderMemo).toHaveBeenCalledTimes(2);
  });
});

describe('Regression: diff flags, attributes and namespaces', () => {
  test('diff.self does not lose track of the mounted children', () => {
    let text = 'original';
    let mode = diff.all;
    const View = compDef({
      draw: () => elem('div', { $diff: mode }, elem('span', text))
    });
    const view = comp(View);
    bind(app, view);

    text = 'ignored';
    mode = diff.self;
    redraw(view);
    expect(app.querySelector('div')!.textContent).toBe('original');

    text = 'updated';
    mode = diff.all;
    redraw(view);

    const div = app.querySelector('div')!;
    expect(elementTags(div)).toEqual(['span']);
    expect(div.textContent).toBe('updated');
  });

  test('type is applied to non-input elements', () => {
    bind(app, elem('button', { type: 'button' }, 'Click'));
    expect(app.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  test('an attributes object with an is property is not mistaken for a vnode', () => {
    const vNode = elem('button', { is: 'custom-button', id: 'target' });
    expect(vNode.attrs).toMatchObject({ is: 'custom-button', id: 'target' });
  });

  test('new SVG children inherit the SVG namespace during an update', () => {
    let addRect = false;
    const View = compDef({
      draw: () => elem('svg',
        elem('g',
          elem('circle', { r: 2 }),
          addRect ? elem('rect', { width: 10 }) : null
        )
      )
    });
    const view = comp(View);
    bind(app, view);

    addRect = true;
    redraw(view);

    const svgNS = 'http://www.w3.org/2000/svg';
    expect(app.querySelector('svg')!.namespaceURI).toBe(svgNS);
    expect(app.querySelector('rect')!.namespaceURI).toBe(svgNS);
  });

  test('unbinding cancels pending component redraws', async () => {
    const render = vi.fn(() => elem('span', 'content'));
    const Child = compDef({ draw: render });
    const Parent = compDef({ draw: () => comp(Child) });

    const parent = comp(Parent);
    bind(app, parent);

    const child = parent.nodes[0];

    draw(child, true);
    bind(app, null);

    await Promise.resolve();
    sync();

    expect(render).toHaveBeenCalledTimes(1);
    expect(app.children).toHaveLength(0);
  });
});

describe('Namespace propagation', () => {
  test('new SVG descendants keep the SVG namespace after an update', () => {
    let inserted = false;
    const View = compDef({
      draw: () => elem('svg', elem('g',
        elem('circle', { r: 2 }),
        inserted ? elem('rect', { width: 10 }) : null
      ))
    });
    const view = comp(View);
    bind(app, view);

    inserted = true;
    redraw(view);

    expect(app.querySelector('g')!.namespaceURI).toBe(SVG);
    expect(app.querySelector('rect')!.namespaceURI).toBe(SVG);
  });

  test('replacing an SVG element with another tag retains the SVG namespace', () => {
    let changed = false;
    const View = compDef({
      draw: () => elem('svg', elem('g',
        changed ? elem('rect') : elem('circle')
      ))
    });
    const view = comp(View);
    bind(app, view);

    changed = true;
    redraw(view);

    expect(app.querySelector('rect')!.namespaceURI).toBe(SVG);
  });

  test('new MathML descendants keep the MathML namespace after an update', () => {
    let inserted = false;
    const View = compDef({
      draw: () => elem('math', elem('mrow',
        inserted ? elem('mi', 'x') : null
      ))
    });
    const view = comp(View);
    bind(app, view);

    inserted = true;
    redraw(view);

    expect(app.querySelector('mrow')!.namespaceURI).toBe(MATH);
    expect(app.querySelector('mi')!.namespaceURI).toBe(MATH);
  });

  test('foreignObject supports explicitly namespaced XHTML descendants', () => {
    let inserted = false;
    const View = compDef({
      draw: () => elem('svg',
        elem('foreignObject',
          elem('div', {
            xmlns: 'http://www.w3.org/1999/xhtml'
          },
            elem('span', 'first'),
            inserted ? elem('strong', 'second') : null
          )
        )
      )
    });
    const view = comp(View);
    bind(app, view);

    const foreignObject = app.querySelector('foreignObject')!;
    expect(foreignObject.namespaceURI).toBe(SVG);
    expect(foreignObject.querySelector('div')!.namespaceURI).toBe(HTML);
    expect(foreignObject.querySelector('span')!.namespaceURI).toBe(HTML);

    inserted = true;
    redraw(view);
    expect(foreignObject.querySelector('strong')!.namespaceURI).toBe(HTML);
  });

  test('nested SVG inside foreignObject returns to SVG namespace', () => {
    let inserted = false;
    const View = compDef({
      draw: () => elem('svg', elem('foreignObject', elem('div',
        elem('svg', elem('g',
          inserted ? elem('circle') : null
        ))
      )))
    });
    const view = comp(View);
    bind(app, view);

    inserted = true;
    redraw(view);

    const inner = app.querySelector('foreignObject svg')!;
    expect(inner.namespaceURI).toBe(SVG);
    expect(inner.querySelector('circle')!.namespaceURI).toBe(SVG);
  });
});

describe('Reconciliation and diff flags', () => {
  test('keyed insert, remove and reorder in one update preserves surviving DOM nodes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let keys = ['a', 'b', 'c', 'd'];
    const View = compDef({ draw: () => elem('ul', keys.map(k => elem('li', { $key: k }, k))) });
    const view = comp(View);
    bind(app, view);
    const ul = app.querySelector('ul')!;
    const original = new Map(Array.from(ul.children, el => [el.textContent!, el]));
    keys = ['d', 'x', 'b', 'a'];
    redraw(view);
    expect(elementText(ul)).toEqual(keys);
    for (const key of ['a', 'b', 'd']) {
      expect(Array.from(ul.children).find(el => el.textContent === key)).toBe(original.get(key));
    }
    expect(original.get('c')?.isConnected).toBe(false);
  });

  test('repeated keyed transitions preserve order and surviving identity', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let keys = ['a', 'b'];
    const View = compDef({ draw: () => elem('ul', keys.map(k => elem('li', { $key: k }, k))) });
    const view = comp(View);
    bind(app, view);
    const ul = app.querySelector('ul')!;
    const a = ul.children[0];
    const transitions = [['b', 'a'], ['a', 'c', 'b'], ['c', 'a'], [], ['a', 'z']];
    transitions.forEach((next, index) => {
      keys = next;
      redraw(view);
      expect(elementText(ul)).toEqual(next);
      if (index < 3) {
        expect(Array.from(ul.children).find(el => el.textContent === 'a')).toBe(a);
      }
      if (index === 3) expect(a.isConnected).toBe(false);
    });
    // Identity is only guaranteed while a key survives, not across removal.
    expect(a.isConnected).toBe(false);
  });

  test('$diff: self updates attrs but preserves existing children', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let mode = diff.all;
    let title = 'a';
    let content = 'old';
    const View = compDef({ draw: () => elem('div', { $diff: mode, title }, elem('b', content)) });
    const view = comp(View);
    bind(app, view);
    const child = app.querySelector('b')!;
    mode = diff.self; title = 'b'; content = 'new';
    redraw(view);
    expect(app.querySelector('div')!.title).toBe('b');
    expect(app.querySelector('b')).toBe(child);
    expect(child.textContent).toBe('old');
  });

  test('$diff: nodes updates children but preserves attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let mode = diff.all;
    let title = 'a';
    let content = 'old';
    const View = compDef({ draw: () => elem('div', { $diff: mode, title }, elem('b', content)) });
    const view = comp(View);
    bind(app, view);
    mode = diff.nodes; title = 'b'; content = 'new';
    redraw(view);
    expect(app.querySelector('div')!.title).toBe('a');
    expect(app.querySelector('b')!.textContent).toBe('new');
  });

  test('$diff: none preserves attrs and children, then all resumes updates', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let mode = diff.all;
    let title = 'a';
    let content = 'old';
    const View = compDef({ draw: () => elem('div', { $diff: mode, title }, elem('b', content)) });
    const view = comp(View);
    bind(app, view);
    mode = diff.none; title = 'b'; content = 'new';
    redraw(view);
    expect(app.querySelector('div')!.title).toBe('a');
    expect(app.querySelector('b')!.textContent).toBe('old');
    mode = diff.all; title = 'c'; content = 'latest';
    redraw(view);
    expect(app.querySelector('div')!.title).toBe('c');
    expect(app.querySelector('b')!.textContent).toBe('latest');
  });
});

describe('Scheduling and lifecycle', () => {
  test('multiple queued draw calls coalesce into a single render', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let count = 0;
    const render = vi.fn(() => elem('span', String(count)));
    const View = compDef({ draw: render });
    const view = comp(View);
    bind(app, view);
    count = 1;
    draw(view);
    draw(view);
    draw(view);
    sync();
    expect(render).toHaveBeenCalledTimes(2); // initial + one update
    expect(app.textContent).toBe('1');
  });

  test('mount and synchronous removal invoke lifecycle hooks in order', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const calls: string[] = [];
    const Child = compDef({
      init: () => { calls.push('init'); },
      draw: () => { calls.push('draw'); return elem('span', 'child'); },
      drawn: (_node: any, first: boolean) => { calls.push(first ? 'drawn:first' : 'drawn:update'); },
      remove: () => { calls.push('remove'); },
      removed: () => { calls.push('removed'); },
    });
    let show = true;
    const View = compDef({ draw: () => elem('div', show ? comp(Child) : elem('i', 'gone')) });
    const view = comp(View);
    bind(app, view);
    expect(calls).toEqual(['init', 'draw', 'drawn:first']);
    show = false;
    redraw(view);
    expect(calls).toEqual(['init', 'draw', 'drawn:first', 'remove', 'removed']);
  });

  test('redrawing an existing component invokes draw before drawn(false)', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const calls: string[] = [];
    const View = compDef({
      draw: () => { calls.push('draw'); return elem('span', 'value'); },
      drawn: (_node: any, first: boolean) => { calls.push(first ? 'first' : 'updated'); },
    });
    const view = comp(View);
    bind(app, view);
    redraw(view);
    expect(calls).toEqual(['draw', 'first', 'draw', 'updated']);
  });

  test('Deferred removal resolves after parent is removed', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');

    let resolveRemoval!: () => void;
    let showChild = true;
    let showParent = true;

    const remove = vi.fn(() => new Promise<void>(resolve => {
      resolveRemoval = resolve;
    }));
    const removed = vi.fn();

    const Child = compDef({
      draw: () => elem('span', 'child'),
      remove,
      removed,
    });

    const Parent = compDef({
      draw: () => elem('div',
        ...(showChild
          ? [comp(Child, { $key: 'child' }), elem('b', { $key: 'keep' }, 'keep')]
          : [elem('b', { $key: 'keep' }, 'keep')])
      ),
    });

    const Root = compDef({
      draw: () => showParent
        ? comp(Parent)
        : elem('p', 'replacement'),
    });

    const root = comp(Root);
    bind(app, root);

    const parent = root.nodes[0] as ReturnType<typeof comp>;

    // Begin deferred removal.
    showChild = false;
    redraw(parent, true);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(app.querySelector('span')).not.toBeNull();

    // Remove the parent before the Promise resolves.
    showParent = false;
    redraw(root);

    expect(app.querySelector('div')).toBeNull();
    expect(app.querySelector('p')?.textContent).toBe('replacement');

    // Complete the deferred removal.
    resolveRemoval();
    await Promise.resolve();
    sync();

    // The replacement must remain unaffected.
    expect(app.querySelector('p')?.textContent).toBe('replacement');
    expect(app.querySelector('span')).toBeNull();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
  });
});


describe('Focus preservation', () => {
  test('redrawing an input preserves focus and selection', () => {
    let label = 'Before';

    const View = compDef({
      draw: () => elem('div',
        elem('input', { value: 'Hello world' }),
        elem('span', label)
      )
    });

    const view = comp(View);
    bind(app, view);

    const input = app.querySelector('input')!;
    input.focus();
    input.setSelectionRange(3, 7);

    label = 'After';
    redraw(view);

    expect(app.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
  });

  test('reordering keyed siblings preserves input focus', () => {
    let reversed = false;

    const View = compDef({
      draw: () => elem('div',
        (reversed ? ['b', 'a'] : ['a', 'b']).map(key =>
          elem('input', { $key: key, value: key })
        )
      )
    });

    const view = comp(View);
    bind(app, view);

    const input = app.querySelectorAll('input')[0];
    input.focus();

    reversed = true;
    redraw(view);

    expect(app.querySelectorAll('input')[1]).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  test('parent redraw preserves focus inside nested component', () => {
    const Child = compDef({
      draw: () => elem('input', { value: 'Hello world' })
    });

    const Parent = compDef({
      draw: () => elem('section', comp(Child))
    });

    const parent = comp(Parent);
    bind(app, parent);

    const input = app.querySelector('input')!;
    input.focus();
    input.setSelectionRange(2, 5);

    redraw(parent);

    expect(app.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(5);
  });

  test('drawn hook can intentionally move focus', () => {
    let moveFocus = false;

    const View = compDef({
      draw: () => elem('div',
        elem('input', { id: 'first' }),
        elem('input', { id: 'second' })
      ),
      drawn: () => {
        if (moveFocus) {
          app.querySelector<HTMLInputElement>('#second')!.focus();
        }
      }
    });

    const view = comp(View);
    bind(app, view);

    const first = app.querySelector<HTMLInputElement>('#first')!;
    const second = app.querySelector<HTMLInputElement>('#second')!;

    first.focus();
    expect(document.activeElement).toBe(first);

    moveFocus = true;
    redraw(view);

    expect(document.activeElement).toBe(second);
  });

  test('drawn hook can focus an external element', () => {
    const original = document.createElement('input');
    const other = document.createElement('button');
    document.body.append(original, other);

    let moveFocus = false;

    const View = compDef({
      draw: () => elem('span', 'content'),
      drawn: () => {
        if (moveFocus) other.focus();
      }
    });

    const view = comp(View);
    bind(app, view);

    original.focus();
    expect(document.activeElement).toBe(original);

    moveFocus = true;
    redraw(view);

    expect(document.activeElement).toBe(other);
  });

  test('replacing a focused input does not restore focus to the removed element', () => {
    let replace = false;

    const View = compDef({
      draw: () => elem('div',
        replace
          ? elem('textarea')
          : elem('input')
      )
    });

    const view = comp(View);
    bind(app, view);

    const input = app.querySelector('input')!;
    input.focus();

    replace = true;
    redraw(view);

    expect(input.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(input);
  });

  test('changing input value does not affect focus', () => {
    let value = 'Hello world';

    const View = compDef({
      draw: () => elem('input', { value })
    });

    const view = comp(View);
    bind(app, view);

    const input = app.querySelector('input')!;
    input.focus();

    value = 'Hello world!';
    redraw(view);

    expect(app.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Hello world!');
  });

  test('reordering a focused input preserves selection', () => {
    let reversed = false;

    const View = compDef({
      draw: () => elem('div',
        (reversed ? ['b', 'a'] : ['a', 'b']).map(key =>
          elem('input', {
            $key: key,
            value: 'Hello world'
          })
        )
      )
    });

    const view = comp(View);
    bind(app, view);

    const input = app.querySelectorAll('input')[0];
    input.focus();
    input.setSelectionRange(3, 7);

    reversed = true;
    redraw(view);

    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
  });
});

describe('Regression: built-in portals', () => {
    let app: HTMLDivElement;
    const targets: HTMLElement[] = [];

    const createTarget = () => {
        const target = document.createElement('div');
        document.body.append(target);
        targets.push(target);
        return target;
    };

    beforeEach(() => {
        app = document.createElement('div');
        document.body.append(app);
    });

    afterEach(() => {
        bind(app, null);
        app.remove();
        for (const target of targets) target.remove();
        targets.length = 0;
    });

    test('renders synchronously into its target and leaves a placeholder', () => {
        const target = createTarget();
        const Portal = compDef({ draw: () => elem('span', 'Portal content') });

        bind(app, elem('main', comp(Portal, { to: target })));

        const main = app.querySelector('main');
        expect(main?.childNodes).toHaveLength(1);
        expect(main?.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
        expect(app.querySelector('span')).toBeNull();
        expect(target.textContent).toBe('Portal content');
        expect(target.children).toHaveLength(1); // No wrapper element

        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('updating portal content preserves DOM identity', () => {
        const target = createTarget();
        let value = 'Before';
        const init = vi.fn();
        const Content = compDef({ init, draw: (vnode) => elem('span', vnode.attrs.value) });
        const Portal = compDef({ draw: (vnode) => comp(Content, { value: vnode.attrs.value }) });
        const Parent = compDef({ draw: () => comp(Portal, { to: target, value }) });
        const parent = comp(Parent);

        bind(app, parent);
        const original = target.querySelector('span');
        expect(init).toHaveBeenCalledTimes(1);
        value = 'After';
        redraw(parent);
        expect(target.textContent).toBe('After');
        expect(target.querySelector('span')).toBe(original);
        expect(init).toHaveBeenCalledTimes(1);
    });

    test('removing a portal nested inside an element cleans up DOM and lifecycle', () => {
        const target = createTarget();
        let visible = true;
        const removed = vi.fn();
        const Content = compDef({ draw: () => elem('span', 'Nested'), removed });
        const Portal = compDef({ draw: () => comp(Content) });
        const Parent = compDef({
            draw: () => elem('div', visible ? comp(Portal, { to: target }) : null)
        });
        const parent = comp(Parent);
        bind(app, parent);
        expect(target.textContent).toBe('Nested');

        visible = false;
        redraw(parent);
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
        bind(app, null);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('removing an ancestor DOM element also cleans up nested portals', () => {
        const target = createTarget();
        let visible = true;
        const removed = vi.fn();
        const Content = compDef({ draw: () => elem('span', 'Nested'), removed });
        const Portal = compDef({ draw: () => comp(Content) });
        const Parent = compDef({
            draw: () => visible
                ? elem('section', elem('div', comp(Portal, { to: target })))
                : elem('p', 'Replacement')
        });
        const parent = comp(Parent);
        bind(app, parent);
        visible = false;
        redraw(parent);
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('unbinding a portal with pending deferred removal destroys it immediately', async () => {
        const target = createTarget();
        let removing = false;
        let resolveRemoval!: () => void;
        const remove = vi.fn(() => new Promise<void>(resolve => { resolveRemoval = resolve; }));
        const removed = vi.fn();
        const Content = compDef({ draw: () => elem('span', 'Deferred'), remove, removed });
        const Portal = compDef({
            draw: () => comp(Content, { $key: 'content', $remove: removing })
        });
        const Parent = compDef({ draw: () => comp(Portal, { to: target }) });
        const parent = comp(Parent);
        bind(app, parent);

        removing = true;
        redraw(parent);
        expect(remove).toHaveBeenCalledTimes(1);
        expect(target.textContent).toBe('Deferred');
        expect(removed).not.toHaveBeenCalled();

        bind(app, null);
        expect(app.childNodes).toHaveLength(0);
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);

        resolveRemoval();
        await Promise.resolve();
        sync();
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('multiple portals can coexist in one target', () => {
        const target = createTarget();
        const Portal = compDef({ draw: (vnode) => elem('span', vnode.attrs.label) });
        bind(app, elem('main',
            comp(Portal, { to: target, label: 'A' }),
            comp(Portal, { to: target, label: 'B' })
        ));
        const labels = Array.from(target.querySelectorAll('span'), el => el.textContent);
        expect(labels).toHaveLength(2);
        expect(labels).toContain('A');
        expect(labels).toContain('B');
        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('removing one portal leaves another portal in the same target untouched', () => {
        const target = createTarget();
        let showFirst = true;
        const First = compDef({ draw: () => elem('span', { id: 'first' }, 'first') });
        const Second = compDef({ draw: () => elem('span', { id: 'second' }, 'second') });
        const View = compDef({
            draw: () => elem('section',
                showFirst ? comp(First, { to: target }) : elem('em', 'gone'),
                comp(Second, { to: target })
            )
        });
        const view = comp(View);
        bind(app, view);
        const originalSecond = target.querySelector('#second');
        showFirst = false;
        redraw(view);
        expect(target.querySelector('#first')).toBeNull();
        expect(target.querySelector('#second')).toBe(originalSecond);
        expect(target.querySelector('#second')?.textContent).toBe('second');
        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('changing portal targets moves existing DOM without reinitializing', () => {
        const targetA = createTarget();
        const targetB = createTarget();
        let target: Element = targetA;
        const init = vi.fn();
        const removed = vi.fn();
        const Content = compDef({ init, draw: () => elem('span', 'Content'), removed });
        const Portal = compDef({ draw: () => comp(Content) });
        const Parent = compDef({ draw: () => comp(Portal, { to: target }) });
        const parent = comp(Parent);
        bind(app, parent);
        const original = targetA.querySelector('span');
        const placeholder = app.firstChild;

        target = targetB;
        redraw(parent);
        expect(targetA.childNodes).toHaveLength(0);
        expect(targetB.querySelector('span')).toBe(original);
        expect(app.firstChild).toBe(placeholder);
        expect(init).toHaveBeenCalledTimes(1);
        expect(removed).not.toHaveBeenCalled();

        bind(app, null);
        expect(targetB.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('switching from an ordinary component to a portal preserves its DOM', () => {
        const target = createTarget();
        let to: Element | undefined;
        const init = vi.fn();
        const Content = compDef({ init, draw: () => [elem('span', 'A'), elem('span', 'B')] });
        const Parent = compDef({ draw: () => elem('main', comp(Content, { to })) });
        const parent = comp(Parent);
        bind(app, parent);
        const originals = Array.from(app.querySelectorAll('span'));

        to = target;
        redraw(parent);
        expect(app.querySelector('main')?.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
        expect(target.querySelectorAll('span')).toHaveLength(2);
        expect(Array.from(target.querySelectorAll('span'))).toEqual(originals);
        expect(init).toHaveBeenCalledTimes(1);
    });

    test('switching from a portal back to an ordinary component preserves its DOM', () => {
        const target = createTarget();
        let to: Element | undefined = target;
        const init = vi.fn();
        const Content = compDef({ init, draw: () => [elem('span', 'A'), elem('span', 'B')] });
        const Parent = compDef({ draw: () => elem('main', comp(Content, { to })) });
        const parent = comp(Parent);
        bind(app, parent);
        const originals = Array.from(target.querySelectorAll('span'));

        to = undefined;
        redraw(parent);
        expect(target.childNodes).toHaveLength(0);
        expect(Array.from(app.querySelectorAll('span'))).toEqual(originals);
        expect(app.querySelector('main')?.childNodes).toHaveLength(2);
        expect(init).toHaveBeenCalledTimes(1);
    });

    test('rejects an invalid portal target when updating', () => {
      const target = document.createElement('div');
      document.body.append(target);

      let currentTarget: Element = target;

      const Child = compDef({
          draw: () => elem('span', 'Portal content')
      });

      const Parent = compDef({
          draw: () => comp(Child, { to: currentTarget })
      });

      const parent = comp(Parent);
      bind(app, parent);

      currentTarget = {} as Element;

      expect(() => redraw(parent)).toThrow(
          /For components that act as portals/
      );

      target.remove();
  });

  test('changing portal target and children in the same redraw', () => {
      const targetA = document.createElement('div');
      const targetB = document.createElement('div');
      document.body.append(targetA, targetB);

      let target = targetA;
      let items = ['a', 'b'];

      const init = vi.fn();
      const removed = vi.fn();

      const Item = compDef({
          init,
          draw(vnode) {
              return elem('span', { id: vnode.attrs.id }, vnode.attrs.id);
          },
          removed
      });

      const Portal = compDef({
          draw: () => items.map(id =>
              comp(Item, { $key: id, id })
          )
      });

      const Parent = compDef({
          draw: () => comp(Portal, { to: target })
      });

      const parent = comp(Parent);
      bind(app, parent);

      const originalB = targetA.querySelector('#b');

      expect(targetA.textContent).toBe('ab');
      expect(init).toHaveBeenCalledTimes(2);

      // Move the portal, remove a, preserve b, and add c.
      target = targetB;
      items = ['b', 'c'];
      redraw(parent);

      expect(targetA.childNodes).toHaveLength(0);
      expect(targetB.textContent).toBe('bc');

      expect(targetB.querySelector('#b')).toBe(originalB);
      expect(targetB.querySelector('#a')).toBeNull();
      expect(targetB.querySelector('#c')).not.toBeNull();

      expect(init).toHaveBeenCalledTimes(3);
      expect(removed).toHaveBeenCalledTimes(1);

      bind(app, null);

      expect(targetB.childNodes).toHaveLength(0);
      expect(removed).toHaveBeenCalledTimes(3);

      targetA.remove();
      targetB.remove();
  });

});