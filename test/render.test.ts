import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  text,
  //html,
  node,
  comp,
  mount,
  sync,
} from '../src/index';
import {
  VNodeComp,
  //VNodeFlatArray,
} from '../src/vNode.defs';

// vitest’s handling of promises with setTimeout is not functional,
// so we create a deferred promise and simulate the setTimeout
// using vitest.advanceTimersByTime outside of the promise
function generateDeferredPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    [resolve, reject] = [res, rej];
  });
  return {promise, reject, resolve};
}

// TESTS TO ADD
// - elem with children has children reapplied in different order
// - comp where order of elems changes by mistake
// - comp where draw returns elem that requires different parent (<tr>, <tbody>)

describe('render', () => {

  describe('Basic', () => {

    test('elem() with string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', text('test'));
      mount(app, node1);
      expect(node1.dom.textContent).toEqual('test');
    });

    test('elem() with number', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', text(123));
      mount(app, node1);
      expect(node1.dom.textContent).toEqual('123');
    });

    // comp with nested comp
  });

  describe('Updating', () => {

    test('DOM is reused if possible', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', {id: 'test1'});
      const node2 = elem('div', {id: 'test2'});
      mount(app, node1);
      mount(app, node2);
      expect(node1.dom).toEqual(node2.dom);
    });

    test('DOM is not reused when nodeName is different', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', {id: 'test1'});
      const node2 = elem('p', {id: 'test2'});
      mount(app, node1);
      mount(app, node2);
      expect(node1.dom).not.toEqual(node2.dom);
    });

    test('array of elem() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', {id: 'test1'});
      const node2 = elem('div', {id: 'test2'});
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toBeNullish();
      expect(node2.dom).toBeNullish();
      mountedNode = mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].dom).toEqual(elem1);
    });

    test('array of elem() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', {id: 'test1'});
      const node2 = elem('div', {id: 'test2'});
      const node3 = elem('div', {id: 'test3'});
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      const elem3 = document.createElement('div');
      elem3.id = 'test3';
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].dom).toEqual(elem3);
    });

    test('array of text() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = text('test1');
      const node2 = text('test2');
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createTextNode('test2');
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toBeNullish();
      expect(node2.dom).toBeNullish();
      mountedNode = mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].dom).toEqual(elem1);
    });

    test('array of text() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = text('test1');
      const node2 = text('test2');
      const node3 = text('test3');
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createTextNode('test2');
      const elem3 = document.createTextNode('test3');
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].dom).toEqual(elem3);
    });

    test('array of comp() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef, {
        text: 'test1'
      });
      const node2 = comp(compDef, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      const text1 = document.createTextNode('test1');
      const text2 = document.createTextNode('test2');
      elem1.append(text1);
      elem2.append(text2);
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem2);
      mountedNode = mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toBeNullish();
      expect(node2.dom).toBeNullish();
      mountedNode = mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem1);
    });

    test('array of comp() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef, {
        text: 'test1'
      });
      const node2 = comp(compDef, {
        text: 'test2'
      });
      const node3 = comp(compDef, {
        text: 'test3'
      });
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      const elem3 = document.createElement('div');
      const text1 = document.createTextNode('test1');
      const text2 = document.createTextNode('test2');
      const text3 = document.createTextNode('test3');
      elem1.append(text1);
      elem2.append(text2);
      elem3.append(text3);
      let mountedNode = mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem2);
      mountedNode = mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem3);
    });

    // fails due to 
    //TypeError: Converting circular structure to JSON

    test('comp() with single elem(), drawn deffered with single text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'elem';
      const node1 = elem('div');
      const node2 = text('test');
      const compDef = {
        draw: () => childType === 'elem' ? node1 : node2
      };
      const node3 = comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      childType = 'text';
      node3.draw();
      sync();
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('comp() with single elem(), drawn immediately with single text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'elem';
      const node1 = elem('div');
      const node2 = text('test');
      const compDef = {
        draw: () => childType === 'elem' ? node1 : node2
      };
      const node3 = comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      childType = 'text';
      node3.draw();
      sync();
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('comp() with single text(), drawn deffered with single elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'text';
      const node1 = text('test');
      const node2 = elem('div');
      const compDef = {
        draw: vNode => childType === 'text' ? node1 : node2
      };
      const node3 = comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
      childType = 'elem';
      node3.draw();
      sync();
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
    });

    test('comp() with single text(), drawn immediately with single elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'text';
      const node1 = text('test');
      const node2 = elem('div');
      const compDef = {
        draw: vNode => childType === 'text' ? node1 : node2
      };
      const node3 = comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
      childType = 'elem';
      node3.draw();
      sync();
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
    });

    test('elem() <input> type changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('input', {
        type: 'text'
      });
      const node2 = elem('input', {
        type: 'checkbox'
      });
      const elem1 = document.createElement('input');
      elem1.type = 'text';
      const elem2 = document.createElement('input');
      elem2.type = 'checkbox';
      let mountedNode = mount(app, node1);
      expect(node1.dom).toEqual(elem1);
      mountedNode = mount(app, node2);
      expect(node2.dom).toEqual(elem2);
    });

    test('unmounting comp() works as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div')
      };
      const node = comp(compDef);
      let mountedNode = mount(app, node);
      expect(mountedNode.children.length).toBe(1);
      expect(app.childNodes.length).toBe(1);
      mount(app, null);
      expect(mountedNode.children.length).toBe(0);
      expect(app.childNodes.length).toBe(0);
      expect(node.children.length).toBe(0);
    });

    test('mounting, unmounting, and then remounting comp() works as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div')
      };
      const node = comp(compDef);
      mount(app, node);
      mount(app, null);
      mount(app, node);
      expect(app.childNodes.length).toBe(1);
      expect(node.children.length).toBe(1);
      expect(node.children[0].dom).toEqual(app.childNodes[0]);
    });

    test('mounted child changes from one compDef to a different compDef', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const compDef2 = {
        draw: vNode => elem('p', text(vNode.attrs.text))
      };
      const node1 = comp(compDef1, {
        text: 'test1'
      });
      const node2 = comp(compDef2, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('p');
      elem2.innerHTML = 'test2';
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from comp() to elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef, {
        text: 'test1'
      });
      const node2 = elem('div', text('test2'));
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from elem() to comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = elem('div', text('test1'));
      const node2 = comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from comp() to text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef, {
        text: 'test1'
      });
      const node2 = text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from text() to comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = text('test2');
      const node2 = comp(compDef, {
        text: 'test1'
      });
      const elem1 = document.createTextNode('test2');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test1';
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from elem() to text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = elem('div', text('test1'));
      const node2 = text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from text() to elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = text('test1');
      const node2 = elem('div', text('test2'));
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from one compDef to a different compDef when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'div';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const compDef2 = {
        draw: vNode => elem('p', text(vNode.attrs.text))
      };
      const compDef3 = {
        draw: vNode => comp(compType === 'div' ? compDef1 : compDef2, {
          text: vNode.attrs.text
        })
      };
      const node = comp(compDef3, {
        text: 'test'
      });
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef1);
      compType = 'p';
      node.draw();
      sync();
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef2);
    });

    test('comp() child changes from one compDef to a different compDef when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'div';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const compDef2 = {
        draw: vNode => elem('p', text(vNode.attrs.text))
      };
      const compDef3 = {
        draw: vNode => comp(compType === 'div' ? compDef1 : compDef2, {
          text: vNode.attrs.text
        })
      };
      const node = comp(compDef3, {
        text: 'test'
      });
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef1);
      compType = 'p';
      node.draw();
      sync();
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef2);
    });

    test('comp() child changes from comp() to elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'comp';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef1, {
        text: 'test1'
      });
      const node2 = elem('div', text('test2'));
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = {
        draw: vNode => compType === 'comp' ? node1 : node2
      };
      const node3 = comp(compDef2);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].children[0].dom).toEqual(elem1);
      compType = 'elem';
      node3.draw();
      sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from elem() to comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'elem';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = elem('div', text('test1'));
      const node2 = comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = {
        draw: vNode => compType === 'elem' ? node1 : node2
      };
      const node3 = comp(compDef2);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      compType = 'comp';
      node3.draw();
      sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from comp() to text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'comp';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = comp(compDef1, {
        text: 'test1'
      });
      const node2 = text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const compDef2 = {
        draw: vNode => compType === 'comp' ? node1 : node2
      };
      const node3 = comp(compDef2);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].children[0].dom).toEqual(elem1);
      compType = 'text';
      node3.draw();
      sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from text() to comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'text';
      const compDef1 = {
        draw: vNode => elem('div', text(vNode.attrs.text))
      };
      const node1 = text('test1');
      const node2 = comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = {
        draw: vNode => compType === 'text' ? node1 : node2
      };
      const node3 = comp(compDef2);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      compType = 'comp';
      node3.draw();
      sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from elem() to text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let nodeType = 'elem';
      const node1 = elem('div', text('test1'));
      const node2 = text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const compDef = {
        draw: vNode => nodeType === 'elem' ? node1 : node2
      };
      const node3 = comp(compDef);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      nodeType = 'text';
      node3.draw();
      sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('comp() child changes from text() to elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let nodeType = 'text';
      const node1 = text('test1');
      const node2 = elem('div', text('test2'));
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef = {
        draw: vNode => nodeType === 'text' ? node1 : node2
      };
      const node3 = comp(compDef);
      mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      nodeType = 'elem';
      node3.draw();
sync();
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('comp() number of children decreases when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const compDef = {
        draw: vNode => vNode.attrs.values.map(label => text(label))
      };
      const node = comp(compDef, {
        values
      });
      mount(app, node);
      expect(node.children.length).toEqual(2);
      values.pop();
      node.draw();
      sync();
      expect(node.children.length).toEqual(1);
    });

    test('comp() number of children decreases when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const compDef = {
        draw: vNode => vNode.attrs.values.map(label => text(label))
      };
      const node = comp(compDef, {
        values
      });
      mount(app, node);
      expect(node.children.length).toEqual(2);
      values.pop();
      node.draw();
sync();
      expect(node.children.length).toEqual(1);
    });

    test('comp() number of children increases when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1'];
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => vNode.attrs.values.map(label => text(label))
      };
      const node = comp(compDef, {
        values
      });
      mount(app, node);
      expect(node.children.length).toEqual(1);
      values.push('test2');
      node.draw();
      sync();
      expect(node.children.length).toEqual(2);
    });

    test('comp() number of children increases when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1'];
      const app = document.querySelector('#app');
      const compDef = {
        draw: vNode => vNode.attrs.values.map(label => text(label))
      };
      const node = comp(compDef, {
        values
      });
      mount(app, node);
      expect(node.children.length).toEqual(1);
      values.push('test2');
      node.draw();
sync();
      expect(node.children.length).toEqual(2);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('comp() with nested comp() draws correctly after reordering', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2'];
      const app = document.querySelector('#app');
      const ListItem = {
        draw: vNode => elem('li',
          text(vNode.attrs.value),
        )
      };
      const List = {
        draw: vNode => elem('ul',
          values.map(value => comp(ListItem, {value}))
        )
      };
      const listNode = comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      values.reverse();
      listNode.draw();
      sync();
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem1);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('comp() with nested comp() draws correctly after adding comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2'];
      const app = document.querySelector('#app');
      const ListItem = {
        draw: vNode => elem('li',
          text(vNode.attrs.value),
        )
      };
      const List = {
        draw: vNode => elem('ul',
          values.map(value => comp(ListItem, {value}))
        )
      };
      const listNode = comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      const elem3 = document.createElement('li');
      elem3.innerHTML = 'test3';
      mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      values.push('test3');
      listNode.draw();
      sync();
      expect(listNode.children[0].children.length).toEqual(3);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[2] as VNodeComp).doms[0]).toEqual(elem3);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('comp() with nested comp() draws correctly after removing comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2', 'test3'];
      const app = document.querySelector('#app');
      const ListItem = {
        draw: vNode => elem('li',
          text(vNode.attrs.value),
        )
      };
      const List = {
        draw: vNode => elem('ul',
          values.map(value => comp(ListItem, {value}))
        )
      };
      const listNode = comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      const elem3 = document.createElement('li');
      elem3.innerHTML = 'test3';
      mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(3);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[2] as VNodeComp).doms[0]).toEqual(elem3);
      values.pop();
      listNode.draw();
      sync();
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect(listNode.children[0].children[2]).toEqual(undefined);
    });

    test('comp() child element namespace is correct when node name changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'section';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('section');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('comp() child element namespace is correct when node changes from xhtml to svg', () => {
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'svg';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('comp() child element namespace is correct when node changes from xhtml to math', () => {
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'math';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
    });

    test('comp() child element namespace is correct when node changes from svg to math', () => {
      const app = document.querySelector('#app');
      let elType = 'svg';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      elType = 'math';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
    });

    test('comp() child element namespace is correct when node changes from math to svg', () => {
      const app = document.querySelector('#app');
      let elType = 'math';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      elType = 'svg';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });
    
    test('comp() child element namespace is correct when node changes from svg to xhtml', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'svg';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      elType = 'div';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('comp() child element namespace is correct when node changes from math to xhtml', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'math';
      const compDef = {
        draw: vNode => elem(elType)
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      elType = 'div';
      node.draw();
sync();
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('comp() children namespaces change correctly', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elTypes = ['div', 'svg', 'math'];
      const compDef = {
        draw: vNode => elTypes.map(elType => elem(elType))
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(3);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(node.doms[1].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[1] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      expect(node.doms[2].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[2] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      elTypes[0] = 'math';
      elTypes[1] = 'div';
      elTypes[2] = 'svg';
      node.draw();
sync();
      expect(node.children.length).toBe(3);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      expect(node.doms[1].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[1] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(node.doms[2].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[2] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('Nested comp() namespaces change correctly', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'html';
      const nestedCompDef = {
        draw: vNode => elType === 'html' ? elem('div') : elem('rect')
      };
      const compDef = {
        draw: vNode => elType === 'html' ? elem('div', comp(nestedCompDef)) : elem('svg', comp(nestedCompDef))
      };
      const node = comp(compDef);
      mount(app, node);
      expect(node.children.length).toBe(1);
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(node.children[0].children[0].children.length).toBe(1);
      expect(((node.children[0].children[0] as VNodeComp).doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'svg';
      node.draw();
      sync();
      expect(node.children.length).toBe(1);
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      expect(node.children[0].children[0].children.length).toBe(1);
      expect(((node.children[0].children[0] as VNodeComp).doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    //test('Nested comp() returning html updates as expected', () => {
    //  document.body.innerHTML = '<div id="app"></div>';
    //  const app = document.querySelector('#app');
    //  const html1 = '<div>Test 1</div>';
    //  const html2 = '<div>Test 2</div>';
    //  let htmlStr = html1;
    //  const compDef = {
    //    draw: vNode => html(htmlStr)
    //  };
    //  const node = comp(compDef);
    //  mount(app, node);
    //  expect((node.doms[0] as HTMLElement).outerHTML).toEqual(html1);
    //  htmlStr = html2;
    //  node.draw();
    //  sync();
    //  expect((node.doms[0] as HTMLElement).outerHTML).toEqual(html2);
    //});

    test('elem() updated with less children', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const node1 = elem('div', elem('div'), elem('div'));
      const node2 = elem('div', elem('div'));
      mount(app, node1);
      mount(app, node2);
      expect(node2.children.length).toEqual(1);
    });

    //test('comp() that has html() added as last element', () => {
    //  document.body.innerHTML = '<div id="app"></div>';
    //  const app = document.querySelector('#app');
    //  const html1 = '<b>Test 1</b>';
    //  const html2 = '<i>Test 2</i>';
    //  let htmlStr = html1;
    //  const CompDef = {
    //    draw: vNode => [
    //      elem('div'),
    //      html(htmlStr),
    //    ],
    //  };
    //  const comp1 = comp(CompDef);
    //  mount(app, comp1);
    //  expect((comp1.children[0].dom as Element).outerHTML).toEqual('<div></div>');
    //  expect((comp1.children[1].dom as Element).outerHTML).toEqual(html1);
    //  htmlStr = html2;
    //  comp1.draw();
    //  sync();
    //  expect((comp1.children[0].dom as Element).outerHTML).toEqual('<div></div>');
    //  expect((comp1.children[1].dom as Element).outerHTML).toEqual(html2);
    //});

  });

  describe('Removal', () => {
    
    test('comp.removed() called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const removedFn = vi.fn();
      const compDef = {
        draw: vNode => elem('div', text('test')),
        removed: removedFn
      };
      const node = comp(compDef);
      mount(app, node);
      mount(app, null);
      expect(removedFn).toHaveBeenCalledTimes(1);
    });

    test('Destroyed as expected when drawn deferred and then immedidately after removal', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const listItemDef = {
        draw: vNode => elem('li', text(vNode.attrs.value)),
      };
      const listDef = {
        draw: vNode => elem('ul', values.map(value => comp(listItemDef, {value})))
      };
      const node = comp(listDef);
      mount(app, node);
      expect(node.children[0].children.length).toEqual(2);
      values.pop();
      node.draw();
      node.draw();
      sync();
      expect(node.children[0].children.length).toEqual(1);
    });

    test('Component with removed elements is drawn correctly', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['1', '2', '3'];
      const elem1 = document.createElement('li');
      elem1.innerHTML = '1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = '2';
      const elem3 = document.createElement('li');
      elem3.innerHTML = '3';
      const deferredPromise = generateDeferredPromise();
      const listItemDef = {
        draw: vNode => {
          //console.log(vNode.attrs.value);
          return elem('li', text(vNode.attrs.value))
        },
        remove: vNode => deferredPromise.promise,
        destroy: vNode => {
          values.splice(vNode.attrs.index, 1);
        }
      };
      const listDef = {
        draw: vNode => elem('ul',
          values.map((value, index) => comp(listItemDef, {
            index: index,
            value: value,
          }))
        ),
      };
      const node = comp(listDef);
      mount(app, node);
      expect(node.children[0].children.length).toEqual(3);
      expect(node.children[0].children[0].dom).toEqual(elem1);
      expect(node.children[0].children[1].dom).toEqual(elem2);
      expect(node.children[0].children[2].dom).toEqual(elem3);
      values[1] = null;
      node.draw();
      sync();
      // at this point there should still be three nodes left, with the node
      // being removed still displaying its prior state
      expect(node.children[0].children.length).toEqual(3);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(3);
      //console.log(node.children[0].children);
      //expect(node.children[0].children[0].dom).toEqual(elem1);
      //expect(node.children[0].children[2].dom).toEqual(elem3);
    });

    // *** finish implementing
    test('node is changed on redraw', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const dom1 = document.createElement('div');
      const dom2 = document.createElement('div');
      let currentDom = dom1;
      const compDef = {
        draw: vNode => node(currentDom),
      };
      const comp1 = comp(compDef);
      mount(app, comp1);
      expect(comp1.dom).toBe(currentDom);
      currentDom = dom2;
      comp1.draw();
      sync();
      expect(comp1.dom).toBe(currentDom);
    });
    
  });

});