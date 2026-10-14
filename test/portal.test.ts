import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { bind, comp, compDef, elem, sync } from '../src/index';
import { Portal } from '../src/helpers/portal';
import { redraw } from './utils';

// The Portal helper schedules its child bind() in a microtask.
// Wait for that work before asserting against the external target.
const flushPortal = async () => {
    await Promise.resolve();
    sync();
};

describe('Regression: Portal helper', () => {
    let app: HTMLDivElement;
    const targets: HTMLDivElement[] = [];

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

    test('renders into its target and leaves a placeholder', async () => {
        const target = createTarget();

        bind(app, elem('main', comp(Portal, {
            to: target,
            children: elem('span', 'Portal content')
        })));

        const main = app.querySelector('main');
        expect(main?.childNodes).toHaveLength(1);
        expect(main?.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
        expect(app.querySelector('span')).toBeNull();

        await flushPortal();

        expect(target.textContent).toBe('Portal content');
        expect(target.querySelectorAll('span')).toHaveLength(1);

        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('updating portal children preserves DOM identity', async () => {
        const target = createTarget();
        let value = 'Before';
        const init = vi.fn();

        const Content = compDef({
            init,
            draw: (vnode) => elem('span', vnode.attrs.value)
        });
        const Parent = compDef({
            draw: () => comp(Portal, {
                to: target,
                children: comp(Content, { value })
            })
        });

        const parent = comp(Parent);
        bind(app, parent);
        await flushPortal();

        const original = target.querySelector('span');
        expect(original).not.toBeNull();
        expect(init).toHaveBeenCalledTimes(1);

        value = 'After';
        redraw(parent);
        await flushPortal();

        expect(target.textContent).toBe('After');
        expect(target.querySelector('span')).toBe(original);
        expect(init).toHaveBeenCalledTimes(1);

        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('removing a nested portal cleans up DOM and lifecycle hooks', async () => {
        const target = createTarget();
        let visible = true;
        const removed = vi.fn();

        const Content = compDef({
            draw: () => elem('span', 'Nested content'),
            removed
        });
        const Parent = compDef({
            draw: () => elem('div',
                visible ? comp(Portal, {
                    to: target,
                    children: comp(Content)
                }) : null
            )
        });

        const parent = comp(Parent);
        bind(app, parent);
        await flushPortal();
        expect(target.textContent).toBe('Nested content');

        visible = false;
        redraw(parent);

        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);

        bind(app, null);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('unbinding destroys a portal with pending deferred removal', async () => {
        const target = createTarget();
        let removing = false;
        let resolveRemoval!: () => void;
        const remove = vi.fn(() => new Promise<void>(resolve => {
            resolveRemoval = resolve;
        }));
        const removed = vi.fn();

        const Content = compDef({
            draw: () => elem('span', 'Deferred content'),
            remove,
            removed
        });
        const Parent = compDef({
            draw: () => comp(Portal, {
                to: target,
                children: comp(Content, {
                    $key: 'content',
                    $remove: removing
                })
            })
        });

        const parent = comp(Parent);
        bind(app, parent);
        await flushPortal();
        expect(target.textContent).toBe('Deferred content');

        removing = true;
        redraw(parent);
        await flushPortal();

        expect(remove).toHaveBeenCalledTimes(1);
        expect(target.textContent).toBe('Deferred content');
        expect(removed).not.toHaveBeenCalled();

        bind(app, null);
        expect(app.childNodes).toHaveLength(0);
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);

        resolveRemoval();
        await flushPortal();
        expect(target.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('multiple portals coexist in one target without assuming order', async () => {
        const target = createTarget();

        bind(app, elem('main',
            comp(Portal, { to: target, children: elem('span', 'A') }),
            comp(Portal, { to: target, children: elem('span', 'B') })
        ));
        await flushPortal();

        const labels = Array.from(target.querySelectorAll('span'), el => el.textContent);
        expect(labels).toHaveLength(2);
        expect(labels).toContain('A');
        expect(labels).toContain('B');
        // The helper uses a separate wrapper for each portal.
        expect(target.children).toHaveLength(2);

        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });


    test('unmounting one portal preserves another portal in the same target', async () => {
        const target = createTarget();
        let showFirst = true;

        const First = compDef({
            draw: () => elem('span', { id: 'first' }, 'first')
        });
        const Second = compDef({
            draw: () => elem('span', { id: 'second' }, 'second')
        });
        const View = compDef({
            draw: () => elem('section',
                showFirst
                    ? comp(Portal, { to: target, children: comp(First) })
                    : elem('em', 'gone'),
                comp(Portal, { to: target, children: comp(Second) })
            )
        });

        const view = comp(View);
        bind(app, view);
        await flushPortal();

        expect(target.querySelector('#first')?.textContent).toBe('first');
        const second = target.querySelector('#second');
        expect(second?.textContent).toBe('second');

        showFirst = false;
        redraw(view);

        expect(target.querySelector('#first')).toBeNull();
        expect(target.querySelector('#second')).toBe(second);
        expect(target.querySelector('#second')?.textContent).toBe('second');

        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('changing targets moves existing DOM without reinitializing', async () => {
        const targetA = createTarget();
        const targetB = createTarget();
        let target: Element = targetA;
        const init = vi.fn();
        const removed = vi.fn();

        const Content = compDef({
            init,
            draw: () => elem('span', 'Portal content'),
            removed
        });
        const Parent = compDef({
            draw: () => comp(Portal, {
                to: target,
                children: comp(Content)
            })
        });

        const parent = comp(Parent);
        bind(app, parent);
        await flushPortal();

        const original = targetA.querySelector('span');
        expect(original).not.toBeNull();
        expect(init).toHaveBeenCalledTimes(1);

        target = targetB;
        redraw(parent);
        await flushPortal();

        expect(targetA.childNodes).toHaveLength(0);
        expect(targetB.querySelector('span')).toBe(original);
        expect(init).toHaveBeenCalledTimes(1);
        expect(removed).not.toHaveBeenCalled();

        bind(app, null);
        expect(targetB.childNodes).toHaveLength(0);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    test('resolves a CSS selector target when drawing', async () => {
        const target = createTarget();
        target.id = 'zenith-portal-test-target';

        bind(app, comp(Portal, {
            to: '#zenith-portal-test-target',
            children: elem('span', 'Selected target')
        }));
        await flushPortal();

        expect(target.textContent).toBe('Selected target');
        bind(app, null);
        expect(target.childNodes).toHaveLength(0);
    });

    test('unbinding before queued child mount cannot recreate portal content', async () => {
        const target = createTarget();
        const init = vi.fn();
        const Content = compDef({
            init,
            draw: () => elem('span', 'Too late')
        });

        bind(app, comp(Portal, { to: target, children: comp(Content) }));
        bind(app, null);
        await flushPortal();

        expect(init).not.toHaveBeenCalled();
        expect(target.childNodes).toHaveLength(0);
    });
});
