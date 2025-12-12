import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  mount,
} from '../src/index';

describe('Events', () => {

  test('onclick event is called', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('div', {
      onclick: callback
    });
    mount(app, el1);
    expect(callback).not.toBeCalled();
    expect(el1.dom instanceof HTMLElement).toBe(true);
    (el1.dom as HTMLElement).click();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('onclick removed when missing', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('div', {
      onclick: callback
    });
    const el2 = elem('div');
    mount(app, el1);
    mount(app, el2);
    (el2.dom as HTMLElement).click();
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('onclick removed when null', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('div', {
      onclick: callback
    });
    const el2 = elem('div', {
      onclick: null
    });
    mount(app, el1);
    mount(app, el2);
    (el2.dom as HTMLElement).click();
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('onclick removed when undefined', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('div', {
      onclick: callback
    });
    const el2 = elem('div', {
      onclick: undefined
    });
    mount(app, el1);
    mount(app, el2);
    (el2.dom as HTMLElement).click();
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('onchange is called when input value changes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('input', {
      onchange: callback
    });
    mount(app, el1);
    (el1.dom as HTMLInputElement).value = 'test';
    el1.dom.dispatchEvent(new Event('change', {
      bubbles: true,
      cancelable: true
    }));
    expect((el1.dom as HTMLInputElement).value).toBe('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('onchange is called when checkbox goes from unchecked to checked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('input', {
      type: 'checkbox',
      onclick: callback
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
    expect(callback).not.toBeCalled();
    (el1.dom as HTMLInputElement).click();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
  });

  test('onchange event when checkbox goes from checked to unchecked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('input', {
      type: 'checkbox',
      checked: true,
      onchange: callback
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
    expect((el1.dom as HTMLInputElement).checked).toBe(true);
    expect(callback).not.toBeCalled();
    (el1.dom as HTMLInputElement).click();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
  });

  test('onchange event when radio goes from unchecked to checked', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('input', {
      type: 'radio',
      onchange: callback
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
    expect((el1.dom as HTMLInputElement).checked).toBe(false);
    expect(callback).not.toBeCalled();
    (el1.dom as HTMLInputElement).click();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(el1.dom instanceof HTMLInputElement).toBe(true);
    expect((el1.dom as HTMLInputElement).checked).toBe(true);
  });

  test('onchange is called when textarea value changes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('textarea', {
      onchange: callback
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLTextAreaElement).toBe(true);
    expect((el1.dom as HTMLTextAreaElement).value).toBe('');
    (el1.dom as HTMLTextAreaElement).value = 'test';
    el1.dom.dispatchEvent(new Event('change', {
      bubbles: true,
      cancelable: true
    }));
    expect((el1.dom as HTMLTextAreaElement).value).toBe('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('oninput is called on element with contenteditable=true', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn();
    const el1 = elem('div', {
      contenteditable: 'true',
      oninput: callback
    });
    mount(app, el1);
    (el1.dom as Element).textContent = 'test';
    el1.dom.dispatchEvent(new Event('input', {
      bubbles: true,
      cancelable: true
    }));
    expect((el1.dom as Element).textContent).toBe('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('onsubmit event is called on form', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const callback = vi.fn(e => e.preventDefault());
    const el1 = elem('form', {
      onsubmit: callback
    });
    mount(app, el1);
    expect(el1.dom instanceof HTMLFormElement).toBe(true);
    (el1.dom as HTMLFormElement).requestSubmit();
    expect(callback).toHaveBeenCalledTimes(1);
  });

});