import { describe, expect, test, vi } from 'vitest';
import { elem } from '../../src/index';
import { slot } from '../../src/helpers/slot';

test('returns static content unchanged', () => {
  const content = elem('span', 'Hello');

  expect(slot(content, {})).toBe(content);
});

test('evaluates function content with the supplied attributes', () => {
  const attrs = { message: 'Hello' };
  const content = vi.fn(attrs => elem('span', attrs.message));

  const result = slot(content, attrs);

  expect(content).toHaveBeenCalledExactlyOnceWith(attrs);
  expect(result).toEqual(elem('span', 'Hello'));
});

test('preserves empty string content', () => {
  expect(slot('', {})).toBe('');
});

test('returns undefined for null or undefined content', () => {
  expect(slot(null, {})).toBeUndefined();
  expect(slot(undefined, {})).toBeUndefined();
});
