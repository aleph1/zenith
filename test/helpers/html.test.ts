import { describe, expect, test } from 'vitest';
import { bind } from '../../src/index';
import { html } from '../../src/helpers/html';

test('parses a single HTML element', () => {
  const vNode = html('<span>Hello</span>');
  const container = document.createElement('div');

  bind(container, vNode);

  expect(container.innerHTML).toBe('<span>Hello</span>');

  bind(container, null);
});

test('parses multiple root elements', () => {
  const vNodes = html('<span>First</span><b>Second</b>');
  const container = document.createElement('div');

  expect(Array.isArray(vNodes)).toBe(true);

  bind(container, vNodes);

  expect(container.children).toHaveLength(2);
  expect(container.innerHTML).toBe('<span>First</span><b>Second</b>');

  bind(container, null);
});

test('preserves text nodes alongside elements', () => {
  const vNodes = html('Before <strong>middle</strong> after');
  const container = document.createElement('div');

  bind(container, vNodes);

  expect(container.textContent).toBe('Before middle after');
  expect(container.querySelector('strong')?.textContent).toBe('middle');
  expect(container.childNodes).toHaveLength(3);

  bind(container, null);
});

test('handles empty HTML', () => {
  const vNodes = html('');
  const container = document.createElement('div');

  expect(vNodes).toEqual([]);

  bind(container, vNodes);

  expect(container.childNodes).toHaveLength(0);

  bind(container, null);
});
