import { describe, expect, test, vi } from 'vitest';
import { signal } from '../../src/helpers/signal';
import { derived } from '../../src/helpers/derived';

test('computes its initial value', () => {
  const count = signal(5);
  const doubled = derived(() => count.val * 2, [count]);

  expect(doubled.val).toBe(10);

  doubled.destroy();
});

test('recomputes when a dependency changes', () => {
  const count = signal(1);
  const doubled = derived(() => count.val * 2, [count]);
  const subscriber = vi.fn();

  doubled.sub(subscriber);

  count.val = 2;

  expect(doubled.val).toBe(4);
  expect(subscriber).toHaveBeenCalledExactlyOnceWith(4);

  count.val = 3;

  expect(doubled.val).toBe(6);
  expect(subscriber).toHaveBeenCalledTimes(2);

  doubled.destroy();
});

test('recomputes when any dependency changes', () => {
  const a = signal(2);
  const b = signal(3);
  const sum = derived(() => a.val + b.val, [a, b]);

  expect(sum.val).toBe(5);

  a.val = 4;
  expect(sum.val).toBe(7);

  b.val = 6;
  expect(sum.val).toBe(10);

  sum.destroy();
});

test('does not notify when the computed value is unchanged', () => {
  const count = signal(2);
  const isEven = derived(() => count.val % 2 === 0, [count]);
  const subscriber = vi.fn();

  isEven.sub(subscriber);

  count.val = 4;

  expect(isEven.val).toBe(true);
  expect(subscriber).not.toHaveBeenCalled();

  count.val = 5;

  expect(isEven.val).toBe(false);
  expect(subscriber).toHaveBeenCalledExactlyOnceWith(false);

  isEven.destroy();
});

test('recomputes when a dependency explicitly notifies', () => {
  const state = signal({ count: 1 });
  const doubled = derived(() => state.val.count * 2, [state]);

  state.val.count = 3;
  state.notify();

  expect(doubled.val).toBe(6);

  doubled.destroy();
});

test('destroy() unsubscribes from dependencies', () => {
  const count = signal(1);
  const compute = vi.fn(() => count.val * 2);
  const doubled = derived(compute, [count]);
  const subscriber = vi.fn();

  doubled.sub(subscriber);

  expect(compute).toHaveBeenCalledTimes(1);

  count.val = 2;

  expect(doubled.val).toBe(4);
  expect(compute).toHaveBeenCalledTimes(2);

  doubled.destroy();

  count.val = 3;

  expect(doubled.val).toBe(4);
  expect(compute).toHaveBeenCalledTimes(2);
  expect(subscriber).toHaveBeenCalledTimes(1);
});

test('destroy() can be called more than once', () => {
  const count = signal(1);
  const doubled = derived(() => count.val * 2, [count]);

  expect(() => {
    doubled.destroy();
    doubled.destroy();
  }).not.toThrow();

  count.val = 2;

  expect(doubled.val).toBe(2);
});
