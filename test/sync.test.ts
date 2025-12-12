import { describe, test, expect } from 'vitest';
import {
  elem,
  text,
  comp,
  mount,
  sync
} from '../src/index';

describe('sync()', () => {

  test('batches multiple draw() calls into single update', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    let drawCount = 0;
    const compDef = {
      draw: () => {
        drawCount++;
        return elem('div'); // ← wrap in text()
      }
    };
    const vnode = comp(compDef);
    mount(app, vnode);
    expect(drawCount).toBe(1);
    vnode.draw();
    vnode.draw();
    vnode.draw();
    sync(); // All three should batch
    expect(drawCount).toBe(2); // Only one additional draw
  });

  test('sync() can be called multiple times safely', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => elem('div', text('test'))
    };
    const vnode = comp(compDef);
    mount(app, vnode);
    vnode.draw();
    sync();
    sync();
    sync();
    expect(app.textContent).toBe('test');
  });

  /*
  test('event handlers schedule async updates', () => {
  let count = 0;
  const compDef = {
    draw: () => elem('button', { 
      onclick: () => count++ 
    }, `Count: ${count}`)
  };
  mount(app, comp(compDef));
  
  const button = app.querySelector('button');
  button.click();
  expect(app.textContent).toBe('Count: 0'); // Not updated yet
  sync();
  expect(app.textContent).toBe('Count: 1'); // Now updated
});

test('e.redraw = false prevents scheduled update', () => {
  let count = 0;
  const compDef = {
    draw: () => elem('button', {
      onclick: (e) => {
        count++;
        e.redraw = false;
      }
    }, `Count: ${count}`)
  };
  mount(app, comp(compDef));
  
  app.querySelector('button').click();
  sync();
  expect(app.textContent).toBe('Count: 0'); // Should not update
});

test('nested component updates batch together', () => {
  const child = comp({ draw: () => elem('span', 'child') });
  const parent = comp({ draw: () => elem('div', child) });
  mount(app, parent);
  
  parent.draw();
  child.draw();
  sync();
  // Should only run one batch, not two separate updates
});

test('scheduled updates ignored after unmount', () => {
  const vnode = comp({ draw: () => elem('div', 'test') });
  mount(app, vnode);
  
  vnode.draw(); // Schedule update
  mount(app, null); // Unmount before sync
  sync(); // Should not error
  expect(app.innerHTML).toBe('');
});
*/
  
});