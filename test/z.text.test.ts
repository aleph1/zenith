import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('z.text()', () => {

	test('Handles empty string', () => {
	  const node = z.text('');
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});

	test('Handles non-empty string', () => {
	  const node = z.text('test');
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('test');
	});

	test('Handles number', () => {
	  const node = z.text(1);
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('1');
	});

	test('Handles BigInt', () => {
	  const node = z.text(BigInt(9007199254740991));
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('9007199254740991');
	});

	test('Handles null', () => {
	  // eslint-disable-next-line
	  const node = z.text(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});

	test('Handles undefined', () => {
	  const node = z.text(undefined as any); // eslint-disable-line @typescript-eslint/no-explicit-any
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});

	test('Handles true', () => {
	  const node = z.text(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});

	test('Handles false', () => {
	  const node = z.text(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});

	test('Handles object', () => {
	  const node = z.text({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
	  expect(node).not.toBeNull();
	  expect(typeof node).toBe('object');
	  expect(node).toHaveOnlyProperties(['type', 'tag']);
	  expect(node.type).toBe(VNodeTypes.text);
	  expect(node.tag).toBe('');
	});
	
});