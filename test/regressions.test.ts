/**
 * Regression tests for DOM ordering, component ownership, redraws and attributes.
 *
 * These intentionally assert the desired behavior. Several are expected to FAIL
 * against the current renderer; they should pass once the corresponding bugs
 * have been fixed. Keep them separate from the existing tests.
 *
 * Uses the project's existing Vitest DOM environment (jsdom or happy-dom).
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, diff, draw, elem, sync } from '../src/index';

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

/** Render from the component currently bound by the test. */
const redraw = (vNode: ReturnType<typeof comp>, surgical = false) => {
  draw(vNode, surgical);
  sync();
};

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

  test('a portal unmount removes its own content without clearing another portal', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
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
    expect(elementText(target)).toEqual(['first', 'second']);

    showFirst = false;
    redraw(view);

    expect(target.querySelector('#first')).toBeNull();
    expect(target.querySelector('#second')?.textContent).toBe('second');
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