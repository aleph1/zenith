import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  text,
  comp,
  mount,
  sync,
} from '../src/index';

describe('Component Memoization', () => {
  
  test('comp() without memo always redraws', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: vi.fn(vNode => text(vNode.attrs.value))
    };
    const node1 = comp(compDef, { value: 1 });
    mount(app, node1);
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1');
    const node2 = comp(compDef, { value: 1 });
    mount(app, node2);
    sync();
    expect(compDef.draw).toHaveBeenCalledTimes(2);
    expect(app.textContent).toBe('1');
  });

  test('comp() with memo=true skips redraw when attrs are the same object', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      memo: true,
      draw: vi.fn(vNode => text(vNode.attrs.value))
    };
    const attrs = { value: 1 };
    const node1 = comp(compDef, attrs);
    mount(app, node1);
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1');
    const node2 = comp(compDef, attrs);
    mount(app, node2);
    sync();
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1');
  });

  test('comp() with memo=true skips redraw when attrs are shallowly equal', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      memo: true,
      draw: vi.fn(vNode => text(vNode.attrs.value + ' ' + vNode.attrs.name))
    };
    const node1 = comp(compDef, { value: 1, name: 'test' });
    mount(app, node1);
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1 test');
    const node2 = comp(compDef, { value: 1, name: 'test' });
    mount(app, node2);
    sync();
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1 test');
  });

  test('comp() with memo=true redraws when attrs change', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let drawCount = 0;
    const draw = vi.fn(_vNode => text(++drawCount));
    const compDef = {
      memo: true,
      draw
    };
    
    const node1 = comp(compDef, { value: 1 });
    mount(app, node1);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(drawCount).toBe(1);
    expect(app.textContent).toBe('1');
    
    // Redraw with different attrs - should redraw
    const node2 = comp(compDef, { value: 2 });
    mount(app, node2);
    sync();
    expect(draw).toHaveBeenCalledTimes(2);
    expect(drawCount).toBe(2);
    expect(app.textContent).toBe('2');
  });

  test('comp() with memo=true redraws when attr is added', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let drawCount = 0;
    const draw = vi.fn(_vNode => text(++drawCount));
    const compDef = {
      memo: true,
      draw
    };
    const node1 = comp(compDef, { value: 1 });
    mount(app, node1);
    expect(drawCount).toBe(1);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(app.textContent).toBe('1');
    
    // Add new attr - should redraw
    const node2 = comp(compDef, { value: 1, extra: 'new' });
    mount(app, node2);
    sync();
    expect(drawCount).toBe(2);
    expect(draw).toHaveBeenCalledTimes(2);
    expect(app.textContent).toBe('2');
  });

  test('comp() with memo=true redraws when attr is removed', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let drawCount = 0;
    const draw = vi.fn(_vNode => text(++drawCount));
    const compDef = {
      memo: true,
      draw
    };
    const node1 = comp(compDef, { value: 1, extra: 'old' });
    mount(app, node1);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(drawCount).toBe(1);
    expect(app.textContent).toBe('1');
    // Remove attr - should redraw
    const node2 = comp(compDef, { value: 1 });
    mount(app, node2);
    sync();
    expect(draw).toHaveBeenCalledTimes(2);
    expect(drawCount).toBe(2);
    expect(app.textContent).toBe('2');
  });

  test('comp() with custom memo function uses it for comparison', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    const compDef = {
      memo: (newAttrs, oldAttrs) => {
        // Only compare 'value' property
        return newAttrs.value === oldAttrs.value;
      },
      draw: vi.fn(vNode => text(`${vNode.attrs.value}`))
    };
    
    const node1 = comp(compDef, { value: 1, other: 'a' });
    mount(app, node1);
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    
    // Change 'other' but not 'value' - should NOT redraw
    const node2 = comp(compDef, { value: 1, other: 'b' });
    mount(app, node2);
    sync();
    expect(compDef.draw).toHaveBeenCalledTimes(1);
    
    // Change 'value' - should redraw
    const node3 = comp(compDef, { value: 2, other: 'b' });
    mount(app, node3);
    sync();
    expect(compDef.draw).toHaveBeenCalledTimes(2);
  });

  test('comp() with custom memo function that returns false always redraws', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let drawCount = 0;
    const compDef = {
      memo: () => false, // Always redraw
      draw: vNode => {
        drawCount++;
        return text(`draw ${drawCount}`);
      }
    };
    
    const node1 = comp(compDef, { value: 1 });
    mount(app, node1);
    expect(drawCount).toBe(1);
    
    // Same attrs but memo returns false - should redraw
    const node2 = comp(compDef, { value: 1 });
    mount(app, node2);
    sync();
    expect(drawCount).toBe(2);
  });

  test('comp() with memo=true and object reference changes redraws', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let drawCount = 0;
    const compDef = {
      memo: true,
      draw: vNode => {
        drawCount++;
        return text('test');
      }
    };
    
    const obj1 = { nested: 'value' };
    const node1 = comp(compDef, { data: obj1 });
    mount(app, node1);
    expect(drawCount).toBe(1);
    
    // Same object reference - should NOT redraw
    const node2 = comp(compDef, { data: obj1 });
    mount(app, node2);
    sync();
    expect(drawCount).toBe(1);
    
    // Different object (even with same content) - should redraw
    const obj2 = { nested: 'value' };
    const node3 = comp(compDef, { data: obj2 });
    mount(app, node3);
    sync();
    expect(drawCount).toBe(2);
  });

  test('comp() with memo=true and no attrs', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let drawCount = 0;
    const compDef = {
      memo: true,
      draw: vNode => {
        drawCount++;
        return text('test');
      }
    };
    
    const node1 = comp(compDef);
    mount(app, node1);
    expect(drawCount).toBe(1);
    
    // Both with no attrs - should NOT redraw
    const node2 = comp(compDef);
    mount(app, node2);
    sync();
    expect(drawCount).toBe(1);
  });

  test('comp() with nested components and memoization', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    
    let childDrawCount = 0;
    let parentDrawCount = 0;
    
    const childDef = {
      memo: true,
      draw: vNode => {
        childDrawCount++;
        return text(`child ${vNode.attrs.value}`);
      }
    };
    
    const parentDef = {
      memo: true,
      draw: vNode => {
        parentDrawCount++;
        return elem('div', comp(childDef, { value: vNode.attrs.childValue }));
      }
    };
    
    const node1 = comp(parentDef, { childValue: 1 });
    mount(app, node1);
    expect(parentDrawCount).toBe(1);
    expect(childDrawCount).toBe(1);
    
    // Same attrs - neither should redraw
    const node2 = comp(parentDef, { childValue: 1 });
    mount(app, node2);
    sync();
    expect(parentDrawCount).toBe(1);
    expect(childDrawCount).toBe(1);
    
    // Change child value - both should redraw
    const node3 = comp(parentDef, { childValue: 2 });
    mount(app, node3);
    sync();
    expect(parentDrawCount).toBe(2);
    expect(childDrawCount).toBe(2);
  });
});