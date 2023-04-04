import z from './index';
import {
  VNodeTypes,
} from './vNode.defs';

describe('vNode creation', () => {

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

    test('Handles svg', () => {
      const vNode = z.elem('svg');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(vNode.type).toBe(VNodeTypes.elem);
      expect(vNode.tag).toBe('svg');
      expect(vNode.attrs).toEqual({});
      expect(vNode.children).toEqual([]);
    });

    test('Handles math', () => {
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

    // *** add tests for all possible parent types

  });

  describe('z.html()', () => {

    test('Handles single html element', () => {
      const vNode = z.html('<div></div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('div');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });
    
    test('Handles single html element with text', () => {
      const vNode = z.html('<div>test1</div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles single html element with attribute', () => {
      const vNode = z.html('<div id="test1"></div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles multiple html elements', () => {
      const vNode = z.html('<div></div><div></div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(2);
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      expect(vNode.dom.children[0]).toEqual(elem1);
      expect(vNode.dom.children[1]).toEqual(elem2);
    });

    test('Handles multiple html elements with text', () => {
      const vNode = z.html('<div>test1</div><div>test2</div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(2);
      const elem1 = document.createElement('div');
      elem1.innerHTML = 'test1';
      const elem2 = document.createElement('div');
      elem2.innerHTML = 'test2';
      expect(vNode.dom.children[0]).toEqual(elem1);
      expect(vNode.dom.children[1]).toEqual(elem2);
    });

    test('Handles multiple html elements with attributes', () => {
      const vNode = z.html('<div id="test1"></div><div id="test2"></div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(2);
      const elem1 = document.createElement('div');
      elem1.id = 'test1';
      const elem2 = document.createElement('div');
      elem2.id = 'test2';
      expect(vNode.dom.children[0]).toEqual(elem1);
      expect(vNode.dom.children[1]).toEqual(elem2);
    });

    test('Handles text and html element', () => {
      const vNode = z.html('test1<div>test2</div>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      // ***
      //const elem1 = document.createElement('tr');
      //expect(vNode.dom.children[0]).toEqual(elem1);
    });

    // tests for all possible parent types

    test('Handles <col/>', () => {
      const vNode = z.html('<col/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('col');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <caption/>', () => {
      const vNode = z.html('<caption/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('caption');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <colgroup/>', () => {
      const vNode = z.html('<colgroup/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('colgroup');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <tbody/>', () => {
      const vNode = z.html('<tbody/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('tbody');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <tfoot/>', () => {
      const vNode = z.html('<tfoot/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('tfoot');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <thead/>', () => {
      const vNode = z.html('<thead/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('thead');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <td/>', () => {
      const vNode = z.html('<td/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('td');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <th/>', () => {
      const vNode = z.html('<th/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('th');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <tr/>', () => {
      const vNode = z.html('<tr/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElement('tr');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <thead/><tbody/>', () => {
      const vNode = z.html('<thead/><tbody/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(2);
      const elem1 = document.createElement('thead');
      const elem2 = document.createElement('tbody');
      expect(vNode.dom.children[0]).toEqual(elem1);
      expect(vNode.dom.children[1]).toEqual(elem2);
    });

    test('Handles <svg/>', () => {
      const vNode = z.html('<svg/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

    test('Handles <math/>', () => {
      const vNode = z.html('<math/>');
      expect(vNode).not.toBeNull();
      expect(typeof vNode).toBe('object');
      expect(vNode).toHaveOnlyProperties(['type', 'tag' , 'dom', 'domLength']);
      expect(vNode.dom instanceof DocumentFragment).toBe(true);
      expect(vNode.domLength).toBe(1);
      const elem1 = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
      expect(vNode.dom.children[0]).toEqual(elem1);
    });

  });

});

describe('DOM creation', () => {

  describe('Elements', () => {

  });

  describe('Attributes', () => {

    test('Handles string attribute', () => {
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

  describe('Events', () => {

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

  describe('Forms', () => {

    test('When checked is true, checkbox is checked', () => {
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

    test('When checked is false, checkbox is unchecked', () => {
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

    test('When checked is omitted, checkbox is unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'checkbox'
      });
      z.draw(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('When checked is true, radio is checked', () => {
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

    test('When checked is false, radio is unchecked', () => {
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

    test('When checked is omitted, radio is unchecked', () => {
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