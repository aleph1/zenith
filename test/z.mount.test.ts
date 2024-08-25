import z from '../src/index';
import {
  VNodeTypes
} from '../src/vNode.defs';


describe('z.mount()', () => {

  test('error when dom is null', () => {
    const node1 = z.elem('div');
    expect(() => {
      z.mount(null, node1);
    }).toThrow(Error);
  });

  test('z.elem() with no attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div');
    const elem1 = document.createElement('div');
    z.mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('z.elem() with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', {
      id: 'test'
    });
    const elem1 = document.createElement('div');
    elem1.id = 'test';
    z.mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('z.elem() with text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.elem('div', z.text('test'));
    const elem1 = document.createElement('div');
    elem1.innerHTML = 'test';
    z.mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('z.elem() svg type element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('rect', {
      ns: z.ns.svg
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() math type element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('mfrac', {
      ns: z.ns.math
    });
    const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mfrac');
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() with single z.elem() child', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('p');
    const node2 = z.elem('div', node1);
    const elem1 = document.createElement('p');
    const elem2 = document.createElement('div');
    elem2.appendChild(elem1);
    z.mount(app, node2);
    expect(node1.dom).toEqual(elem1);
    expect(node2.dom).toEqual(elem2);
  });

  test('z.elem() is xhtml custom type', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', {
      is: 'custom-type',
    });
    const elem1 = document.createElement('div', {
      is: 'custom-type',
    });
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() is xhtml custom type with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', {
      id: 'custom-xhtml',
      is: 'custom-xhtml',
    });
    const elem1 = document.createElement('div', {
      is: 'custom-xhtml',
    });
    elem1.id = 'custom-xhtml';
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() is svg custom type', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('svg', {
      is: 'custom-svg',
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg', {
      is: 'custom-svg',
    });
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() is svg custom type with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('svg', {
      id: 'custom-svg',
      is: 'custom-svg',
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg', {
      is: 'custom-svg',
    });
    elem1.id = 'custom-svg';
    z.mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() with multiple z.elem() children', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const vNode1 = z.elem('h1');
    const vNode2 = z.elem('p');
    const vNode3 = z.elem('div', vNode1, vNode2);
    const elem1 = document.createElement('h1');
    const elem2 = document.createElement('p');
    const elem3 = document.createElement('div');
    elem3.appendChild(elem1);
    elem3.appendChild(elem2);
    z.mount(app, vNode3);
    expect(vNode3.dom.children.length).toEqual(2);
    expect(vNode3.dom.children[0]).toEqual(elem1);
    expect(vNode3.dom.children[1]).toEqual(elem2);
  });

  test('z.elem() svg with z.html() child with multiple svg elements', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.html('<g></g><rect/>');
    const node2 = z.elem('svg', node1);
    z.mount(app, node2);
    expect(node1.doms[0].nodeName).toEqual('g');
    expect(node1.doms[0] instanceof SVGElement);
    expect((node1.doms[0] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    expect(node1.doms[1].nodeName).toEqual('rect');
    expect(node1.doms[1] instanceof SVGElement);
    expect((node1.doms[1] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
  });

  test('Unmounting z.elem() works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div');
    z.mount(app, node1);
    z.mount(app, null);
    expect(app.childNodes.length).toBe(0);
    expect(node1.dom).toBe(undefined);
  });

  test('Mounting z.elem() while already mounted works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div');
    const elem1 = document.createElement('div');
    z.mount(app, node1);
    z.mount(app, node1);
    expect(app.childNodes.length).toBe(1);
    expect(node1.dom).toEqual(elem1);
  });

  test('Mounting, unmounting, and then remounting z.elem() works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div');
    const elem1 = document.createElement('div');
    z.mount(app, node1);
    z.mount(app, null);
    z.mount(app, node1);
    expect(app.childNodes.length).toBe(1);
    expect(node1.dom).toEqual(elem1);
  });

  test('z.elem() number of children decreases', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', z.text('test1'));
    const node2 = z.elem('div', z.text('test2'));
    let mountedNode = z.mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.children[1]).toEqual(node2);
    mountedNode = z.mount(app, [node1]);
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(mountedNode.children.length).toEqual(1);
    expect(mountedNode.children[0]).toEqual(node1);
  });

  test('z.elem() number of children increases', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', z.text('test1'));
    const node2 = z.elem('div', z.text('test2'));
    let mountedNode = z.mount(app, node1);
    expect(mountedNode.children.length).toEqual(1);
    expect(mountedNode.children[0]).toEqual(node1);
    mountedNode = z.mount(app, [node1, node2]);
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.children[1]).toEqual(node2);
  });

  test('z.comp() draw returns null', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => null
    });
    const node = z.comp(compDef);
    z.mount(app, node);
    expect(node.children.length).toEqual(1);
  });

  test('z.comp() draw returns array of null', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => [null]
    });
    const node = z.comp(compDef);
    z.mount(app, node);
    expect(node.children.length).toEqual(1);
  });

  test('z.comp() draw returns undefined', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => undefined
    });
    const vNode = z.comp(compDef);
    z.mount(app, vNode);
    expect(vNode.children.length).toEqual(1);
  });

  test('z.comp() draw returns array of undefined', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => [undefined]
    });
    const vNode = z.comp(compDef);
    z.mount(app, vNode);
    expect(vNode.children.length).toEqual(1);
  });

  test('z.comp() draw returns single z.elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => z.elem('div')
    });
    const vNode = z.comp(compDef);
    const elem1 = document.createElement('div');
    z.mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
  });

  test('z.comp() draw returns array of z.elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const component = z.compDef({
      draw: () => [
        z.elem('div', {id: 'test1'}),
        z.elem('div', {id: 'test2'}),
      ]
    });
    const vNode = z.comp(component);
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    const elem2 = document.createElement('div');
    elem2.id = 'test2';
    z.mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
    expect(vNode.children[1].dom).toEqual(elem2);
  });

  test('z.comp() draw returns single z.text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => z.text('test')
    });
    const vNode = z.comp(compDef);
    const elem1 = document.createTextNode('test');
    z.mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
  });

  test('z.comp() draw returns array of z.text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: () => [
        z.text('test1'),
        z.text('test2'),
      ]
    });
    const vNode = z.comp(compDef);
    const elem1 = document.createTextNode('test1');
    const elem2 = document.createTextNode('test2');
    z.mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
    expect(vNode.children[1].dom).toEqual(elem2);
  });

  test('z.html() with single html element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div></div>');
    const elem1 = document.createElement('div');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });
  
  test('z.html() with single html element with text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div>test1</div>');
    const elem1 = document.createElement('div');
    elem1.innerHTML = 'test1';
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with single html element with attribute', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div id="test1"></div>');
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with multiple html elements', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div></div><div></div>');
    const elem1 = document.createElement('div');
    const elem2 = document.createElement('div');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
    expect(node.doms[1]).toEqual(elem2);
  });

  test('z.html() with multiple html elements with text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div>test1</div><div>test2</div>');
    const elem1 = document.createElement('div');
    elem1.innerHTML = 'test1';
    const elem2 = document.createElement('div');
    elem2.innerHTML = 'test2';
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
    expect(node.doms[1]).toEqual(elem2);
  });

  test('z.html() with multiple html elements with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<div id="test1"></div><div id="test2"></div>');
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    const elem2 = document.createElement('div');
    elem2.id = 'test2';
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
    expect(node.doms[1]).toEqual(elem2);
  });

  test('z.html() with text and html element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('test1<div>test2</div>');
    const elem1 = document.createTextNode('test1');
    const elem2 = document.createElement('div');
    elem2.innerHTML = 'test2';
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
    expect(node.doms[1]).toEqual(elem2);
  });

  // some elements can only be children of specific elements,
  // and there are separate tests for each of these

  test('z.html() with <caption>', () => {
    document.body.innerHTML = '<table></table>';
    const app = document.querySelector('table');
    const node = z.html('<caption>');
    const elem1 = document.createElement('caption');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <col>', () => {
    document.body.innerHTML = '<table><colgroup></colgroup><table>';
    const app = document.querySelector('colgroup');
    const node = z.html('<col>');
    const elem1 = document.createElement('col');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <thead>', () => {
    document.body.innerHTML = '<table><table>';
    const app = document.querySelector('table');
    const node = z.html('<thead>');
    const elem1 = document.createElement('thead');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <tbody>', () => {
    document.body.innerHTML = '<table><table>';
    const app = document.querySelector('table');
    const node = z.html('<tbody>');
    const elem1 = document.createElement('tbody');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <tr>', () => {
    document.body.innerHTML = '<table><tbody></tbody><table>';
    const app = document.querySelector('tbody');
    const node = z.html('<tr>');
    const elem1 = document.createElement('tr');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <td>', () => {
    document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
    const app = document.querySelector('tr');
    const node = z.html('<td>');
    const elem1 = document.createElement('td');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <tfoot>', () => {
    document.body.innerHTML = '<table><table>';
    const app = document.querySelector('table');
    const node = z.html('<tfoot>');
    const elem1 = document.createElement('tfoot');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <th>', () => {
    document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
    const app = document.querySelector('tr');
    const node = z.html('<th>');
    const elem1 = document.createElement('th');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with <thead>', () => {
    document.body.innerHTML = '<table><table>';
    const app = document.querySelector('table');
    const node = z.html('<thead>');
    const elem1 = document.createElement('thead');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with all other HTML5 tags', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const obsoleteTags = ['acronym', 'applet', 'basefont', 'big', 'center', 'dir', 'font', 'strike', 'tt'];
    const validTags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'cite', 'code', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'textarea', 'time', 'title', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']
    obsoleteTags.concat(validTags).forEach(tag => {
      const node = z.html('<' + tag + '/>');
      const elem1 = document.createElement(tag);
      z.mount(app, node);
      expect(node.doms[0]).toEqual(elem1);
    });
  });

  test('z.html() with two nodes requiring specific parents', () => {
    document.body.innerHTML = '<table></table>';
    const app = document.querySelector('table');
    const node = z.html('<thead/><tbody/>');
    const elem1 = document.createElement('thead');
    const elem2 = document.createElement('tbody');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
    expect(node.doms[1]).toEqual(elem2);
  });

  test('z.html() with <svg/>', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<svg/>');
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });

  test('z.html() with single svg element within elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.html('<g></g>');
    const node2 = z.elem('svg', node1);
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    z.mount(app, node2);
    expect(node1.doms[0]).toEqual(elem1);
  });

  test('z.html() with <math/>', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = z.html('<math/>');
    const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
    z.mount(app, node);
    expect(node.doms[0]).toEqual(elem1);
  });
  
  test('Create div with attribute and modify it', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', {id: 'test1'});
    const node2 = z.elem('div', {id: 'test2'});
    const node3 = z.elem('div');
    z.mount(app, node1);
    expect(node1.dom.getAttribute('id')).toBe('test1');
    z.mount(app, node2);
    expect(node2.dom.getAttribute('id')).toBe('test2');
    z.mount(app, node3);
    expect(node3.dom.getAttribute('id')).toBe(null);
  });

  test('array of z.elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div', {id: 'test1'});
    const node2 = z.elem('div', {id: 'test2'});
    const mountedNode = z.mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(node1.dom.getAttribute('id')).toBe('test1');
    expect(node2.dom.getAttribute('id')).toBe('test2');
  });

  test('array of z.text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.text('test1');
    const node2 = z.text('test2');
    const text1 = document.createTextNode('test1');
    const text2 = document.createTextNode('test2');
    const mountedNode = z.mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.dom.childNodes[0]).toEqual(text1);
    expect(mountedNode.dom.childNodes[0]).toBe(node1.dom);
    expect(node1.dom).toEqual(text1);
    expect(mountedNode.children[1]).toEqual(node2);
    expect(mountedNode.dom.childNodes[1]).toEqual(text2);
    expect(mountedNode.dom.childNodes[1]).toBe(node2.dom);
    expect(node2.dom).toEqual(text2);
  });

  test('array of z.comp()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: vNode => z.text(vNode.attrs.text)
    });
    const node1 = z.comp(compDef, {
      text: 'test1'
    });
    const node2 = z.comp(compDef, {
      text: 'test2'
    });
    const text1 = document.createTextNode('test1');
    const text2 = document.createTextNode('test2');
    const mountedNode = z.mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.dom.childNodes[0]).toEqual(text1);
    expect(mountedNode.children[1]).toEqual(node2);
    expect(mountedNode.dom.childNodes[1]).toEqual(text2);
  });

  test('array of z.comp(), z.elem() and z.text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = z.compDef({
      draw: vNode => z.text(vNode.attrs.text)
    });
    const node1 = z.elem('div', {id: 'test1'});
    const node2 = z.text('test2');
    const node3 = z.comp(compDef, {
      text: 'test3'
    });
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    const elem2 = document.createTextNode('test2');
    const elem3 = document.createTextNode('test3')
    const mountedNode = z.mount(app, [node1, node2, node3]);
    expect(mountedNode.children.length).toEqual(3);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.dom.childNodes[0]).toEqual(elem1);
    expect(mountedNode.children[1]).toEqual(node2);
    expect(mountedNode.dom.childNodes[1]).toEqual(elem2);
    expect(mountedNode.children[2]).toEqual(node3);
    expect(mountedNode.dom.childNodes[2]).toEqual(elem3);
  });

  test('Error when trying to mount to a dom element that is part of an existing zenith tree', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = z.elem('div');
    const node2 = z.elem('div');
    z.mount(app, node1);
    expect(() => {
      z.mount(node1.dom, node2);
    }).toThrow(Error);
  });

});