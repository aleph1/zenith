import { describe, test, expect } from 'vitest';
import {
  text
} from '../src/index';
import {
  VNODE_TEXT
} from '../src/vnode.defs';

describe('text()', () => {

  test('Handles empty string', () => {
    const text1 = text('');
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });

  test('Handles non-empty string', () => {
    const text1 = text('test');
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('test');
  });

  test('Handles number', () => {
    const text1 = text(1);
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('1');
  });

  test('Handles BigInt', () => {
    const text1 = text(BigInt(9007199254740991));
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('9007199254740991');
  });

  test('Handles null', () => {
    // eslint-disable-next-line
    const text1 = text(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });

  test('Handles undefined', () => {
    const text1 = text(undefined as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });

  test('Handles true', () => {
    const text1 = text(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });

  test('Handles false', () => {
    const text1 = text(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });

  test('Handles object', () => {
    const text1 = text({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(text1).not.toBeNull();
    expect(typeof text1).toBe('object');
    expect(text1).toHaveOnlyProperties(['type', 'tag']);
    expect(text1.type).toBe(VNODE_TEXT);
    expect(text1.tag).toBe('');
  });
  
});