import { describe, test, expect, vi } from 'vitest';
import {
  elem,
  text,
  comp,
  mount,
  sync,
  ns,
} from '../src/index';

// *** add tests for node()

describe('mount()', () => {

  test('error when dom is null', () => {
    const node1 = elem('div');
    expect(() => {
      mount(null, node1);
    }).toThrow(Error);
  });

  test('elem() with no attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = elem('div');
    const elem1 = document.createElement('div');
    mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('elem() with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = elem('div', {
      id: 'test'
    });
    const elem1 = document.createElement('div');
    elem1.id = 'test';
    mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('elem() with text', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node = elem('div', text('test'));
    const elem1 = document.createElement('div');
    elem1.innerHTML = 'test';
    mount(app, node);
    expect(node.dom).toEqual(elem1);
  });

  test('elem() svg type element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('rect', {
      xmlns: ns.svg
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() math type element', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('mfrac', {
      xmlns: ns.math
    });
    const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mfrac');
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() with single elem() child', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('p');
    const node2 = elem('div', node1);
    const elem1 = document.createElement('p');
    const elem2 = document.createElement('div');
    elem2.appendChild(elem1);
    mount(app, node2);
    expect(node1.dom).toEqual(elem1);
    expect(node2.dom).toEqual(elem2);
  });

  test('elem() is xhtml custom type', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', {
      is: 'custom-type',
    });
    const elem1 = document.createElement('div', {
      is: 'custom-type',
    });
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() is xhtml custom type with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', {
      id: 'custom-xhtml',
      is: 'custom-xhtml',
    });
    const elem1 = document.createElement('div', {
      is: 'custom-xhtml',
    });
    elem1.id = 'custom-xhtml';
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() is svg custom type', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('svg', {
      is: 'custom-svg',
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg', {
      is: 'custom-svg',
    });
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() is svg custom type with attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('svg', {
      id: 'custom-svg',
      is: 'custom-svg',
    });
    const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg', {
      is: 'custom-svg',
    });
    elem1.id = 'custom-svg';
    mount(app, node1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() with multiple elem() children', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const vNode1 = elem('h1');
    const vNode2 = elem('p');
    const vNode3 = elem('div', vNode1, vNode2);
    const elem1 = document.createElement('h1');
    const elem2 = document.createElement('p');
    const elem3 = document.createElement('div');
    elem3.appendChild(elem1);
    elem3.appendChild(elem2);
    mount(app, vNode3);
    expect(vNode3.dom.children.length).toEqual(2);
    expect(vNode3.dom.children[0]).toEqual(elem1);
    expect(vNode3.dom.children[1]).toEqual(elem2);
  });

  //test('elem() svg with html() child with multiple svg elements', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node1 = html('<g></g><rect/>');
  //  const node2 = elem('svg', node1);
  //  mount(app, node2);
  //  expect(node1.doms[0].nodeName).toEqual('g');
  //  expect(node1.doms[0] instanceof SVGElement);
  //  expect((node1.doms[0] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
  //  expect(node1.doms[1].nodeName).toEqual('rect');
  //  expect(node1.doms[1] instanceof SVGElement);
  //  expect((node1.doms[1] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
  //});

  test('Unmounting elem() works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div');
    mount(app, node1);
    mount(app, null);
    expect(app.childNodes.length).toBe(0);
    expect(node1.dom).toBeNullish();
  });

  test('Mounting elem() while already mounted works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div');
    const elem1 = document.createElement('div');
    mount(app, node1);
    mount(app, node1);
    expect(app.childNodes.length).toBe(1);
    expect(node1.dom).toEqual(elem1);
  });

  test('Mounting, unmounting, and then remounting elem() works as expected', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div');
    const elem1 = document.createElement('div');
    mount(app, node1);
    mount(app, null);
    mount(app, node1);
    expect(app.childNodes.length).toBe(1);
    expect(node1.dom).toEqual(elem1);
  });

  test('elem() number of children decreases', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', text('test1'));
    const node2 = elem('div', text('test2'));
    let mountedNode = mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.children[1]).toEqual(node2);
    mountedNode = mount(app, [node1]);
    sync();
    expect(mountedNode.children.length).toEqual(1);
    expect(mountedNode.children[0]).toEqual(node1);
  });

  test('elem() number of children increases', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', text('test1'));
    const node2 = elem('div', text('test2'));
    let mountedNode = mount(app, node1);
    expect(mountedNode.children.length).toEqual(1);
    expect(mountedNode.children[0]).toEqual(node1);
    mountedNode = mount(app, [node1, node2]);
    sync();
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.children[1]).toEqual(node2);
  });

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

  test('comp() draw returns empty array', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => [null]
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

  test('comp() draw returns single elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => elem('div')
    };
    const vNode = comp(compDef);
    const elem1 = document.createElement('div');
    mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
  });

  test('comp() draw returns array of elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const component = {
      draw: () => [
        elem('div', {id: 'test1'}),
        elem('div', {id: 'test2'}),
      ]
    };
    const vNode = comp(component);
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    const elem2 = document.createElement('div');
    elem2.id = 'test2';
    mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
    expect(vNode.children[1].dom).toEqual(elem2);
  });

  test('comp() draw returns single text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => text('test')
    };
    const vNode = comp(compDef);
    const elem1 = document.createTextNode('test');
    mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
  });

  test('comp() draw returns array of text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: () => [
        text('test1'),
        text('test2'),
      ]
    };
    const vNode = comp(compDef);
    const elem1 = document.createTextNode('test1');
    const elem2 = document.createTextNode('test2');
    mount(app, vNode);
    expect(vNode.children[0].dom).toEqual(elem1);
    expect(vNode.children[1].dom).toEqual(elem2);
  });

  //test('html() with single html element', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div></div>');
  //  const elem1 = document.createElement('div');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
  
  //test('html() with single html element with text', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div>test1</div>');
  //  const elem1 = document.createElement('div');
  //  elem1.innerHTML = 'test1';
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});

  //test('html() with single html element with attribute', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div id="test1"></div>');
  //  const elem1 = document.createElement('div');
  //  elem1.id = 'test1';
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});

  //test('html() with multiple html elements', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div></div><div></div>');
  //  const elem1 = document.createElement('div');
  //  const elem2 = document.createElement('div');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //  expect(node.doms[1]).toEqual(elem2);
  //});

  //test('html() with multiple html elements with text', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div>test1</div><div>test2</div>');
  //  const elem1 = document.createElement('div');
  //  elem1.innerHTML = 'test1';
  //  const elem2 = document.createElement('div');
  //  elem2.innerHTML = 'test2';
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //  expect(node.doms[1]).toEqual(elem2);
  //});

  //test('html() with multiple html elements with attributes', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<div id="test1"></div><div id="test2"></div>');
  //  const elem1 = document.createElement('div');
  //  elem1.id = 'test1';
  //  const elem2 = document.createElement('div');
  //  elem2.id = 'test2';
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //  expect(node.doms[1]).toEqual(elem2);
  //});

  //test('html() with text and html element', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('test1<div>test2</div>');
  //  const elem1 = document.createTextNode('test1');
  //  const elem2 = document.createElement('div');
  //  elem2.innerHTML = 'test2';
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //  expect(node.doms[1]).toEqual(elem2);
  //});

  // some elements can only be children of specific elements,
  // and there are separate tests for each of these

  //test('html() with <caption>', () => {
  //  document.body.innerHTML = '<table></table>';
  //  const app = document.querySelector('table');
  //  const node = html('<caption>');
  //  const elem1 = document.createElement('caption');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <col>', () => {
  //  document.body.innerHTML = '<table><colgroup></colgroup><table>';
  //  const app = document.querySelector('colgroup');
  //  const node = html('<col>');
  //  const elem1 = document.createElement('col');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <thead>', () => {
  //  document.body.innerHTML = '<table><table>';
  //  const app = document.querySelector('table');
  //  const node = html('<thead>');
  //  const elem1 = document.createElement('thead');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <tbody>', () => {
  //  document.body.innerHTML = '<table><table>';
  //  const app = document.querySelector('table');
  //  const node = html('<tbody>');
  //  const elem1 = document.createElement('tbody');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <tr>', () => {
  //  document.body.innerHTML = '<table><tbody></tbody><table>';
  //  const app = document.querySelector('tbody');
  //  const node = html('<tr>');
  //  const elem1 = document.createElement('tr');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <td>', () => {
  //  document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
  //  const app = document.querySelector('tr');
  //  const node = html('<td>');
  //  const elem1 = document.createElement('td');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <tfoot>', () => {
  //  document.body.innerHTML = '<table><table>';
  //  const app = document.querySelector('table');
  //  const node = html('<tfoot>');
  //  const elem1 = document.createElement('tfoot');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <th>', () => {
  //  document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
  //  const app = document.querySelector('tr');
  //  const node = html('<th>');
  //  const elem1 = document.createElement('th');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <thead>', () => {
  //  document.body.innerHTML = '<table><table>';
  //  const app = document.querySelector('table');
  //  const node = html('<thead>');
  //  const elem1 = document.createElement('thead');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with all other HTML5 tags', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const obsoleteTags = ['acronym', 'applet', 'basefont', 'big', 'center', 'dir', 'font', 'strike', 'tt'];
  //  const validTags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'cite', 'code', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'textarea', 'time', 'title', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']
  //  obsoleteTags.concat(validTags).forEach(tag => {
  //    const node = html('<' + tag + '/>');
  //    const elem1 = document.createElement(tag);
  //    mount(app, node);
  //    expect(node.doms[0]).toEqual(elem1);
  //  });
  //});
//
  //test('html() with two nodes requiring specific parents', () => {
  //  document.body.innerHTML = '<table></table>';
  //  const app = document.querySelector('table');
  //  const node = html('<thead/><tbody/>');
  //  const elem1 = document.createElement('thead');
  //  const elem2 = document.createElement('tbody');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //  expect(node.doms[1]).toEqual(elem2);
  //});
//
  //test('html() with <svg/>', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<svg/>');
  //  const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with single svg element within elem()', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node1 = html('<g></g>');
  //  const node2 = elem('svg', node1);
  //  const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  //  mount(app, node2);
  //  expect(node1.doms[0]).toEqual(elem1);
  //});
//
  //test('html() with <math/>', () => {
  //  document.body.innerHTML = '<div id="app"></div>';
  //  const app = document.querySelector('#app');
  //  const node = html('<math/>');
  //  const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
  //  mount(app, node);
  //  expect(node.doms[0]).toEqual(elem1);
  //});
  
  test('Create div with attribute and modify it', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', {id: 'test1'});
    const node2 = elem('div', {id: 'test2'});
    const node3 = elem('div');
    mount(app, node1);
    expect(node1.dom.getAttribute('id')).toBe('test1');
    mount(app, node2);
    expect(node2.dom.getAttribute('id')).toBe('test2');
    mount(app, node3);
    expect(node3.dom.getAttribute('id')).toBe(null);
  });

  test('array of elem()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = elem('div', {id: 'test1'});
    const node2 = elem('div', {id: 'test2'});
    const mountedNode = mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(node1.dom.getAttribute('id')).toBe('test1');
    expect(node2.dom.getAttribute('id')).toBe('test2');
  });

  test('array of text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const node1 = text('test1');
    const node2 = text('test2');
    const text1 = document.createTextNode('test1');
    const text2 = document.createTextNode('test2');
    const mountedNode = mount(app, [node1, node2]);
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

  test('array of comp()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: vNode => text(vNode.attrs.text)
    };
    const node1 = comp(compDef, {
      text: 'test1'
    });
    const node2 = comp(compDef, {
      text: 'test2'
    });
    const text1 = document.createTextNode('test1');
    const text2 = document.createTextNode('test2');
    const mountedNode = mount(app, [node1, node2]);
    expect(mountedNode.children.length).toEqual(2);
    expect(mountedNode.children[0]).toEqual(node1);
    expect(mountedNode.dom.childNodes[0]).toEqual(text1);
    expect(mountedNode.children[1]).toEqual(node2);
    expect(mountedNode.dom.childNodes[1]).toEqual(text2);
  });

  test('array of comp(), elem() and text()', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = document.querySelector('#app');
    const compDef = {
      draw: vNode => text(vNode.attrs.text)
    };
    const node1 = elem('div', {id: 'test1'});
    const node2 = text('test2');
    const node3 = comp(compDef, {
      text: 'test3'
    });
    const elem1 = document.createElement('div');
    elem1.id = 'test1';
    const elem2 = document.createTextNode('test2');
    const elem3 = document.createTextNode('test3')
    const mountedNode = mount(app, [node1, node2, node3]);
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
    const node1 = elem('div');
    const node2 = elem('div');
    mount(app, node1);
    expect(() => {
      mount(node1.dom, node2);
    }).toThrow(Error);
  });

});