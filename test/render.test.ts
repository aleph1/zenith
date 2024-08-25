import z from '../src/index';
import {
  VNodeAnyOrArray,
  VNodeComp,
  VNodeHTML,
  //VNodeFlatArray,
  VNodeTypes
} from '../src/vNode.defs';

// jest’s handling of promises with setTimeout is not functional,
// so we create a deferred promise and simulate the setTimeout
// using jest.advanceTimersByTime outside of the promise
function generateDeferredPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    [resolve, reject] = [res, rej];
  });
  return {promise, reject, resolve};
}

// TESTS TO ADD
// - z.elem with children has children reapplied in different order
// - z.comp where draw returns elem that requires different parent (<tr>, <tbody>)

describe('render', () => {

  describe('Basic', () => {
    // elem with string
    // elem with number
    // comp with nested comp
  });

  describe('Updating', () => {

    test('DOM is reused if possible', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', {id: 'test1'});
      const node2 = z.elem('div', {id: 'test2'});
      z.mount(app, node1);
      z.mount(app, node2);
      expect(node1.dom).toEqual(node2.dom);
    });

    test('DOM is not reused when nodeName is different', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', {id: 'test1'});
      const node2 = z.elem('p', {id: 'test2'});
      z.mount(app, node1);
      z.mount(app, node2);
      expect(node1.dom).not.toEqual(node2.dom);
    });

    test('array of z.elem() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', {id: 'test1'});
      const node2 = z.elem('div', {id: 'test2'});
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = z.mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toEqual(undefined);
      expect(node2.dom).toEqual(undefined);
      mountedNode = z.mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].dom).toEqual(elem1);
    });

    test('array of z.elem() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', {id: 'test1'});
      const node2 = z.elem('div', {id: 'test2'});
      const node3 = z.elem('div', {id: 'test3'});
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      const elem3 = document.createElement('div');
      elem3.id = 'test3';
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = z.mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].dom).toEqual(elem3);
    });

    test('array of z.text() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.text('test1');
      const node2 = z.text('test2');
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createTextNode('test2');
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = z.mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toEqual(undefined);
      expect(node2.dom).toEqual(undefined);
      mountedNode = z.mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].dom).toEqual(elem1);
    });

    test('array of z.text() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.text('test1');
      const node2 = z.text('test2');
      const node3 = z.text('test3');
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createTextNode('test2');
      const elem3 = document.createTextNode('test3');
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].dom).toEqual(elem2);
      mountedNode = z.mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].dom).toEqual(elem3);
    });

    test('array of z.comp() mounted, unmounted, and remounted with different order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef, {
        text: 'test1'
      });
      const node2 = z.comp(compDef, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      const text1 = document.createTextNode('test1');
      const text2 = document.createTextNode('test2');
      elem1.append(text1);
      elem2.append(text2);
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem2);
      mountedNode = z.mount(app, null);
      expect(mountedNode.children.length).toEqual(0);
      expect(node1.dom).toEqual(undefined);
      expect(node2.dom).toEqual(undefined);
      mountedNode = z.mount(app, [node2, node1]);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node1);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem1);
    });

    test('array of z.comp() mounted, and remounted with different nodes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef, {
        text: 'test1'
      });
      const node2 = z.comp(compDef, {
        text: 'test2'
      });
      const node3 = z.comp(compDef, {
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
      let mountedNode = z.mount(app, [node1, node2]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      expect(mountedNode.children[1]).toBe(node2);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem2);
      mountedNode = z.mount(app, [node2, node3]);
      expect(mountedNode.children.length).toEqual(2);
      expect(mountedNode.children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
      expect(mountedNode.children[1]).toBe(node3);
      expect(mountedNode.children[1].children[0].dom).toEqual(elem3);
    });

    // fails due to 
    //TypeError: Converting circular structure to JSON

    test('z.comp() with single z.elem(), drawn deffered with single z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'elem';
      const node1 = z.elem('div');
      const node2 = z.text('test');
      const compDef = z.compDef({
        draw: () => childType === 'elem' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = z.mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      childType = 'text';
      node3.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      //console.log(mountedNode.children);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      //console.log(mountedNode.children[0].children[0] === node2)
      // expect(mountedNode.children[0].children[0]).toBe(node2);
      // expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('z.comp() with single z.elem(), drawn immediately with single z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'elem';
      const node1 = z.elem('div');
      const node2 = z.text('test');
      const compDef = z.compDef({
        draw: () => childType === 'elem' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      let mountedNode = z.mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      childType = 'text';
      node3.draw(true);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('z.comp() with single z.text(), drawn deffered with single z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'text';
      const node1 = z.text('test');
      const node2 = z.elem('div');
      const compDef = z.compDef({
        draw: vNode => childType === 'text' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = z.mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
      childType = 'elem';
      node3.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
    });

    test('z.comp() with single z.text(), drawn immediately with single z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let childType = 'text';
      const node1 = z.text('test');
      const node2 = z.elem('div');
      const compDef = z.compDef({
        draw: vNode => childType === 'text' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      const elem1 = document.createElement('div');
      const text1 = document.createTextNode('test');
      const mountedNode = z.mount(app, node3);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node1);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
      childType = 'elem';
      node3.draw(true);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
    });

    test('z.elem() <input> type changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('input', {
        type: 'text'
      });
      const node2 = z.elem('input', {
        type: 'checkbox'
      });
      const elem1 = document.createElement('input');
      elem1.type = 'text';
      const elem2 = document.createElement('input');
      elem2.type = 'checkbox';
      let mountedNode = z.mount(app, node1);
      expect(node1.dom).toEqual(elem1);
      mountedNode = z.mount(app, node2);
      expect(node2.dom).toEqual(elem2);
    });

    test('unmounting z.comp() works as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div')
      });
      const node = z.comp(compDef);
      let mountedNode = z.mount(app, node);
      expect(mountedNode.children.length).toBe(1);
      expect(app.childNodes.length).toBe(1);
      z.mount(app, null);
      expect(mountedNode.children.length).toBe(0);
      expect(app.childNodes.length).toBe(0);
      expect(node.children.length).toBe(0);
    });

    test('mounting, unmounting, and then remounting z.comp() works as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div')
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      z.mount(app, null);
      z.mount(app, node);
      expect(app.childNodes.length).toBe(1);
      expect(node.children.length).toBe(1);
      expect(node.children[0].dom).toEqual(app.childNodes[0]);
    });

    test('mounted child changes from one compDef to a different compDef', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const compDef2 = z.compDef({
        draw: vNode => z.elem('p', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef1, {
        text: 'test1'
      });
      const node2 = z.comp(compDef2, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('p');
      elem2.innerHTML = 'test2';
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef1);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.comp() to z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef, {
        text: 'test1'
      });
      const node2 = z.elem('div', z.text('test2'));
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.elem() to z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.elem('div', z.text('test1'));
      const node2 = z.comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.comp() to z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef, {
        text: 'test1'
      });
      const node2 = z.text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.text() to z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.text('test2');
      const node2 = z.comp(compDef, {
        text: 'test1'
      });
      const elem1 = document.createTextNode('test2');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test1';
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].tag).toEqual(compDef);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.elem() to z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', z.text('test1'));
      const node2 = z.text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('mounted child changes from z.text() to z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.text('test1');
      const node2 = z.elem('div', z.text('test2'));
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const mountedNode = z.mount(app, node1);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node1);
      expect(mountedNode.children[0].dom).toEqual(elem1);
      z.mount(app, node2);
      expect(mountedNode.children.length).toBe(1);
      expect(mountedNode.children[0]).toEqual(node2);
      expect(mountedNode.children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from one compDef to a different compDef when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'div';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const compDef2 = z.compDef({
        draw: vNode => z.elem('p', z.text(vNode.attrs.text))
      });
      const compDef3 = z.compDef({
        draw: vNode => z.comp(compType === 'div' ? compDef1 : compDef2, {
          text: vNode.attrs.text
        })
      });
      const node = z.comp(compDef3, {
        text: 'test'
      });
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef1);
      compType = 'p';
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef2);
    });

    test('z.comp() child changes from one compDef to a different compDef when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'div';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const compDef2 = z.compDef({
        draw: vNode => z.elem('p', z.text(vNode.attrs.text))
      });
      const compDef3 = z.compDef({
        draw: vNode => z.comp(compType === 'div' ? compDef1 : compDef2, {
          text: vNode.attrs.text
        })
      });
      const node = z.comp(compDef3, {
        text: 'test'
      });
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef1);
      compType = 'p';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef2);
    });

    test('z.comp() child changes from z.comp() to z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'comp';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef1, {
        text: 'test1'
      });
      const node2 = z.elem('div', z.text('test2'));
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = z.compDef({
        draw: vNode => compType === 'comp' ? node1 : node2
      });
      const node3 = z.comp(compDef2);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].children[0].dom).toEqual(elem1);
      compType = 'elem';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from z.elem() to z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'elem';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.elem('div', z.text('test1'));
      const node2 = z.comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = z.compDef({
        draw: vNode => compType === 'elem' ? node1 : node2
      });
      const node3 = z.comp(compDef2);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      compType = 'comp';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from z.comp() to z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'comp';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.comp(compDef1, {
        text: 'test1'
      });
      const node2 = z.text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const compDef2 = z.compDef({
        draw: vNode => compType === 'comp' ? node1 : node2
      });
      const node3 = z.comp(compDef2);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].children[0].dom).toEqual(elem1);
      compType = 'text';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from z.text() to z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let compType = 'text';
      const compDef1 = z.compDef({
        draw: vNode => z.elem('div', z.text(vNode.attrs.text))
      });
      const node1 = z.text('test1');
      const node2 = z.comp(compDef1, {
        text: 'test2'
      });
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef2 = z.compDef({
        draw: vNode => compType === 'text' ? node1 : node2
      });
      const node3 = z.comp(compDef2);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      compType = 'comp';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from z.elem() to z.text()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let nodeType = 'elem';
      const node1 = z.elem('div', z.text('test1'));
      const node2 = z.text('test2');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createTextNode('test2');
      const compDef = z.compDef({
        draw: vNode => nodeType === 'elem' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      nodeType = 'text';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('z.comp() child changes from z.text() to z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let nodeType = 'text';
      const node1 = z.text('test1');
      const node2 = z.elem('div', z.text('test2'));
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      const compDef = z.compDef({
        draw: vNode => nodeType === 'text' ? node1 : node2
      });
      const node3 = z.comp(compDef);
      z.mount(app, node3);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node1);
      expect(node3.children[0].dom).toEqual(elem1);
      nodeType = 'elem';
      node3.draw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('z.comp() number of children decreases when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const compDef = z.compDef({
        draw: vNode => vNode.attrs.values.map(label => z.text(label))
      });
      const node = z.comp(compDef, {
        values
      });
      z.mount(app, node);
      expect(node.children.length).toEqual(2);
      values.pop();
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toEqual(1);
    });

    test('z.comp() number of children decreases when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const compDef = z.compDef({
        draw: vNode => vNode.attrs.values.map(label => z.text(label))
      });
      const node = z.comp(compDef, {
        values
      });
      z.mount(app, node);
      expect(node.children.length).toEqual(2);
      values.pop();
      node.draw(true);
      expect(node.children.length).toEqual(1);
    });

    test('z.comp() number of children increases when drawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1'];
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => vNode.attrs.values.map(label => z.text(label))
      });
      const node = z.comp(compDef, {
        values
      });
      z.mount(app, node);
      expect(node.children.length).toEqual(1);
      values.push('test2');
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toEqual(2);
    });

    test('z.comp() number of children increases when drawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1'];
      const app = document.querySelector('#app');
      const compDef = z.compDef({
        draw: vNode => vNode.attrs.values.map(label => z.text(label))
      });
      const node = z.comp(compDef, {
        values
      });
      z.mount(app, node);
      expect(node.children.length).toEqual(1);
      values.push('test2');
      node.draw(true);
      expect(node.children.length).toEqual(2);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('z.comp() with nested z.comp() draws correctly after reordering', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2'];
      const app = document.querySelector('#app');
      const ListItem = z.compDef({
        draw: vNode => z.elem('li',
          z.text(vNode.attrs.value),
        )
      });
      const List = z.compDef({
        draw: vNode => z.elem('ul',
          values.map(value => z.comp(ListItem, {value}))
        )
      });
      const listNode = z.comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      z.mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      values.reverse();
      listNode.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem1);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('z.comp() with nested z.comp() draws correctly after adding z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2'];
      const app = document.querySelector('#app');
      const ListItem = z.compDef({
        draw: vNode => z.elem('li',
          z.text(vNode.attrs.value),
        )
      });
      const List = z.compDef({
        draw: vNode => z.elem('ul',
          values.map(value => z.comp(ListItem, {value}))
        )
      });
      const listNode = z.comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      const elem3 = document.createElement('li');
      elem3.innerHTML = 'test3';
      z.mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(2);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      values.push('test3');
      listNode.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(listNode.children[0].children.length).toEqual(3);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[2] as VNodeComp).doms[0]).toEqual(elem3);
    });

    // this test is a recreation of the demo that
    // causes issues when nested components are reordered
    test('z.comp() with nested z.comp() draws correctly after removing z.comp()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const values = ['test1', 'test2', 'test3'];
      const app = document.querySelector('#app');
      const ListItem = z.compDef({
        draw: vNode => z.elem('li',
          z.text(vNode.attrs.value),
        )
      });
      const List = z.compDef({
        draw: vNode => z.elem('ul',
          values.map(value => z.comp(ListItem, {value}))
        )
      });
      const listNode = z.comp(List);
      const elem1 = document.createElement('li');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('li');
      elem2.innerHTML = 'test2';
      const elem3 = document.createElement('li');
      elem3.innerHTML = 'test3';
      z.mount(app, listNode);
      expect(listNode.children[0].children.length).toEqual(3);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect((listNode.children[0].children[2] as VNodeComp).doms[0]).toEqual(elem3);
      values.pop();
      listNode.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect((listNode.children[0].children[0] as VNodeComp).doms[0]).toEqual(elem1);
      expect((listNode.children[0].children[1] as VNodeComp).doms[0]).toEqual(elem2);
      expect(listNode.children[0].children[2]).toEqual(undefined);
    });

    test('z.comp() child element namespace is correct when node name changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'section';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('section');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('z.comp() child element namespace is correct when node changes from xhtml to svg', () => {
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'svg';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('z.comp() child element namespace is correct when node changes from xhtml to math', () => {
      const app = document.querySelector('#app');
      let elType = 'div';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'math';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
    });

    test('z.comp() child element namespace is correct when node changes from svg to math', () => {
      const app = document.querySelector('#app');
      let elType = 'svg';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      elType = 'math';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
    });

    test('z.comp() child element namespace is correct when node changes from math to svg', () => {
      const app = document.querySelector('#app');
      let elType = 'math';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      elType = 'svg';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });
    
    test('z.comp() child element namespace is correct when node changes from svg to xhtml', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'svg';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      elType = 'div';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('z.comp() child element namespace is correct when node changes from math to xhtml', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'math';
      const compDef = z.compDef({
        draw: vNode => z.elem(elType)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      elType = 'div';
      node.draw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('z.comp() children namespaces change correctly', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elTypes = ['div', 'svg', 'math'];
      const compDef = z.compDef({
        draw: vNode => elTypes.map(elType => z.elem(elType))
      });
      const node = z.comp(compDef);
      z.mount(app, node);
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
      node.draw(true);
      expect(node.children.length).toBe(3);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('math');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
      expect(node.doms[1].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[1] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(node.doms[2].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[2] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('Nested z.comp() namespaces change correctly', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let elType = 'html';
      const nestedCompDef = z.compDef({
        draw: vNode => elType === 'html' ? z.elem('div') : z.elem('rect')
      });
      const compDef = z.compDef({
        draw: vNode => elType === 'html' ? z.elem('div', z.comp(nestedCompDef)) : z.elem('svg', z.comp(nestedCompDef))
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect(node.children.length).toBe(1);
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(node.children[0].children[0].children.length).toBe(1);
      expect(((node.children[0].children[0] as VNodeComp).doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      elType = 'svg';
      node.draw(true);
      //expect(node.children.length).toBe(1);
      //expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      //expect(node.children[0].children[0].children.length).toBe(1);
      //expect(((node.children[0].children[0] as VNodeComp).doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('Nested z.comp() returning z.html updates as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const html1 = '<div>Test 1</div>';
      const html2 = '<div>Test 2</div>';
      let html = html1;
      const compDef = z.compDef({
        draw: vNode => z.html(html)
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      expect((node.doms[0] as HTMLElement).outerHTML).toEqual(html1);
      html = html2;
      node.draw(true);
      expect((node.doms[0] as HTMLElement).outerHTML).toEqual(html2);
    });

    test('z.elem() updated with less children', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const node1 = z.elem('div', z.elem('div'), z.elem('div'));
      const node2 = z.elem('div', z.elem('div'));
      z.mount(app, node1);
      z.mount(app, node2);
      expect(node2.children.length).toEqual(1);
    });

    test('z.comp() that has z.html() added as last element', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const html1 = '<b>Test 1</b>';
      const html2 = '<i>Test 2</i>';
      let html = html1;
      const CompDef = z.compDef({
        draw: vNode => [
          z.elem('div'),
          z.html(html),
        ],
      });
      const comp = z.comp(CompDef);
      z.mount(app, comp);
      expect((comp.children[0].dom as Element).outerHTML).toEqual('<div></div>');
      expect((comp.children[1].dom as Element).outerHTML).toEqual(html1);
      html = html2;
      comp.draw(true);
      expect((comp.children[0].dom as Element).outerHTML).toEqual('<div></div>');
      expect((comp.children[1].dom as Element).outerHTML).toEqual(html2);
    });

  });

  describe('Removal', () => {
    
    test('Destroy called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const destroyFn = jest.fn();
      const compDef = z.compDef({
        draw: vNode => z.elem('div', z.text('test')),
        destroy: destroyFn
      });
      const node = z.comp(compDef);
      z.mount(app, node);
      z.mount(app, null);
      expect(destroyFn).toHaveBeenCalledTimes(1);
    });
    
    test('Destroyed as expected when destruction is deferred', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const deferredPromise = generateDeferredPromise();
      const listItemDef = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.value)),
        remove: vNode => deferredPromise.promise,
      });
      const listDef = z.compDef({
        draw: vNode => z.elem('ul', values.map(value => z.comp(listItemDef, {value})))
      });
      const node = z.comp(listDef);
      z.mount(app, node);
      expect(node.children[0].children.length).toEqual(2);
      values.pop();
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(1);
    });

    test('Destroyed as expected when drawn after removal but before destroy', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const deferredPromise = generateDeferredPromise();
      const removeFn = jest.fn(vNode => {
        return deferredPromise.promise;
      });
      const listItemDef = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.value)),
        remove: removeFn,
      });
      const listDef = z.compDef({
        draw: vNode => z.elem('ul', values.map(value => z.comp(listItemDef, {value})))
      });
      const node = z.comp(listDef);
      z.mount(app, node);
      expect(node.children[0].children.length).toEqual(2);
      expect(removeFn).toHaveBeenCalledTimes(0);
      values.pop();
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      expect(removeFn).toHaveBeenCalledTimes(1);
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      expect(removeFn).toHaveBeenCalledTimes(1);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(1);
      expect(removeFn).toHaveBeenCalledTimes(1);
    });

    test('Destroyed as expected when drawn deferred and then immedidately after removal', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const listItemDef = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.value)),
      });
      const listDef = z.compDef({
        draw: vNode => z.elem('ul', values.map(value => z.comp(listItemDef, {value})))
      });
      const node = z.comp(listDef);
      z.mount(app, node);
      expect(node.children[0].children.length).toEqual(2);
      values.pop();
      node.draw();
      node.draw(true);
      expect(node.children[0].children.length).toEqual(1);
    });

    test('Component with deferred removal is drawn in correct location', async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const values = ['test1', 'test2'];
      const deferredPromise = generateDeferredPromise();
      const listItemDef = z.compDef({
        draw: vNode => z.elem('li', {
          id: vNode.attrs.id
        }),
        remove: vNode => deferredPromise.promise,
        destroy: vNode => {
          values.splice(vNode.attrs.index, 1);
        }
      });
      const listDef = z.compDef({
        draw: vNode => values.map((value, index) => value && z.comp(listItemDef, {
          id: value,
          index: index,
        }))
      });
      const node = z.comp(listDef);
      z.mount(app, node);
      expect(node.children.length).toEqual(2);
      // when we nullify the index and draw, the old node will be maintained
      // due to its remove method returning a timeout
      values[0] = null;
      node.draw(true);
      jest.advanceTimersByTime(global.FRAME_TIME);
      // at this point there should still be two nodes left, with the node
      // being removed still displaying its prior state
      expect(node.children.length).toEqual(2);
      expect((node.children[0].children[0].dom as Element).id).toEqual('test1');
      await deferredPromise.resolve();
      expect(node.children.length).toEqual(1);
      expect((node.children[0].children[0].dom as Element).id).toEqual('test2');
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
      const listItemDef = z.compDef({
        draw: vNode => {
          //console.log(vNode.attrs.value);
          return z.elem('li', z.text(vNode.attrs.value))
        },
        remove: vNode => deferredPromise.promise,
        destroy: vNode => {
          values.splice(vNode.attrs.index, 1);
        }
      });
      const listDef = z.compDef({
        draw: vNode => z.elem('ul',
          values.map((value, index) => z.comp(listItemDef, {
            index: index,
            value: value,
          }))
        ),
      });
      const node = z.comp(listDef);
      z.mount(app, node);
      expect(node.children[0].children.length).toEqual(3);
      expect(node.children[0].children[0].dom).toEqual(elem1);
      expect(node.children[0].children[1].dom).toEqual(elem2);
      expect(node.children[0].children[2].dom).toEqual(elem3);
      values[1] = null;
      node.draw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      // at this point there should still be three nodes left, with the node
      // being removed still displaying its prior state
      expect(node.children[0].children.length).toEqual(3);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(3);
      //console.log(node.children[0].children);
      //expect(node.children[0].children[0].dom).toEqual(elem1);
      //expect(node.children[0].children[2].dom).toEqual(elem3);
    });
    
  });

});