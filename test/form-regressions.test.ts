import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { bind, comp, compDef, diff, elem, sync } from '../src/index';

// Run with Vitest's jsdom (or equivalent browser-DOM) environment.
// These tests define controlled-select semantics for value and selectedIndex.

describe('select value and selectedIndex', () => {
  let container: HTMLDivElement;

  const view = (
    attrs: Record<string, any> = {},
    values: string[] = ['a', 'b', 'c']
  ) => elem('select', attrs,
    values.map(value => elem('option', { value }, value || 'Empty'))
  );

  const select = () => container.querySelector('select') as HTMLSelectElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    bind(container, null);
  });

  test('applies value after options exist on initial mount', () => {
    bind(container, view({ value: 'b' }));
    expect(select().value).toBe('b');
    expect(select().selectedIndex).toBe(1);
  });

  test('applies selectedIndex after options exist on initial mount', () => {
    bind(container, view({ selectedIndex: 2 }));
    expect(select().selectedIndex).toBe(2);
    expect(select().value).toBe('c');
  });

  test('value takes precedence over an option selected attribute', () => {
    bind(container, elem('select', { value: 'b' },
      elem('option', { value: 'a', selected: true }, 'A'),
      elem('option', { value: 'b' }, 'B')
    ));
    expect(select().value).toBe('b');
    expect(select().selectedIndex).toBe(1);
  });

  test('selectedIndex takes precedence when both controls are supplied', () => {
    bind(container, view({ value: 'c', selectedIndex: 1 }));
    expect(select().selectedIndex).toBe(1);
    expect(select().value).toBe('b');
    bind(container, view({ value: 'a', selectedIndex: 2 }));
    expect(select().selectedIndex).toBe(2);
    expect(select().value).toBe('c');
  });

  test('selectedIndex 0 selects the first option', () => {
    bind(container, view({ selectedIndex: 0 }));
    expect(select().selectedIndex).toBe(0);
    expect(select().value).toBe('a');
  });

  test('selectedIndex -1 clears and maintains no selection', () => {
    bind(container, view({ selectedIndex: -1 }));
    expect(select().selectedIndex).toBe(-1);
    expect(select().value).toBe('');
    select().selectedIndex = 1;
    bind(container, view({ selectedIndex: -1 }));
    expect(select().selectedIndex).toBe(-1);
    expect(select().value).toBe('');
  });

  test('explicit value null clears the selection', () => {
    bind(container, view({ value: 'b' }));
    bind(container, view({ value: null }));
    expect(select().selectedIndex).toBe(-1);
    expect(select().value).toBe('');
  });

  test('empty-string value selects an actual empty-value option', () => {
    bind(container, view({ value: '' }, ['a', '', 'b']));
    expect(select().selectedIndex).toBe(1);
    expect(select().value).toBe('');
    select().selectedIndex = -1;
    bind(container, view({ value: '' }, ['a', '', 'b']));
    expect(select().selectedIndex).toBe(1);
  });

  test('unmatched controlled value produces no selection', () => {
    bind(container, view({ value: 'missing' }));
    expect(select().selectedIndex).toBe(-1);
    expect(select().value).toBe('');
  });

  test('a value becomes selectable when a matching option is added', () => {
    bind(container, view({ value: 'b' }, []));
    expect(select().selectedIndex).toBe(-1);
    bind(container, view({ value: 'b' }, ['a', 'b']));
    expect(select().value).toBe('b');
    expect(select().selectedIndex).toBe(1);
  });

  test('an unchanged controlled value restores a user-modified selection', () => {
    bind(container, view({ value: 'b' }));
    const original = select();
    original.value = 'a';
    bind(container, view({ value: 'b' }));
    expect(select()).toBe(original);
    expect(original.value).toBe('b');
    expect(original.selectedIndex).toBe(1);
  });

  test('an unchanged selectedIndex restores a user-modified selection', () => {
    bind(container, view({ selectedIndex: 2 }));
    select().selectedIndex = 0;
    bind(container, view({ selectedIndex: 2 }));
    expect(select().selectedIndex).toBe(2);
    expect(select().value).toBe('c');
  });

  test('controlled value survives option insertion and reordering', () => {
    bind(container, view({ value: 'b' }, ['a', 'b']));
    const original = select();
    bind(container, view({ value: 'b' }, ['c', 'a', 'b']));
    expect(select()).toBe(original);
    expect(select().value).toBe('b');
    expect(select().selectedIndex).toBe(2);
    bind(container, view({ value: 'b' }, ['b', 'c', 'a']));
    expect(select().value).toBe('b');
    expect(select().selectedIndex).toBe(0);
  });

  test('controlled selectedIndex follows option positions after changes', () => {
    bind(container, view({ selectedIndex: 1 }, ['a', 'b']));
    expect(select().value).toBe('b');
    bind(container, view({ selectedIndex: 1 }, ['c', 'a', 'b']));
    expect(select().selectedIndex).toBe(1);
    expect(select().value).toBe('a');
  });

  test('an uncontrolled select preserves user selection on an unchanged update', () => {
    bind(container, view());
    const original = select();
    original.value = 'c';
    bind(container, view());
    expect(select()).toBe(original);
    expect(original.value).toBe('c');
  });

  test('omitting a previously controlled value leaves selection to the browser', () => {
    bind(container, view({ value: 'b' }));
    select().value = 'c';
    bind(container, view());
    expect(select().value).toBe('c');
  });

  test('$diff respects attribute updates on a controlled select', () => {
    bind(container, view({ value: 'b' }));
    expect(select().value).toBe('b');
    bind(container, view({ value: 'c', $diff: diff.nodes }));
    expect(select().value).toBe('b');
    bind(container, view({ value: 'c', $diff: diff.self }));
    expect(select().value).toBe('c');
    bind(container, view({ value: 'a', $diff: diff.none }));
    expect(select().value).toBe('c');
    bind(container, view({ value: 'a', $diff: diff.all }));
    expect(select().value).toBe('a');
  });

  test('selectedIndex is not written as an HTML attribute', () => {
    bind(container, view({ selectedIndex: 1 }));
    expect(select().hasAttribute('selectedIndex')).toBe(false);
    expect(select().selectedIndex).toBe(1);
  });

  test('numeric values are converted to strings', () => {
    bind(container, view({ value: 2 }, ['1', '2', '3']));
    expect(select().value).toBe('2');
    expect(select().selectedIndex).toBe(1);
  });

  test('out-of-range selectedIndex leaves no selection', () => {
    bind(container, view({ selectedIndex: 10 }, ['a', 'b']));
    expect(select().selectedIndex).toBe(-1);
    expect(select().value).toBe('');
  });

  test('null selectedIndex does not force a selection', () => {
    bind(container, view({ selectedIndex: 1 }));
    select().selectedIndex = 2;

    bind(container, view({ selectedIndex: null }));
    expect(select().selectedIndex).toBe(2);
  });

  test('null value clears selection even if an empty-valued option exists', () => {
    bind(container, view({ value: '' }, ['a', '', 'b']));
    expect(select().selectedIndex).toBe(1);

    bind(container, view({ value: null }, ['a', '', 'b']));
    expect(select().selectedIndex).toBe(-1);
  });

  test('an uncontrolled select respects an initially selected option', () => {
    bind(container, elem('select',
      elem('option', { value: 'a' }, 'A'),
      elem('option', { value: 'b', selected: true }, 'B')
    ));
    expect(select().selectedIndex).toBe(1);
    expect(select().value).toBe('b');
  });

  test('preserves select value when options change', () => {
    const container = document.createElement('div');
    const render = (items: string[]) =>
      elem('select', { value: 'b' },
        items.map(value =>
          elem('option', { value }, value)
        )
    );
    bind(container, render(['a', 'b']));
    const select = container.querySelector('select')!;
    expect(select.value).toBe('b');
    bind(container, render(['c', 'a', 'b']));
    expect(select.value).toBe('b');
    select.value = 'a';
    bind(container, render(['b', 'c', 'a']));
    expect(select.value).toBe('b');
  });

  test('treats an explicitly undefined select value as uncontrolled', () => {
    const container = document.createElement('div');
    const render = (value?: string) =>
        elem('select', { value },
            elem('option', { value: 'a' }, 'A'),
            elem('option', { value: 'b' }, 'B')
        );
    bind(container, render(undefined));
    const select = container.querySelector('select')!;
    expect(select.value).toBe('a');
    select.value = 'b';
    bind(container, render(undefined));
    expect(select.value).toBe('b');
  });

  test('relinquishes control when select value becomes undefined', () => {
    const container = document.createElement('div');
    const render = (value?: string) =>
      elem('select', { value },
        elem('option', { value: 'a' }, 'A'),
        elem('option', { value: 'b' }, 'B')
    );
    bind(container, render('b'));
    const select = container.querySelector('select')!;
    expect(select.value).toBe('b');
    bind(container, render(undefined));
    expect(select.value).toBe('b');
    select.value = 'a';
    bind(container, render(undefined));
    expect(select.value).toBe('a');
    // Explicitly controlling it again restores the requested value.
    bind(container, render('b'));
    expect(select.value).toBe('b');
  });
});

// Explicitly supplied values are controlled; omitted or undefined values
// let the browser keep its current state.
describe('controlled and uncontrolled form properties', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    bind(container, null);
  });

  for (const tag of ['input', 'textarea']) {
    const field = () => container.querySelector(tag) as HTMLInputElement | HTMLTextAreaElement;
    test(`${tag}: unchanged controlled value restores a user edit`, () => {
      bind(container, elem(tag, { value: 'initial' }));
      const original = field();
      original.value = 'user typed';
      bind(container, elem(tag, { value: 'initial' }));
      expect(field()).toBe(original);
      expect(original.value).toBe('initial');
    });

    test(`${tag}: changed controlled value updates the existing element`, () => {
      bind(container, elem(tag, { value: 'first' }));
      const original = field();
      original.value = 'user typed';
      bind(container, elem(tag, { value: 'second' }));
      expect(field()).toBe(original);
      expect(original.value).toBe('second');
    });

    test(`${tag}: an omitted value stays browser-managed`, () => {
      bind(container, elem(tag));
      const original = field();
      original.value = 'user typed';
      bind(container, elem(tag));
      expect(field()).toBe(original);
      expect(original.value).toBe('user typed');
    });

    test(`${tag}: value undefined stays browser-managed`, () => {
      bind(container, elem(tag, { value: undefined }));
      const original = field();
      original.value = 'user typed';
      bind(container, elem(tag, { value: undefined }));
      expect(field()).toBe(original);
      expect(original.value).toBe('user typed');
    });

    test(`${tag}: changing from controlled to undefined releases control`, () => {
      bind(container, elem(tag, { value: 'initial' }));
      const original = field();
      original.value = 'user typed';
      bind(container, elem(tag, { value: undefined }));
      expect(original.value).toBe('user typed');
      bind(container, elem(tag, { value: undefined }));
      expect(original.value).toBe('user typed');
      bind(container, elem(tag, { value: 'restored' }));
      expect(original.value).toBe('restored');
    });

    test(`${tag}: a numeric controlled value is compared as text`, () => {
      bind(container, elem(tag, { value: 42 }));
      const original = field();
      expect(original.value).toBe('42');
      original.value = '4';
      bind(container, elem(tag, { value: 42 }));
      expect(original.value).toBe('42');
    });
  }

  test('input: matching live value does not reset the text selection', () => {
    bind(container, elem('input', { value: '12345' }));
    const input = container.querySelector('input')!;
    input.setSelectionRange(2, 2);
    bind(container, elem('input', { value: 12345 }));
    expect(input.value).toBe('12345');
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);
  });

  test('file inputs ignore nonempty controlled values', () => {
    expect(() => bind(container, elem('input', {
      type: 'file', value: 'not-a-file'
    }))).not.toThrow();
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('');
    bind(container, elem('input', { type: 'file', value: '' }));
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('');
  });

  test('oninput updates application state before automatic redraw', () => {
    let name = 'initial';
    const Input = compDef({
      draw: () => elem('input', {
        value: name,
        oninput: (event: Event) => {
          name = (event.currentTarget as HTMLInputElement).value;
        }
      })
    });
    bind(container, comp(Input));
    const input = container.querySelector('input')!;
    input.value = 'edited';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    sync();
    expect(name).toBe('edited');
    expect(input.value).toBe('edited');
    expect(container.querySelector('input')).toBe(input);
  });

  test('$diff nodes and none skip controlled value updates', () => {
    bind(container, elem('input', { value: 'first' }));
    const input = container.querySelector('input')!;
    input.value = 'user typed';

    bind(container, elem('input', { value: 'first', $diff: diff.nodes }));
    expect(input.value).toBe('user typed');
    bind(container, elem('input', { value: 'first', $diff: diff.none }));
    expect(input.value).toBe('user typed');
    bind(container, elem('input', { value: 'first', $diff: diff.self }));
    expect(input.value).toBe('first');
  });

  test('switching from a controlled value to an omitted value releases control', () => {
    bind(container, elem('input', { value: 'initial' }));
    const input = container.querySelector('input')!;
    input.value = 'edited';
    bind(container, elem('input'));
    expect(input.value).toBe('edited');
    input.value = 'edited again';
    bind(container, elem('input'));
    expect(input.value).toBe('edited again');
  });

  test('false checked is restored after user interaction', () => {
    bind(container, elem('input', { type: 'checkbox', checked: false }));
    const input = container.querySelector('input')!;
    input.click();
    expect(input.checked).toBe(true);
    bind(container, elem('input', { type: 'checkbox', checked: false }));
    expect(input.checked).toBe(false);
  });

  test('option explicitly retains empty value when text is nonempty', () => {
    const view = (label: string) => elem('select', { value: '' },
      elem('option', { value: '' }, label),
      elem('option', { value: 'b' }, 'B')
    );
    bind(container, view('Empty'));
    const select = container.querySelector('select')!;
    const option = select.options[0];
    expect(option.getAttribute('value')).toBe('');
    expect(option.value).toBe('');
    expect(select.selectedIndex).toBe(0);
    bind(container, view('Renamed'));
    expect(option.value).toBe('');
    expect(select.selectedIndex).toBe(0);
  });

  test('checkbox and radio checked values correct user-modified state', () => {
    for (const type of ['checkbox', 'radio']) {
      bind(container, elem('input', { type, checked: true }));
      const input = container.querySelector('input')!;
      expect(input.checked).toBe(true);
      input.checked = false;
      bind(container, elem('input', { type, checked: true }));
      expect(input.checked).toBe(true);
      bind(container, elem('input', { type, checked: false }));
      expect(input.checked).toBe(false);
      bind(container, null);
    }
  });

  test('option selected is reconciled against its live DOM property', () => {
    const view = (selected: boolean) => elem('select', { multiple: true },
      elem('option', { value: 'a', selected }, 'A'),
      elem('option', { value: 'b' }, 'B')
    );
    bind(container, view(true));
    const option = container.querySelector('option')!;
    option.selected = false;
    bind(container, view(true));
    expect(option.selected).toBe(true);
    bind(container, view(false));
    expect(option.selected).toBe(false);
  });

  test('same-reference style mutations still update after the early exit', () => {
    const style = { color: 'red' };
    const view = () => elem('div', { style });
    bind(container, view());
    const div = container.querySelector('div')!;
    style.color = 'blue';
    bind(container, view());
    expect(div.style.color).toBe('blue');
  });

  test('unchanged event handlers still work after an early-exit update', () => {
    let calls = 0;
    const onclick = () => { calls++; };
    const view = () => elem('button', { onclick }, 'Click');
    bind(container, view());
    const button = container.querySelector('button')!;
    button.click();
    bind(container, view());
    button.click();
    expect(calls).toBe(2);
  });
});