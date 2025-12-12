import { describe, test, expect } from 'vitest';
import { elem, comp, mount, sync } from '../src/index';
import { VNODE_ELEM, VNODE_COMP } from '../src/vNode.defs';

// Helper for deferred promises
const generateDeferredPromise = () => {
  let resolveFn, rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return {
    promise,
    resolve: resolveFn,
    reject: rejectFn
  };
};

describe('Null filtering and deferred removal', () => {
  
  describe('Null filtering in normalizeChildren', () => {
    test('Filters nulls mixed with elements', () => {
      const node = elem('div', null, elem('span'), null);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toBe('span');
    });

    test('Filters nulls mixed with elements in array', () => {
      const node = elem('div', [null, elem('span'), null, elem('p'), undefined]);
      expect(node.children.length).toBe(2);
      expect(node.children[0].tag).toBe('span');
      expect(node.children[1].tag).toBe('p');
    });

    test('Filters booleans mixed with elements', () => {
      const node = elem('div', false, elem('span'), true, elem('p'));
      expect(node.children.length).toBe(2);
      expect(node.children[0].tag).toBe('span');
      expect(node.children[1].tag).toBe('p');
    });

    test('Filters mixed nullish values with elements', () => {
      const node = elem('div', [null, elem('span'), undefined, false, elem('p'), true]);
      expect(node.children.length).toBe(2);
      expect(node.children[0].tag).toBe('span');
      expect(node.children[1].tag).toBe('p');
    });
  });

  describe('Component draw returning null/undefined', () => {
    test('comp() draw returns null', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: () => null
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(0);
    });

    test('comp() draw returns undefined', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: () => undefined
      };
      const vNode = comp(compDef);
      mount(app, vNode);
      expect(vNode.children.length).toBe(0);
    });

    test('comp() draw returns array of null', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: () => [null]
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(0);
    });

    test('comp() draw returns array of undefined', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: () => [undefined]
      };
      const vNode = comp(compDef);
      mount(app, vNode);
      expect(vNode.children.length).toBe(0);
    });
  });

  describe('Non-keyed deferred removal', () => {
    

    test('Non-keyed array remount with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', {id: 'test1'});
      const node2 = elem('div', {id: 'test2'});
      const node3 = elem('div', {id: 'test3'});
      
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toBe(2);
      expect(mountedNode.children[0].dom.id).toBe('test1');
      expect(mountedNode.children[1].dom.id).toBe('test2');
      
      mountedNode = mount(app, [node2, node3]);
      expect(mountedNode.children.length).toBe(2);
      expect(mountedNode.children[0].dom.id).toBe('test2');
      expect(mountedNode.children[1].dom.id).toBe('test3');
    });
  });

  describe('Keyed deferred removal', () => {
    test.only('Keyed component with $remove stays in position during deferred removal', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const items = [
        { id: 1, name: 'Alice', deleted: false },
        { id: 2, name: 'Bob', deleted: false },
        { id: 3, name: 'Carol', deleted: false }
      ];
      
      const deferredPromises = new Map();
      
      const itemDef = {
        draw: vNode => elem('div', { id: vNode.attrs.name }),
        remove: vNode => {
          console.log('remove() called for:', vNode.attrs.name);
          const promise = generateDeferredPromise();
          deferredPromises.set(vNode.attrs.id, promise);
          return promise.promise;
        }
      };
      
      const listDef = {
        draw: vNode => {
          console.log('listDef.draw() - items:', vNode.attrs.items.map(i => `${i.name}(deleted:${i.deleted})`));
          return vNode.attrs.items
            .map(item => comp(itemDef, { ...item, key: item.id, $remove: item.deleted }));
        }
      };
      
      const node = comp(listDef, { items });
      mount(app, node);
      console.log('After mount - children:', node.children.length);
      expect(node.children.length).toBe(3);
      
      // Mark middle item as deleted
      items[1].deleted = true;
      console.log('Calling node.draw() after setting deleted=true');
      node.draw();
      sync();
      
      console.log('After sync - children:', node.children.length);
      console.log('Children IDs:', node.children.map(c => c.children[0].dom.id));
      
      // Should have 3 children with Bob still at position 1 (deferred)
      expect(node.children.length).toBe(3);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Bob');
      expect(node.children[2].children[0].dom.id).toBe('Carol');
      
      // Resolve Bob's removal
      console.log('Resolving promise for Bob');
      await deferredPromises.get(2).resolve();
      await Promise.resolve();
      sync();
      
      console.log('After promise resolution - children:', node.children.length);
      console.log('Children IDs:', node.children.map(c => c.children[0].dom.id));
      
      // Now should have 2 children
      expect(node.children.length).toBe(2);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Carol');
    });

    test('Keyed component with $remove at beginning stays in position', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const items = [
        { id: 1, name: 'Alice', deleted: false },
        { id: 2, name: 'Bob', deleted: false },
        { id: 3, name: 'Carol', deleted: false }
      ];
      
      const deferredPromise = generateDeferredPromise();
      
      const itemDef = {
        draw: vNode => elem('div', { id: vNode.attrs.name }),
        remove: () => deferredPromise.promise
      };
      
      const listDef = {
        draw: vNode => vNode.attrs.items
          .map(item => comp(itemDef, { key: item.id, $remove: item.deleted, ...item }))
      };
      
      const node = comp(listDef, { items });
      mount(app, node);
      expect(node.children.length).toBe(3);
      
      // Remove first item
      items[0].deleted = true;
      node.draw();
      sync();
      
      // Alice stays at position 0 during deferred removal
      expect(node.children.length).toBe(3);
      expect(node.children[0].children[0].dom.id).toBe('Alice'); // Still at position 0
      expect(node.children[1].children[0].dom.id).toBe('Bob');
      expect(node.children[2].children[0].dom.id).toBe('Carol');
      
      await deferredPromise.resolve();
      
      expect(node.children.length).toBe(2);
      expect(node.children[0].children[0].dom.id).toBe('Bob');
      expect(node.children[1].children[0].dom.id).toBe('Carol');
    });

    test('Keyed list with new items added while $remove deferred', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const items = [
        { id: 1, name: 'Alice', deleted: false },
        { id: 2, name: 'Bob', deleted: false }
      ];
      
      const deferredPromise = generateDeferredPromise();
      
      const itemDef = {
        draw: vNode => elem('div', { id: vNode.attrs.name }),
        remove: vNode => vNode.attrs.id === 2 ? deferredPromise.promise : undefined
      };
      
      const listDef = {
        draw: vNode => vNode.attrs.items
          .map(item => comp(itemDef, { key: item.id, $remove: item.deleted, ...item }))
      };
      
      const node = comp(listDef, { items });
      mount(app, node);
      expect(node.children.length).toBe(2);
      
      // Remove Bob, add Carol
      items[1].deleted = true;
      items.push({ id: 3, name: 'Carol', deleted: false });
      node.draw();
      sync();
      
      // Should have Alice, Bob (deferred at position 1), Carol
      expect(node.children.length).toBe(3);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Bob'); // Stays at position 1
      expect(node.children[2].children[0].dom.id).toBe('Carol');
      
      await deferredPromise.resolve();
      
      expect(node.children.length).toBe(2);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Carol');
    });

    test('Multiple keyed items with $remove stay in positions', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const items = [
        { id: 1, name: 'Alice', deleted: false },
        { id: 2, name: 'Bob', deleted: false },
        { id: 3, name: 'Carol', deleted: false },
        { id: 4, name: 'Dave', deleted: false }
      ];
      
      const deferredPromises = new Map();
      
      const itemDef = {
        draw: vNode => elem('div', { id: vNode.attrs.name }),
        remove: vNode => {
          const promise = generateDeferredPromise();
          deferredPromises.set(vNode.attrs.id, promise);
          return promise.promise;
        }
      };
      
      const listDef = {
        draw: vNode => vNode.attrs.items
          .map(item => comp(itemDef, { key: item.id, $remove: item.deleted, ...item }))
      };
      
      const node = comp(listDef, { items });
      mount(app, node);
      expect(node.children.length).toBe(4);
      
      // Remove Bob and Dave
      items[1].deleted = true;
      items[3].deleted = true;
      node.draw();
      sync();
      
      // All 4 should still be present at their original positions
      expect(node.children.length).toBe(4);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Bob'); // Position 1
      expect(node.children[2].children[0].dom.id).toBe('Carol');
      expect(node.children[3].children[0].dom.id).toBe('Dave'); // Position 3
      
      // Resolve Bob's removal
      await deferredPromises.get(2).resolve();
      
      expect(node.children.length).toBe(3);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Carol');
      expect(node.children[2].children[0].dom.id).toBe('Dave');
      
      // Resolve Dave's removal
      await deferredPromises.get(4).resolve();
      
      expect(node.children.length).toBe(2);
      expect(node.children[0].children[0].dom.id).toBe('Alice');
      expect(node.children[1].children[0].dom.id).toBe('Carol');
    });
  });

  describe('Conditional rendering with nulls', () => {
    test('Conditional rendering with &&', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      
      const componentDef = {
        draw: vNode => [
          elem('div', { id: 'always' }),
          vNode.attrs.showMiddle && elem('div', { id: 'middle' }),
          elem('div', { id: 'end' })
        ]
      };
      
      const node = comp(componentDef, { showMiddle: false });
      mount(app, node);
      
      expect(node.children.length).toBe(2);
      expect(node.children[0].dom.id).toBe('always');
      expect(node.children[1].dom.id).toBe('end');
      
      // Show middle
      node.attrs = { showMiddle: true };
      node.draw();
      sync();
      
      expect(node.children.length).toBe(3);
      expect(node.children[0].dom.id).toBe('always');
      expect(node.children[1].dom.id).toBe('middle');
      expect(node.children[2].dom.id).toBe('end');
    });

    test('Multiple conditional renders', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      
      const componentDef = {
        draw: vNode => [
          vNode.attrs.showA && elem('div', { id: 'a' }),
          vNode.attrs.showB && elem('div', { id: 'b' }),
          vNode.attrs.showC && elem('div', { id: 'c' })
        ]
      };
      
      // None showing
      let node = comp(componentDef, { showA: false, showB: false, showC: false });
      mount(app, node);
      expect(node.children.length).toBe(0);
      
      // Show B only
      node.attrs = { showA: false, showB: true, showC: false };
      node.draw();
      sync();
      expect(node.children.length).toBe(1);
      expect(node.children[0].dom.id).toBe('b');
      
      // Show all
      node.attrs = { showA: true, showB: true, showC: true };
      node.draw();
      sync();
      expect(node.children.length).toBe(3);
      expect(node.children[0].dom.id).toBe('a');
      expect(node.children[1].dom.id).toBe('b');
      expect(node.children[2].dom.id).toBe('c');
    });
  });
});