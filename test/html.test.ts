import { describe, test, expect } from 'vitest';
import {
  html
} from '../src/index';
import {
  VNODE_HTML
} from '../src/vnode.defs';

describe.skip('html()', () => {

  test('Returns the expected object', () => {
    const html1 = html('test');
    expect(html1).not.toBeNull();
    expect(typeof html1).toBe('object');
    expect(html1).toHaveOnlyProperties(['type', 'tag']);
    expect(html1.type).toBe(VNODE_HTML);
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('test');
  });

  test('Handles string', () => {
    const html1 = html('test');
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('test');
  });

  test('Handles number', () => {
    const html1 = html(1 as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('1');
  });

  test('Handles BigInt', () => {
    const html1 = html(BigInt(9007199254740991) as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('9007199254740991');
  });

  test('Handles null', () => {
    const html1 = html(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('');
  });

  test('Handles true', () => {
    const html1 = html(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('');
  });

  test('Handles false', () => {
    const html1 = html(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof html1.tag).toBe('string');
    expect(html1.tag).toBe('');
  });

});