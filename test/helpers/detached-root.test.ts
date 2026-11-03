import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { bind, comp, elem, redraw, sync } from '../../src/index';
import { DetachedRoot } from '../../src/helpers/detached-root';

let app: HTMLElement;
let target: HTMLElement;

beforeEach(() => {
  app = document.createElement('div');
  target = document.createElement('div');

  document.body.append(app, target);
});

afterEach(() => {
  bind(app, null);
  app.remove();
  target.remove();
});

test('renders children into an external target', async () => {
  bind(app, comp(DetachedRoot, {
    to: target,
    children: elem('span', 'Hello')
  }));

  await Promise.resolve();

  expect(app.childNodes).toHaveLength(0);
  expect(target.textContent).toBe('Hello');
  expect(target.querySelector('span')).not.toBeNull();
});

test('resolves a target from a selector', async () => {
  target.id = 'detached-target';

  bind(app, comp(DetachedRoot, {
    to: '#detached-target',
    children: elem('span', 'Hello')
  }));

  await Promise.resolve();

  expect(target.textContent).toBe('Hello');
});

test('updates detached content when redrawn', async () => {
  const instance = comp(DetachedRoot, {
    to: target,
    children: elem('span', 'First')
  });

  bind(app, instance);
  await Promise.resolve();

  const span = target.querySelector('span');

  expect(span?.textContent).toBe('First');

  instance.attrs.children = elem('span', 'Second');

  redraw(instance, true);
  sync();
  await Promise.resolve();

  expect(target.textContent).toBe('Second');
  expect(target.querySelector('span')).toBe(span);
});

test('removes detached content and host when unmounted', async () => {
  bind(app, comp(DetachedRoot, {
    to: target,
    children: elem('span', 'Hello')
  }));

  await Promise.resolve();

  const host = target.firstElementChild!;

  expect(host.textContent).toBe('Hello');
  expect(host.parentNode).toBe(target);

  bind(app, null);

  expect(host.parentNode).toBeNull();
  expect(target.childNodes).toHaveLength(0);
  expect(app.childNodes).toHaveLength(0);
});

test('cancels a pending update when unmounted', async () => {
  bind(app, comp(DetachedRoot, {
    to: target,
    children: elem('span', 'Hello')
  }));

  // Unmount before the scheduled microtask runs.
  bind(app, null);

  await Promise.resolve();

  expect(target.childNodes).toHaveLength(0);
  expect(app.childNodes).toHaveLength(0);
});

test('removes the host when the target disappears', async () => {
  target.id = 'detached-target';

  const instance = comp(DetachedRoot, {
    to: '#detached-target',
    children: elem('span', 'Hello')
  });

  bind(app, instance);
  await Promise.resolve();

  const host = target.firstElementChild!;

  expect(host.parentNode).toBe(target);
  expect(target.textContent).toBe('Hello');

  // Remove the target from the document.
  target.remove();

  // Trigger another target lookup.
  redraw(instance, true);
  sync();
  await Promise.resolve();

  // The host should also be detached from its former target.
  expect(host.parentNode).toBeNull();
  expect(target.contains(host)).toBe(false);
});

test('coalesces updates while a render is pending', async () => {
  const instance = comp(DetachedRoot, {
    to: target,
    children: elem('span', 'First')
  });

  bind(app, instance);

  // A detached render is already pending from the initial mount.
  instance.attrs.children = elem('span', 'Second');
  redraw(instance, true);
  sync();

  instance.attrs.children = elem('span', 'Third');
  redraw(instance, true);
  sync();

  await Promise.resolve();

  expect(target.textContent).toBe('Third');
  expect(target.querySelectorAll('span')).toHaveLength(1);
});
