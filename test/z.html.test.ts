import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('z.html()', () => {

  test('Returns the expected object', () => {
    const node = z.html('test');
    expect(node).not.toBeNull();
    expect(typeof node).toBe('object');
    expect(node).toHaveOnlyProperties(['type', 'tag']);
    expect(node.type).toBe(VNodeTypes.html);
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('test');
  });

  test('Handles string', () => {
    const node = z.html('test');
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('test');
  });

  test('Handles number', () => {
    const node = z.html(1 as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('1');
  });

  test('Handles BigInt', () => {
    const node = z.html(BigInt(9007199254740991) as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('9007199254740991');
  });

  test('Handles null', () => {
    const node = z.html(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('');
  });

  test('Handles true', () => {
    const node = z.html(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('');
  });

  test('Handles false', () => {
    const node = z.html(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(typeof node.tag).toBe('string');
    expect(node.tag).toBe('');
  });

});