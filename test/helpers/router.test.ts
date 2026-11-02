import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import { bind, comp, elem, sync } from '../../src/index';
import { router } from '../../src/helpers/router';

describe('router', () => {
  let app: HTMLElement;

  beforeEach(() => {
    app = document.createElement('div');
    document.body.appendChild(app);
    location.hash = '#/';
  });

  afterEach(() => {
    bind(app, null);
    app.remove();
    history.replaceState(null, '', '/');
  });

  test('renders the matching hash route', () => {
    const Router = router({
      '/': () => elem('p', 'Home'),
      '/about': () => elem('p', 'About')
    });

    bind(app, comp(Router));

    expect(app.textContent).toBe('Home');
  });

  test('updates when the hash changes', () => {
    const Router = router({
      '/': () => elem('p', 'Home'),
      '/about': () => elem('p', 'About')
    });

    const instance = comp(Router);
    bind(app, instance);

    expect(app.textContent).toBe('Home');

    // Update the URL without scheduling a native hashchange event.
    history.replaceState(null, '', '#/about');

    // Dispatch exactly one navigation event.
    window.dispatchEvent(new Event('hashchange'));
    sync();

    expect(app.textContent).toBe('About');
    expect(instance.nodes[0].el.textContent).toBe('About');
  });

  test('extracts dynamic route parameters', () => {
    location.hash = '#/users/42';

    const Router = router({
      '/users/:id': ({ id }) => elem('p', id)
    });

    bind(app, comp(Router));

    expect(app.textContent).toBe('42');
  });

  test('uses wildcard fallback regardless of declaration order', () => {
    location.hash = '#/about';

    const Router = router({
      '*': () => elem('p', 'Not found'),
      '/about': () => elem('p', 'About')
    });

    bind(app, comp(Router));

    expect(app.textContent).toBe('About');
  });

  test('renders the fallback when no route matches', () => {
    location.hash = '#/missing';

    const Router = router({
      '/': () => elem('p', 'Home'),
      '*': () => elem('p', 'Not found')
    });

    bind(app, comp(Router));

    expect(app.textContent).toBe('Not found');
  });

  test('renders nothing when no route or fallback matches', () => {
    location.hash = '#/missing';

    const Router = router({
      '/': () => elem('p', 'Home')
    });

    bind(app, comp(Router));

    expect(app.textContent).toBe('');
  });

  test('removes its navigation listener when unmounted', () => {
    let renders = 0;

    const Router = router({
      '/': () => {
        renders++;
        return elem('p', 'Home');
      }
    });

    bind(app, comp(Router));
    expect(renders).toBe(1);

    bind(app, null);

    window.dispatchEvent(new Event('hashchange'));
    sync();

    expect(renders).toBe(1);
  });
});
