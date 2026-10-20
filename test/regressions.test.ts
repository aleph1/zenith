import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, diff, elem, node, redraw, sync } from '../src/index';

const SVG = 'http://www.w3.org/2000/svg';
const MATH = 'http://www.w3.org/1998/Math/MathML';
const HTML = 'http://www.w3.org/1999/xhtml';

const ns = {
  svg: SVG,
  math: MATH,
};

let app: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app')!;
});

afterEach(() => {
  bind(app, null);
})

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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
    showOuter = false;
    redraw(view);
    sync();
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
    sync();
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
          redraw(vNode, true);
        }
      }
    });
    const view = comp(View);
    bind(app, view);

    version = 1;
    redraw(view, true);
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
    sync();
    expect(renderMemo).toHaveBeenCalledTimes(2);
    redraw(parent); // Same component definition and exact same props object.
    sync();
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
    sync();
    expect(app.querySelector('div')!.textContent).toBe('original');
    text = 'updated';
    mode = diff.all;
    redraw(view);
    sync();
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
    sync();
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

    redraw(child, true);
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
      sync();
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
    sync();
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
    sync();
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
    sync();
    expect(app.querySelector('div')!.title).toBe('a');
    expect(app.querySelector('b')!.textContent).toBe('old');
    mode = diff.all; title = 'c'; content = 'latest';
    redraw(view);
    sync();
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
    redraw(view);
    redraw(view);
    redraw(view);
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
    sync();
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
    sync();
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
    sync();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(app.querySelector('span')).not.toBeNull();

    // Remove the parent before the Promise resolves.
    showParent = false;
    redraw(root);
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
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
    sync();
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
  });
});

describe('bound root container', () => {
  let tbody: HTMLTableSectionElement;

  beforeEach(() => {
    tbody = document.createElement('tbody');
  });

  afterEach(() => {
    bind(tbody, null);
  });

  test('preserves the binding container across nested keyed redraws', () => {
    let ids: number[] = [];

    const Row = compDef({
      draw: vnode => elem('tr',
        elem('td', vnode.attrs.id)
      )
    });

    const Rows = compDef({
      draw: () => ids.map(id =>
        comp(Row, { $key: id, id })
      )
    });

    const root = bind(tbody, comp(Rows));

    const update = (next: number[]) => {
      ids = next;
      redraw(root);
      sync();
    };

    const rendered = () =>
      Array.from(tbody.querySelectorAll('td'),
        td => td.textContent
      );

    expect(root.el).toBe(tbody);

    // Empty component gains multiple roots.
    update([1, 2, 3]);
    expect(rendered()).toEqual(['1', '2', '3']);
    expect(root.el).toBe(tbody);

    // Keyed reordering.
    update([1, 3, 2]);
    expect(rendered()).toEqual(['1', '3', '2']);
    expect(root.el).toBe(tbody);

    // All roots disappear.
    update([]);
    expect(rendered()).toEqual([]);
    expect(root.el).toBe(tbody);

    // New roots appear again.
    update([4, 5, 6]);
    expect(rendered()).toEqual(['4', '5', '6']);
    expect(root.el).toBe(tbody);
  });
});

// A keyed component remains in its parent's vnode list while $remove is true,
// allowing a subsequent update to revive the same component instance.
describe('async removal revival', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    bind(container, null);
    container.remove();
  });

  const deferred = () => {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    return { promise, resolve, reject };
  };

  const setup = () => {
    let phase: 'active' | 'removing' | 'hidden' = 'active';
    let removeCalls = 0;
    let removedCalls = 0;
    let initCalls = 0;
    let itemVNode: ReturnType<typeof comp> | undefined;
    const pending: ReturnType<typeof deferred>[] = [];

    const Item = compDef({
      init(vNode) {
        initCalls++;
        itemVNode = vNode;
      },
      draw: () => elem('span', 'Item'),
      remove() {
        removeCalls++;
        const attempt = deferred();
        pending.push(attempt);
        return attempt.promise;
      },
      removed() { removedCalls++; }
    });

    const Parent = compDef({
      draw: () => phase === 'hidden'
        ? []
        : [comp(Item, { $key: 'item', $remove: phase === 'removing' })]
    });

    const root = bind(container, comp(Parent));
    const update = (next: typeof phase) => {
      phase = next;
      redraw(root);
      sync();
    };

    return {
      update,
      setPhase(next: typeof phase) { phase = next; },
      pending,
      get itemVNode() { return itemVNode!; },
      get removeCalls() { return removeCalls; },
      get removedCalls() { return removedCalls; },
      get initCalls() { return initCalls; }
    };
  };

  test('an obsolete resolution cannot destroy a newer pending removal', async () => {
    const state = setup();
    const element = container.querySelector('span');

    state.update('removing'); // A
    const tokenA = state.itemVNode.$r;
    expect(tokenA).toBeTruthy();

    state.update('active'); // Revive
    expect(state.itemVNode.$r).toBeNull();

    state.update('removing'); // B
    const tokenB = state.itemVNode.$r;
    expect(tokenB).toBeTruthy();
    expect(tokenB).not.toBe(tokenA);
    expect(state.removeCalls).toBe(2);
    expect(state.initCalls).toBe(1);

    state.pending[0].resolve(); // A finishes first
    await Promise.resolve();
    sync();

    expect(container.querySelector('span')).toBe(element);
    expect(state.removedCalls).toBe(0);
    expect(state.itemVNode.$r).toBe(tokenB);

    state.setPhase('hidden');
    state.pending[1].resolve(); // B finishes
    await Promise.resolve();
    sync();

    expect(container.querySelector('span')).toBeNull();
    expect(state.removedCalls).toBe(1);
    expect(state.itemVNode.$r).toBeNull();
  });

  test('a newer removal completes once even if the older promise settles last', async () => {
    const state = setup();
    state.update('removing'); // A
    state.update('active');
    state.update('removing'); // B

    state.setPhase('hidden');
    state.pending[1].resolve(); // B finishes first
    await Promise.resolve();
    sync();

    expect(container.querySelector('span')).toBeNull();
    expect(state.removedCalls).toBe(1);
    expect(state.itemVNode.$r).toBeNull();

    state.pending[0].resolve(); // A finishes late
    await Promise.resolve();
    sync();

    expect(container.querySelector('span')).toBeNull();
    expect(state.removedCalls).toBe(1);
    expect(state.removeCalls).toBe(2);
  });

  test('revival invalidates a pending removal even when its promise rejects', async () => {
    const state = setup();
    const element = container.querySelector('span');

    state.update('removing');
    expect(state.itemVNode.$r).toBeTruthy();

    state.update('active'); // Revive without starting removal B
    expect(state.itemVNode.$r).toBeNull();

    state.pending[0].reject(new Error('cancelled'));
    await Promise.resolve();
    sync();

    expect(container.querySelector('span')).toBe(element);
    expect(state.removedCalls).toBe(0);
    expect(state.removeCalls).toBe(1);
    expect(state.initCalls).toBe(1);
    expect(state.itemVNode.$r).toBeNull();
  });

  test('repeated $remove updates start only one pending removal', async () => {
    const state = setup();
    state.update('removing');
    const token = state.itemVNode.$r;
    state.update('removing');
    state.update('removing');

    expect(state.removeCalls).toBe(1);
    expect(state.itemVNode.$r).toBe(token);
    expect(container.querySelector('span')).not.toBeNull();

    state.setPhase('hidden');
    state.pending[0].resolve();
    await Promise.resolve();
    sync();

    expect(state.removedCalls).toBe(1);
    expect(state.itemVNode.$r).toBeNull();
    expect(container.querySelector('span')).toBeNull();
  });

  test('unbind destroys immediately and ignores late promise settlement', async () => {
    const state = setup();
    state.update('removing');
    bind(container, null);

    expect(state.removedCalls).toBe(1);
    expect(container.querySelector('span')).toBeNull();

    state.pending[0].resolve();
    await Promise.resolve();
    sync();

    expect(state.removedCalls).toBe(1);
    expect(container.querySelector('span')).toBeNull();
  });
});

// Regression tests for namespace transitions, stale redraws, and child normalization.
// Uses only public APIs; no special vnode or namespace bookkeeping is required.
describe('namespace and lifecycle regressions', () => {

  test('surgical replacement retains SVG namespace under an SVG vnode', () => {
    let child!: ReturnType<typeof comp>;
    let tag = 'circle';
    const Shape = compDef({
      init: vNode => { child = vNode; },
      draw: () => { return elem(tag); }
    });

    bind(app, elem('svg', comp(Shape)));
    expect(app.querySelector('circle')?.namespaceURI).toBe(ns.svg);

    tag = 'rect';
    redraw(child, true);
    sync();

    const rect = app.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect?.namespaceURI).toBe(ns.svg);
  });

  test('binding directly to an existing SVG container uses its namespace', () => {
    const svg = document.createElementNS(ns.svg, 'svg');
    app.appendChild(svg);
    let child!: ReturnType<typeof comp>;
    let tag = 'circle';
    const Shape = compDef({
      init: vNode => { child = vNode; },
      draw: () => { return elem(tag); }
    });

    bind(svg, comp(Shape));
    expect(svg.firstElementChild?.namespaceURI).toBe(ns.svg);

    tag = 'rect';
    redraw(child, true);
    sync();
    expect(svg.firstElementChild?.localName).toBe('rect');
    expect(svg.firstElementChild?.namespaceURI).toBe(ns.svg);

    bind(svg, null);
  });

  test('SVG foreignObject children are HTML on creation and after reconciliation', () => {
    const view = (tag: string) => elem('svg',
      elem('foreignObject', elem(tag, 'Content'))
    );

    bind(app, view('div'));
    expect(app.querySelector('foreignObject')?.namespaceURI).toBe(ns.svg);
    expect(app.querySelector('foreignObject')?.firstElementChild?.namespaceURI)
      .toBe('http://www.w3.org/1999/xhtml');

    bind(app, view('section'));
    expect(app.querySelector('foreignObject')?.firstElementChild?.localName).toBe('section');
    expect(app.querySelector('foreignObject')?.firstElementChild?.namespaceURI)
      .toBe('http://www.w3.org/1999/xhtml');
  });

  test('surgical redraw inside foreignObject creates HTML, including nested SVG', () => {
    let child!: ReturnType<typeof comp>;
    let nested = false;
    const Content = compDef({
      init: vNode => { child = vNode; },
      draw: () => {
        return nested
          ? elem('div', elem('svg', elem('circle')))
          : elem('span', 'Before');
      }
    });

    bind(app, elem('svg', elem('foreignObject', comp(Content))));
    nested = true;
    redraw(child, true);
    sync();

    const div = app.querySelector('foreignObject')?.firstElementChild;
    expect(div?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(div?.querySelector('svg')?.namespaceURI).toBe(ns.svg);
    expect(div?.querySelector('circle')?.namespaceURI).toBe(ns.svg);
  });

  test('surgical redraw inside MathML retains MathML namespace', () => {
    let child!: ReturnType<typeof comp>;
    let tag = 'mi';
    const Token = compDef({
      init: vNode => { child = vNode; },
      draw: () => { return elem(tag, 'x'); }
    });

    bind(app, elem('math', comp(Token)));
    expect(app.querySelector('mi')?.namespaceURI).toBe(ns.math);

    tag = 'mn';
    redraw(child, true);
    sync();
    expect(app.querySelector('mn')?.namespaceURI).toBe(ns.math);
  });

  test('removed components ignore normal and surgical redraw requests', () => {
    let child!: ReturnType<typeof comp>;
    const render = vi.fn(() => elem('span', 'Child'));
    const Child = compDef({
      init(vNode) { child = vNode; },
      draw: render
    });

    bind(app, elem('div', comp(Child)));
    expect(render).toHaveBeenCalledTimes(1);
    bind(app, elem('div'));
    expect(app.textContent).toBe('');

    redraw(child);
    redraw(child, true);
    sync();
    expect(render).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('');
  });

  test('unbound roots ignore normal redraw requests', () => {
    const render = vi.fn(() => elem('b', 'Hello'));
    const root = bind(app, comp(compDef({ draw: render })));
    expect(render).toHaveBeenCalledTimes(1);

    bind(app, null);
    redraw(root);
    sync();
    expect(render).toHaveBeenCalledTimes(1);
    expect(app.childNodes).toHaveLength(0);
  });

  test('component strings are one text node, including after a redraw', () => {
    let child!: ReturnType<typeof comp>;
    let content = 'Hello';
    const Text = compDef({
      init: vNode => { child = vNode; },
      // The component API may type draw() as vnodes-only; this checks the
      // runtime's existing support for primitive children and returns.
      draw: () => content as any
    });

    bind(app, comp(Text));
    expect(app.textContent).toBe('Hello');
    expect(app.childNodes).toHaveLength(1);
    expect(app.firstChild?.nodeType).toBe(Node.TEXT_NODE);

    content = 'World!';
    redraw(child, true);
    sync();
    expect(app.textContent).toBe('World!');
    expect(app.childNodes).toHaveLength(1);
  });

  test('skipping child diff still permits a targeted update with correct sibling order', () => {
    let child!: ReturnType<typeof comp>;
    let visible = false;
    const Dynamic = compDef({
      init: (vNode) => { child = vNode; },
      draw: () => { return visible ? [elem('i', 'A'), elem('i', 'B')] : []; }
    });
    const view = () => elem('div', { $diff: diff.none },
      elem('span', 'Before'), comp(Dynamic), elem('span', 'After'));

    bind(app, view());
    bind(app, view());
    visible = true;
    redraw(child, true);
    sync();
    expect(Array.from(app.firstElementChild!.children, el => el.textContent))
      .toEqual(['Before', 'A', 'B', 'After']);
  });

  test('multiple bound apps can be updated and unbound independently', () => {
    const other = document.createElement('div');
    document.body.appendChild(other);
    try {
      bind(app, elem('span', 'A'));
      bind(other, elem('span', 'B'));
      bind(app, null);
      expect(app.textContent).toBe('');
      expect(other.textContent).toBe('B');
      bind(other, elem('span', 'C'));
      expect(other.textContent).toBe('C');
    } finally {
      bind(other, null);
      other.remove();
    }
  });
});

describe('drawn() attachment and lifecycle', () => {

  test('the child is connected and measurable before its initial drawn()', () => {
    let connected = false;
    let measured = false;
    const Child = compDef({
      draw: () => elem('span', { style: { display: 'block', width: '123px' } }, 'Child'),
      drawn(vNode, first) {
        expect(first).toBe(true);
        connected = vNode.el!.isConnected;
        measured = Number.isFinite((vNode.el as HTMLElement).getBoundingClientRect().width);
      }
    });

    bind(app, elem('div', comp(Child)));
    expect(connected).toBe(true);
    expect(measured).toBe(true);
  });

  test('all nested descendants exist before child and parent drawn()', () => {
    const order: string[] = [];
    const Child = compDef({
      draw: () => elem('b', 'Child'),
      drawn(vNode) {
        expect(vNode.el!.isConnected).toBe(true);
        expect(app.querySelector('em')?.textContent).toBe('Sibling');
        order.push('child');
      }
    });
    const Parent = compDef({
      draw: () => elem('section', comp(Child), elem('em', 'Sibling')),
      drawn(vNode) {
        expect(vNode.el!.isConnected).toBe(true);
        order.push('parent');
      }
    });

    bind(app, comp(Parent));
    expect(order).toEqual(['child', 'parent']);
  });

  test('a multi-root component has every root attached by drawn()', () => {
    const Multi = compDef({
      draw: () => [elem('span', 'A'), elem('span', 'B')],
      drawn(vNode) {
        expect(vNode.el).toBe(app.firstChild);
        expect(vNode.el!.isConnected).toBe(true);
        expect([...app.children].map(node => node.textContent)).toEqual(['A', 'B']);
      }
    });
    bind(app, comp(Multi));
  });

  test('empty component has null el and still receives drawn()', () => {
    const spy = vi.fn();
    const Empty = compDef({
      draw: () => null,
      drawn(vNode, first) {
        expect(vNode.el).toBeNull();
        spy(first);
      }
    });
    bind(app, comp(Empty));
    expect(spy).toHaveBeenCalledWith(true);
  });

  test('surgical replacement updates el before drawn() and preserves first semantics', () => {
    let child!: ReturnType<typeof comp>;
    let tag = 'span';
    const seen: [string, boolean, boolean][] = [];
    const Child = compDef({
      init(vNode) { child = vNode; },
      draw: () => elem(tag, 'Content'),
      drawn(vNode, first) {
        seen.push([(vNode.el as Element).tagName, first, vNode.el!.isConnected]);
      }
    });
    bind(app, elem('div', comp(Child)));
    tag = 'strong';
    redraw(child, true);
    sync();
    expect(seen).toEqual([
      ['SPAN', true, true],
      ['STRONG', false, true]
    ]);
  });

  test('nested bind during init cannot flush unfinished outer hooks', () => {
    const other = document.createElement('div');
    document.body.appendChild(other);
    const observed: boolean[] = [];
    const Inner = compDef({
      draw: () => elem('span', 'inner'),
      drawn(vNode) {
        observed.push(vNode.el!.isConnected && !!app.querySelector('section'));
      }
    });
    const Outer = compDef({
      init() { bind(other, comp(Inner)); },
      draw: () => elem('section', 'outer')
    });
    try {
      bind(app, elem('div', comp(Outer)));
      expect(observed).toEqual([true]);
    } finally {
      bind(other, null);
      other.remove();
    }
  });

  test('a component removed by an earlier drawn callback is skipped', () => {
    const later = vi.fn();
    const First = compDef({
      draw: () => elem('span', 'first'),
      drawn() { bind(app, null); }
    });
    const Second = compDef({
      draw: () => elem('span', 'second'),
      drawn: later
    });
    bind(app, [comp(First), comp(Second)]);
    expect(later).not.toHaveBeenCalled();
    expect(app.textContent).toBe('');
  });

  test('a bind triggered by drawn cannot prematurely interleave queued hooks', () => {
    const other = document.createElement('div');
    document.body.appendChild(other);
    const order: string[] = [];
    const Nested = compDef({
      draw: () => elem('span', 'Nested'),
      drawn(vNode) {
        expect(vNode.el!.isConnected).toBe(true);
        order.push('nested');
      }
    });
    const First = compDef({
      draw: () => elem('span', 'First'),
      drawn() {
        order.push('first start');
        bind(other, comp(Nested));
        order.push('first end');
      }
    });
    try {
      bind(app, comp(First));
      expect(order).toEqual(['first start', 'first end', 'nested']);
    } finally {
      bind(other, null);
      other.remove();
    }
  });

  test('detached bind roots are attached to their container, not the document', () => {
    const detached = document.createElement('div');
    const observed: [boolean, boolean][] = [];
    const Child = compDef({
      draw: () => elem('span'),
      drawn(vNode) { observed.push([vNode.el!.parentNode === detached, vNode.el!.isConnected]); }
    });
    bind(detached, comp(Child));
    expect(observed).toEqual([[true, false]]);
    bind(detached, null);
  });
});

test('reviving a keyed component preserves a queued surgical drawn() and cancels its pending removal', async () => {

  let root!: ReturnType<typeof comp>;
  let item!: ReturnType<typeof comp>;
  let phase: 'active' | 'removing' | 'revived' = 'active';
  let label = 'initial';
  let resolveRemoval!: () => void;
  let requestedFollowup = false;
  const snapshots: string[] = [];
  const initialized = vi.fn();
  const remove = vi.fn(() => new Promise<void>(resolve => { resolveRemoval = resolve; }));
  const removed = vi.fn();

  const Item = compDef({
    init(vNode) {
      initialized();
      item = vNode;
    },
    draw: () => elem('span', label),
    drawn(vNode, first) {
      // The queued hook must see the *current*, attached DOM, even if
      // additional reconciliation happened before it was dispatched.
      expect(vNode).toBe(item);
      expect(vNode.el?.isConnected).toBe(true);
      snapshots.push(`${first === true ? 'first' : 'update'}:${vNode.el?.textContent}`);

      if (phase === 'revived' && !requestedFollowup) {
        requestedFollowup = true;
        label = 'follow-up';
        redraw(vNode, true); // Schedule another update from drawn().
      }
    },
    remove,
    removed,
  });

  const Reviver = compDef({
    draw: () => elem('i', 'reviver'),
    drawn() {
      if (phase !== 'removing') return;
      // This callback runs while the surgical drawn() hook is still queued.
      // Reconcile the same key before that hook is dispatched.
      phase = 'revived';
      label = 'revived';
      redraw(root);
      sync();
    },
  });

  const Parent = compDef({
    draw: () => [
      comp(Reviver, { $key: 'reviver' }),
      comp(Item, { $key: 'item', $remove: phase === 'removing' }),
    ],
  });

  try {
    root = bind(app, comp(Parent));
    const original = item;
    const element = item.el;
    expect(snapshots).toEqual(['first:initial']);
    // Queue parent removal BEFORE a surgical redraw of the same component.
    // sync() processes both before dispatching any drawn() callbacks.
    phase = 'removing';
    redraw(root);
    redraw(item, true);
    sync();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(initialized).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();
    expect(item).toBe(original);
    expect(item.el).toBe(element);
    expect(app.querySelector('span')).toBe(element);
    expect(phase).toBe('revived');
    expect(requestedFollowup).toBe(true);
    // The follow-up scheduled by drawn() should run normally.
    sync();
    expect(app.querySelector('span')?.textContent).toBe('follow-up');
    expect(snapshots).toContain('update:revived');
    expect(snapshots).toContain('update:follow-up');
    // Resolving the *old* remove() promise must not destroy the revived vnode.
    resolveRemoval();
    await Promise.resolve();
    sync();
    expect(removed).not.toHaveBeenCalled();
    expect(initialized).toHaveBeenCalledTimes(1);
    expect(item).toBe(original);
    expect(item.el).toBe(element);
    expect(app.querySelector('span')?.textContent).toBe('follow-up');
    expect(item.el?.isConnected).toBe(true);
  } finally {
    bind(app, null);
    app.remove();
  }
});

describe('external DOM node ownership and reconciliation', () => {
  test('removes external DOM nodes on unmount', () => {
    const content = document.createElement('div');
    bind(app, node(content));
    expect(app.firstChild).toBe(content);
    bind(app, null);
    expect(app.childNodes).toHaveLength(0);
    expect(content.parentNode).toBeNull();
  });

  test('replaces an external node with another external node', () => {
    const a = document.createElement('a');
    const b = document.createElement('b');
    bind(app, node(a));
    bind(app, node(b));
    expect([...app.childNodes]).toEqual([b]);
    expect(a.parentNode).toBeNull();
  });

  test('preserves an external node when a preceding sibling is removed', () => {
    const content = document.createElement('div');
    bind(app, [elem('div', 'Loading'), node(content)]);
    bind(app, [node(content)]);
    expect([...app.childNodes]).toEqual([content]);
  });

  test('reorders external nodes by DOM identity', () => {
    const a = document.createElement('a');
    const b = document.createElement('b');
    const c = document.createElement('i');
    bind(app, [node(a), node(b), node(c)]);
    bind(app, [node(c), node(a), node(b)]);
    expect([...app.childNodes]).toEqual([c, a, b]);
    bind(app, [node(b), node(c)]);
    expect([...app.childNodes]).toEqual([b, c]);
    expect(a.parentNode).toBeNull();
  });

  test('retains external DOM when it moves out of a removed component', () => {
    const content = document.createElement('div');
    const Inner = compDef({ draw: () => node(content) });
    bind(app, comp(Inner));
    bind(app, node(content));
    expect([...app.childNodes]).toEqual([content]);
  });

  test('retains external DOM when it moves out of a removed element', () => {
    const content = document.createElement('div');
    bind(app, elem('section', node(content)));
    bind(app, elem('aside', node(content)));
    expect(app.firstElementChild?.tagName).toBe('ASIDE');
    expect(app.firstElementChild?.firstChild).toBe(content);
    expect(app.childNodes).toHaveLength(1);
  });

  test('can reuse a cached node vnode without losing unmount ownership', () => {
    const content = document.createElement('div');
    const reused = node(content);
    bind(app, [elem('div', 'Loading'), reused]);
    bind(app, [reused]);
    expect([...app.childNodes]).toEqual([content]);
    bind(app, null);
    expect(content.parentNode).toBeNull();
  });

  test('preserves an external node during a component redraw', () => {
    const content = document.createElement('div');
    let loading = true;
    const Content = compDef({
      draw: () => elem('main',
        loading ? elem('div', 'Loading') : null,
        node(content)
      ),
    });
    const vNode = comp(Content);
    bind(app, vNode);
    loading = false;
    redraw(vNode, true);
    sync();
    expect([...app.querySelector('main')!.childNodes]).toEqual([content]);
  });

  test('moves an external node between parent elements', () => {
    const content = document.createElement('div');
    bind(app, [
      elem('section', node(content)),
      elem('aside'),
    ]);
    bind(app, [
      elem('section'),
      elem('aside', node(content)),
    ]);
    expect(app.querySelector('section')?.childNodes).toHaveLength(0);
    expect(app.querySelector('aside')?.firstChild).toBe(content);
    bind(app, [
      elem('section', node(content)),
      elem('aside'),
    ]);
    expect(app.querySelector('section')?.firstChild).toBe(content);
    expect(app.querySelector('aside')?.childNodes).toHaveLength(0);
  });

  test('preserves position when replacing a native DOM node', () => {
    const container = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('span');
    first.textContent = 'First';
    second.textContent = 'Second';
    bind(container, elem('div',
      elem('span', 'Before'),
      node(first),
      elem('span', 'After')
    ));
    bind(container, elem('div',
      elem('span', 'Before'),
      node(second),
      elem('span', 'After')
    ));
    const children = container.firstElementChild!.childNodes;
    expect(children.length).toBe(3);
    expect(children[0].textContent).toBe('Before');
    expect(children[1]).toBe(second);
    expect(children[2].textContent).toBe('After');
    expect(first.isConnected).toBe(false);
  });

  test('preserves a native DOM node when replacing its parent', () => {
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');
    bind(container,
        elem('section', node(canvas))
    );
    expect(canvas.parentElement?.tagName).toBe('SECTION');
    bind(container,
        elem('article', node(canvas))
    );
    expect(container.querySelector('article canvas')).toBe(canvas);
    expect(canvas.parentElement?.tagName).toBe('ARTICLE');
    bind(container, null);
    expect(container.contains(canvas)).toBe(false);
    expect(container.firstChild).toBeNull();
    expect(canvas.isConnected).toBe(false);
  });
});