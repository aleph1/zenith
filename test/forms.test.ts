import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';

describe('Forms', () => {

  test('input value can be set as text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      value: 'test'
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).value).toBe('test');
  });

  test('input value can be set as a number', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      value: 2
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).value).toBe('2');
  });

  test('input value of null is an empty string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      value: null
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).value).toBe('');
    expect((el1.dom as HTMLInputElement).getAttribute('value')).toBe(null);
  });

  test('input value is updated when DOM value differs from vNode value', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('input', {
      value: 'test',
    });
    const node2 = z.elem('input', {
      value: 'test2',
    });
    z.mount(app, node1);
    (node1.dom as HTMLInputElement).value += '1';
    z.mount(app, node2);
    expect((node1.dom as HTMLInputElement).value).toBe('test2');
  });

  test('<option> value can be set as text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('option', {
      value: 'test'
    });
    const el2 = z.elem('select',
      el1
    );
    z.mount(app, el2);
    expect(el1.dom instanceof HTMLOptionElement);
    expect((el1.dom as HTMLOptionElement).value).toBe('test');
  });

  test('<option> value can be set as a number', () => {
    const app = document.querySelector('#app');
    const el1 = z.elem('option', {
      value: 2
    });
    const el2 = z.elem('select',
      el1
    );
    z.mount(app, el2);
    expect(el1.dom instanceof HTMLOptionElement);
    expect((el1.dom as HTMLOptionElement).value).toBe('2');
  });

  test('<option> value of null is an empty string', () => {
    const app = document.querySelector('#app');
    const el1 = z.elem('option', {
      value: null
    });
    const el2 = z.elem('select',
      el1
    );
    z.mount(app, el2);
    expect(el1.dom instanceof HTMLOptionElement);
    expect((el1.dom as HTMLInputElement).value).toBe('');
    expect((el1.dom as HTMLInputElement).getAttribute('value')).toBe(null);
  });

  test('<option> value is updated when DOM value differs from vNode value', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('option', {
      value: 'test',
    });
    const node2 = z.elem('option', {
      value: 'test2',
    });
    z.mount(app, node1);
    (node1.dom as HTMLOptionElement).value += '1';
    z.mount(app, node2);
    expect((node1.dom as HTMLOptionElement).value).toBe('test2');
  });

  test('textarea value can be set as text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('textarea', {
      value: 'test'
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLTextAreaElement);
    expect((el1.dom as HTMLTextAreaElement).value).toBe('test');
  });

  test('textarea value can be set as a number', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('textarea', {
      value: '2'
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLTextAreaElement);
    expect((el1.dom as HTMLTextAreaElement).value).toBe('2');
  });

  test('textarea value of null is an empty string', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('textarea', {
      value: null
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLTextAreaElement);
    expect((el1.dom as HTMLTextAreaElement).value).toBe('');
    expect((el1.dom as HTMLTextAreaElement).getAttribute('value')).toBe(null);
  });

  test('textarea value is updated when DOM value differs from vNode value', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('textarea', {
      value: 'test',
    });
    const node2 = z.elem('textarea', {
      value: 'test2',
    });
    z.mount(app, node1);
    (node1.dom as HTMLTextAreaElement).value += '1';
    z.mount(app, node2);
    expect((node1.dom as HTMLTextAreaElement).value).toBe('test2');
  });

  test('Checkbox from z.elem("input", {type: "checkbox", checked: true}) is checked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'checkbox',
      checked: true
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(true);
  });

  test('Checkbox from z.elem("input", {type: "checkbox", checked: false}) is unchecked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'checkbox',
      checked: false
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
  });

  test('Checkbox from z.elem("input", {type: "checkbox"}) is unchecked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'checkbox'
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
  });

  test('Radio from z.elem("input", {type: "radio", checked: true}) is checked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'radio',
      checked: true
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(true);
  });

  test('Radio from z.elem("input", {type: "radio", checked: false}) is unchecked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'radio',
      checked: false
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
  });

  test('Radio from z.elem("input", {type: "radio"}) is unchecked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const el1 = z.elem('input', {
      type: 'radio'
    });
    z.mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
  });

});