import { describe, expect, test, vi } from 'vitest';
import { signal } from '../../src/helpers/signal';

test('initializes with the provided value', () => {
  const count = signal(5);

  expect(count.val).toBe(5);
});

test('updates its value and notifies subscribers', () => {
  const count = signal(0);
  const subscriber = vi.fn();

  count.sub(subscriber);
  count.val = 1;

  expect(count.val).toBe(1);
  expect(subscriber).toHaveBeenCalledExactlyOnceWith(1);

  count.val = 2;

  expect(subscriber).toHaveBeenCalledTimes(2);
  expect(subscriber).toHaveBeenLastCalledWith(2);
});

test('does not notify when the value is unchanged', () => {
  const count = signal(5);
  const subscriber = vi.fn();

  count.sub(subscriber);

  count.val = 5;

  expect(subscriber).not.toHaveBeenCalled();
});

test('supports multiple subscribers and unsubscribing', () => {
  const count = signal(0);
  const first = vi.fn();
  const second = vi.fn();

  const unsubscribe = count.sub(first);
  count.sub(second);

  count.val = 1;

  expect(first).toHaveBeenCalledExactlyOnceWith(1);
  expect(second).toHaveBeenCalledExactlyOnceWith(1);

  unsubscribe();

  count.val = 2;

  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);
  expect(second).toHaveBeenLastCalledWith(2);
});

test('notify() invokes subscribers without changing the value', () => {
  const count = signal(5);
  const subscriber = vi.fn();

  count.sub(subscriber);

  count.notify();

  expect(count.val).toBe(5);
  expect(subscriber).toHaveBeenCalledExactlyOnceWith(5);
});

test('supports notifying after an object is mutated', () => {
  const state = signal({ count: 0 });
  const subscriber = vi.fn();

  state.sub(subscriber);

  state.val.count = 1;
  state.notify();

  expect(subscriber).toHaveBeenCalledExactlyOnceWith(state.val);
  expect(state.val.count).toBe(1);
});
