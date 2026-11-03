import { describe, expect, test } from 'vitest';
import { cls } from '../../src/helpers/cls';

test('combines class names', () => {
  expect(cls('button', 'active', 'primary')).toBe('button active primary');
});

test('filters falsy values', () => {
  expect(cls('button', false, null, undefined, '', 'active')).toBe('button active');
});

test('returns an empty string when no classes remain', () => {
  expect(cls()).toBe('');
  expect(cls(false, null, undefined, '')).toBe('');
});
