import z from './index';
import {
  VNodeTypes,
} from './vNode.defs';

describe('vNode', () => {

  describe('z.elem()', () => {

    test('z.elem("div") returns an object with the expected properties', () => {
      const vNode = z.elem('div');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(vNode).toHaveProperty('type', VNodeTypes.elem);
      expect(vNode).toHaveProperty('tag', 'div');
      expect(vNode).toHaveProperty('attrs', {});
      expect(vNode).toHaveProperty('children', []);
      //expect(vNode).toHaveProperty('keys', false);
    });

    test('z.elem("div", {id:"test"}) returns an object with the expected properties', () => {
      const vNode = z.elem('div', {id:"test"});
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(vNode).toHaveProperty('type', VNodeTypes.elem);
      expect(vNode).toHaveProperty('tag', 'div');
      expect(typeof vNode.attrs).toBe('object');
      expect(vNode.attrs).toHaveOnlyProperties(['id']);
      expect(vNode.attrs).toHaveProperty('id', 'test');
      //expect(vNode).toHaveProperty('children', []);
    });

    test('z.elem("div") returns a vNode with a frozen empty attrs object', () => {
      const vNode = z.elem('div');
      expect(vNode.attrs).toEqual({});
      expect(Object.isFrozen(vNode.attrs)).toBe(true);
    });

    test('z.elem("div", {id:"test"}) returns a vNode with a frozen attrs object with the expected properties', () => {
      const vNode = z.elem('div', {id:"test"});
      expect(vNode.attrs).toEqual({id:"test"});
      expect(Object.isFrozen(vNode.attrs)).toBe(true);
    });

    test('Handles <svg>', () => {
      const vNode = z.elem('svg');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(vNode.type).toBe(VNodeTypes.elem);
      expect(vNode.tag).toBe('svg');
      expect(vNode.attrs).toEqual({});
      expect(vNode.children).toEqual([]);
    });

    test('Handles <math>', () => {
      const vNode = z.elem('math');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(vNode.type).toBe(VNodeTypes.elem);
      expect(vNode.tag).toBe('math');
      expect(vNode.attrs).toEqual({});
      expect(vNode.children).toEqual([]);
    });

    test('Attempting to modify attrs throws an error', () => {
      const vNode = z.elem('div');
      expect(() => {
        vNode.attrs.id = 'test';
      }).toThrow(Error);
    });

    test('Children with keys', () => {
      const vNode1 = z.elem('div', {key:1});
      const vNode2 = z.elem('div', {key:2});
      const vNode3 = z.elem('div', vNode1, vNode2);
      expect(vNode1.attrs.key).toBe(1);
      expect(vNode2.attrs.key).toBe(2);
    });

    test('Children with no keys', () => {
      const vNode1 = z.elem('div');
      const vNode2 = z.elem('div');
      const vNode3 = z.elem('div', vNode1, vNode2);
      expect(vNode1.attrs.key).toBe(undefined);
      expect(vNode2.attrs.key).toBe(undefined);
    });

    test('Children with mixed keys throws error', () => {
      expect(() => {
        z.elem('div',
          z.elem('div', {key:1}),
          z.elem('div')
        );
      }).toThrow(Error);
    });

    test('Handles single z.elem() child', () => {
      const vNode = z.elem('div', z.elem('div'));
      expect(vNode.children).toEqual([{
        tag: 'div',
        type: VNodeTypes.elem,
        //keys: false,
        attrs: {},
        children: [],
      }]);
    });

    test('Handles array with one z.elem()', () => {
      const vNode = z.elem('div', [z.elem('div')]);
      expect(vNode.children).toEqual([{
        tag: 'div',
        type: VNodeTypes.elem,
        //keys: false,
        attrs: {},
        children: [],
      }]);
    });

    test('Handles mutliple z.elem() children', () => {
      const vNode = z.elem('div', z.elem('div'), z.elem('p'));
      expect(vNode.children).toEqual([
        {
          tag: 'div',
          type: VNodeTypes.elem,
          //keys: false,
          attrs: {},
          children: [],
        },
        {
          tag: 'p',
          type: VNodeTypes.elem,
          //keys: false,
          attrs: {},
          children: [],
        }
      ]);
    });

    test('Handles array with multiple z.elem()', () => {
      const vNode = z.elem('div', [z.elem('div'), z.elem('p')]);
      expect(vNode.children).toEqual([
        {
          tag: 'div',
          type: VNodeTypes.elem,
          //keys: false,
          attrs: {},
          children: [],
        },
        {
          tag: 'p',
          type: VNodeTypes.elem,
          //keys: false,
          attrs: {},
          children: [],
        }
      ]);
    });

    test('Handles single null child', () => {
      const vNode = z.elem('div', null);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single null child array', () => {
      const vNode = z.elem('div', [null]);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single undefined child', () => {
      const vNode = z.elem('div', undefined);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single undefined child array', () => {
      const vNode = z.elem('div', [undefined]);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single false child', () => {
      const vNode = z.elem('div', false);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single false child array', () => {
      const vNode = z.elem('div', [false]);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single true child', () => {
      const vNode = z.elem('div', true);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles single true child array', () => {
      const vNode = z.elem('div', [true]);
      expect(vNode.children).toEqual([null]);
    });

    test('Handles multiple null children', () => {
      const vNode = z.elem('div', null, null);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles mixed null children', () => {
      const vNode = z.elem('div', null, [null]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple null children array', () => {
      const vNode = z.elem('div', [null, null]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple undefined children', () => {
      const vNode = z.elem('div', undefined, undefined);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple undefined children array', () => {
      const vNode = z.elem('div', [undefined, undefined]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles mixed undefined children', () => {
      const vNode = z.elem('div', undefined, [undefined]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple false children', () => {
      const vNode = z.elem('div', false, false);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple false children array', () => {
      const vNode = z.elem('div', [false, false]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles mixed false children', () => {
      const vNode = z.elem('div', false, [false]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple true children', () => {
      const vNode = z.elem('div', true, true);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles multiple true children array', () => {
      const vNode = z.elem('div', [true, true]);
      expect(vNode.children).toEqual([null, null]);
    });

    test('Handles mixed true children', () => {
      const vNode = z.elem('div', true, [true]);
      expect(vNode.children).toEqual([null, null]);
    });

  });

  describe('z.text()', () => {

    test('Handles empty string', () => {
      const vNode = z.text('');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

    test('Handles non-empty string', () => {
      const vNode = z.text('test');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('test');
    });

    test('Handles number', () => {
      const vNode = z.text(1);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('1');
    });

    test('Handles BigInt', () => {
      const vNode = z.text(BigInt(9007199254740991));
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('9007199254740991');
    });

    test('Handles null', () => {
      const vNode = z.text(null as any);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

    test('Handles undefined', () => {
      const vNode = z.text(undefined as any);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

    test('Handles true', () => {
      const vNode = z.text(true as any);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

    test('Handles false', () => {
      const vNode = z.text(false as any);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

    test('Handles object', () => {
      const vNode = z.text({} as any);
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.text);
      expect(vNode.tag).toBe('');
    });

  });

  describe('z.comp()', () => {

  });

  describe('z.html()', () => {

    test('Handles text', () => {
      const vNode = z.html('test');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag']);
      expect(vNode.type).toBe(VNodeTypes.html);
      expect(vNode.tag).toBe('test');
    });

  });

});

describe('DOM', () => {

  describe('Creation with z.draw()', () => {

    test('z.elem() with no attributes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.elem('div');
      const elem1 = document.createElement('div');
      z.draw(app, vNode);
      expect(vNode.dom).toEqual(elem1);
    });

    test('z.elem() with attributes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.elem('div', {
        id: 'test'
      });
      const elem1 = document.createElement('div');
      elem1.id = 'test';
      z.draw(app, vNode);
      expect(vNode.dom).toEqual(elem1);
    });

    test('z.elem() with text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.elem('div', z.text('test'));
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test';
      z.draw(app, vNode);
      expect(vNode.dom).toEqual(elem1);
    });

    test('z.elem() with single z.elem() child', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode1 = z.elem('p');
      const vNode2 = z.elem('div', vNode1);
      const elem1 = document.createElement('p');
      const elem2 = document.createElement('div');
      elem2.appendChild(elem1);
      z.draw(app, vNode2);
      expect(vNode1.dom).toEqual(elem1);
      expect(vNode2.dom).toEqual(elem2);
    });

    //test('z.elem() with multiple z.elem() children', () => {
    //  document.body.innerHTML = '<div id="app"></div>';
    //  const app = document.querySelector('#app');
    //  const vNode1 = z.elem('p');
    //  const vNode2 = z.elem('div', vNode1);
    //  const elem1 = document.createElement('p');
    //  const elem2 = document.createElement('div');
    //  elem2.appendChild(elem1);
    //  z.draw(app, vNode2);
    //  expect(vNode1.dom).toEqual(elem1);
    //  expect(vNode2.dom).toEqual(elem2);
    //});

    test('z.elem() svg with z.html() child with multiple svg elements', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode1 = z.html('<g></g><rect/>');
      const vNode2 = z.elem('svg', vNode1);
      z.draw(app, vNode2);
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      expect(vNode1.dom[0].nodeName).toEqual('g');
      expect(vNode1.dom[0] instanceof SVGElement);
      expect((vNode1.dom[0] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      expect(vNode1.dom[1].nodeName).toEqual('rect');
      expect(vNode1.dom[1] instanceof SVGElement);
      expect((vNode1.dom[1] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('z.html() with single html element', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div></div>');
      const elem1 = document.createElement('div');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });
    
    test('z.html() with single html element with text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div>test1</div>');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with single html element with attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div id="test1"></div>');
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with multiple html elements', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div></div><div></div>');
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
      expect(vNode.dom[1]).toEqual(elem2);
    });

    test('z.html() with multiple html elements with text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div>test1</div><div>test2</div>');
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
      expect(vNode.dom[1]).toEqual(elem2);
    });

    test('z.html() with multiple html elements with attributes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<div id="test1"></div><div id="test2"></div>');
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
      expect(vNode.dom[1]).toEqual(elem2);
    });

    test('z.html() with text and html element', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('test1<div>test2</div>');
      const elem1 = document.createTextNode('test1');
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
      expect(vNode.dom[1]).toEqual(elem2);
    });

    // some elements can only be children of specific elements,
    // and there are separate tests for each of these

    test('z.html() with <caption>', () => {
      document.body.innerHTML = '<table></table>';
      const app = document.querySelector('table');
      const vNode = z.html('<caption>');
      const elem1 = document.createElement('caption');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <col>', () => {
      document.body.innerHTML = '<table><colgroup></colgroup><table>';
      const app = document.querySelector('colgroup');
      const vNode = z.html('<col>');
      const elem1 = document.createElement('col');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <thead>', () => {
      document.body.innerHTML = '<table><table>';
      const app = document.querySelector('table');
      const vNode = z.html('<thead>');
      const elem1 = document.createElement('thead');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <tbody>', () => {
      document.body.innerHTML = '<table><table>';
      const app = document.querySelector('table');
      const vNode = z.html('<tbody>');
      const elem1 = document.createElement('tbody');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <tr>', () => {
      document.body.innerHTML = '<table><tbody></tbody><table>';
      const app = document.querySelector('tbody');
      const vNode = z.html('<tr>');
      const elem1 = document.createElement('tr');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <td>', () => {
      document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
      const app = document.querySelector('tr');
      const vNode = z.html('<td>');
      const elem1 = document.createElement('td');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <tfoot>', () => {
      document.body.innerHTML = '<table><table>';
      const app = document.querySelector('table');
      const vNode = z.html('<tfoot>');
      const elem1 = document.createElement('tfoot');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <th>', () => {
      document.body.innerHTML = '<table><tbody><tr></tr></tbody><table>';
      const app = document.querySelector('tr');
      const vNode = z.html('<th>');
      const elem1 = document.createElement('th');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with <thead>', () => {
      document.body.innerHTML = '<table><table>';
      const app = document.querySelector('table');
      const vNode = z.html('<thead>');
      const elem1 = document.createElement('thead');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with all other HTML5 tags', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const obsoleteTags = ['acronym', 'applet', 'basefont', 'big', 'center', 'dir', 'font', 'strike', 'tt'];
      const validTags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'cite', 'code', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'textarea', 'time', 'title', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']
      obsoleteTags.concat(validTags).forEach(tag => {
        const vNode = z.html('<' + tag + '/>');
        const elem1 = document.createElement(tag);
        z.draw(app, vNode);
        expect(vNode.dom[0]).toEqual(elem1);
      });
    });

    test('z.html() with two nodes requiring specific parents', () => {
      document.body.innerHTML = '<table></table>';
      const app = document.querySelector('table');
      const vNode = z.html('<thead/><tbody/>');
      const elem1 = document.createElement('thead');
      const elem2 = document.createElement('tbody');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
      expect(vNode.dom[1]).toEqual(elem2);
    });

    test('z.html() with <svg/>', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<svg/>');
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

    test('z.html() with single svg element within elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode1 = z.html('<g></g>');
      const vNode2 = z.elem('svg', vNode1);
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      z.draw(app, vNode2);
      expect(vNode1.dom[0].nodeName).toEqual('g');
      expect(vNode1.dom[0] instanceof SVGElement);
      expect((vNode1.dom[0] as SVGElement).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('z.html() with <math/>', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const vNode = z.html('<math/>');
      const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
      z.draw(app, vNode);
      expect(vNode.dom[0]).toEqual(elem1);
    });

  });

  describe('Attributes with z.elem()', () => {

    test('z.elem() handles string attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div');
      const el2 = z.elem('div', {id: 'test'});
      const el3 = z.elem('div');
      z.draw(app, el1);
      expect(el1.dom.hasAttribute('id')).toBe(false);
      z.draw(app, el2);
      expect(el2.dom.hasAttribute('id')).toBe(true);
      expect(el2.dom.getAttribute('id')).toBe('test');
      z.draw(app, el3);
      expect(el3.dom.hasAttribute('id')).toBe(false);
    });

    test('Attribute of null is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: null});
      z.draw(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of undefined is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: undefined});
      z.draw(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of false is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: false});
      z.draw(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of true is equivalent to attribute="attribute"', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {disabled: true});
      z.draw(app, el1);
      expect(el1.dom.getAttribute('disabled')).toBe('disabled');
    });

    test('Attribute starting with "on" is applied as a function', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {
        onclick: vNode => {}
      });
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLElement).toBe(true);
      expect(typeof (el1.dom as HTMLElement).onclick).toBe('function');
    });

  });

  describe('Events with z.elem()', () => {

    test('onclick event is called', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('div', {
        onclick: callback
      });
      z.draw(app, el1);
      expect(callback).not.toBeCalled();
      expect(el1.dom instanceof HTMLElement).toBe(true);
      (el1.dom as HTMLElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onchange event is called on checkbox', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        type: 'checkbox',
        onclick: callback
      });
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
      expect(callback).not.toBeCalled();
      (el1.dom as HTMLInputElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
    });

    test('onchange event is called on radio when goes from unchecked to checked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        type: 'radio',
        onchange: callback
      });
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
      expect(callback).not.toBeCalled();
      (el1.dom as HTMLInputElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
    });

    test('onchange event is called on textarea', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('textarea', {
        onchange: callback
      });
      z.draw(app, el1);
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

  });

  describe('Forms with z.elem()', () => {

    test('Checkbox from z.elem("input", {type: "checkbox", checked: true}) is checked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'checkbox',
        checked: true
      });
      z.draw(app, el1);
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
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('Checkbox from z.elem("input", {type: "checkbox"}) is unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'checkbox'
      });
      z.draw(app, el1);
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
      z.draw(app, el1);
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
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('Radio from z.elem("input", {type: "radio"}) is unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'radio'
      });
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

  });

});