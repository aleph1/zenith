import z from './index';
import {
  VNodeAnyOrArray,
  VNodeComp,
  VNodeHTML,
  //VNodeFlatArray,
  VNodeTypes
} from './vNode.defs';

/*
Please do not use the test syntax as an approach to coding with Zenith!

The tests uses vNodes stored as const, as well as nested access to
children[*].children[*]..., which are both bad practice in the majority
of contexts. Writing the tests this way allows for slightly shorter code.

Refer to the documentation and examples for proper coding practices.
*/

// jest’s handling of promises with setTimeout is not function,
// so we create a deferred prommise and simulate the setTimeout
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

describe('Component definition, z.compDef()', () => {

  test('Throws error on missing draw function', () => {
    expect(() => {
      z.compDef({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }).toThrow(Error);
  });

  test('Returns an object with the passed draw function', () => {
    const draw = () => null;
    const compDef = z.compDef({
      draw
    });
    expect(compDef.draw).toBe(draw);
  });

  test('Returns an object with the correct type', () => {
    const compDef = z.compDef({
      draw: () => null
    });
    expect(compDef.type).toBe(VNodeTypes.compDef);
  });

  test('Returned object has init if passed', () => {
    const init = () => null;
    const compDef = z.compDef({
      draw: (): VNodeAnyOrArray => null,
      init
    });
    expect(compDef.init).toBe(init);
  });

  test('Returned object has tick if passed', () => {
    const tick = () => null;
    const compDef = z.compDef({
      draw: (): VNodeAnyOrArray => null,
      tick
    });
    expect(compDef.tick).toBe(tick);
  });

  test('Returned object has destroy if passed', () => {
    const destroy = () => null;
    const compDef = z.compDef({
      draw: (): VNodeAnyOrArray => null,
      destroy
    });
    expect(compDef.destroy).toBe(destroy);
  });

});

describe('vNode', () => {

  describe('z.elem()', () => {

    test('z.elem("div") returns an object with the expected properties', () => {
      const node = z.elem('div');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(node).toHaveProperty('type', VNodeTypes.elem);
      expect(node).toHaveProperty('tag', 'div');
      expect(node).toHaveProperty('attrs', {});
      expect(node).toHaveProperty('children', []);
    });

    test('z.elem("div", {id:"test"}) returns an object with the expected properties', () => {
      const node = z.elem('div', {id:'test'});
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(node).toHaveProperty('type', VNodeTypes.elem);
      expect(node).toHaveProperty('tag', 'div');
      expect(typeof node.attrs).toBe('object');
      expect(node.attrs).toHaveOnlyProperties(['id']);
      expect(node.attrs).toHaveProperty('id', 'test');
      expect(node).toHaveProperty('children', []);
    });

    test('z.elem("div") returns a vNode with a frozen empty attrs object', () => {
      const node = z.elem('div');
      expect(node.attrs).toEqual({});
      expect(Object.isFrozen(node.attrs)).toBe(true);
    });

    test('z.elem("div", {id:"test"}) returns a vNode with a frozen attrs object with the expected properties', () => {
      const node = z.elem('div', {id:'test'});
      expect(node.attrs).toEqual({id:'test'});
      expect(Object.isFrozen(node.attrs)).toBe(true);
    });

    test('Handles <svg>', () => {
      const node = z.elem('svg');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(node.type).toBe(VNodeTypes.elem);
      expect(node.tag).toBe('svg');
      expect(node.attrs).toEqual({});
      expect(node.children).toEqual([]);
    });

    test('Handles <math>', () => {
      const node = z.elem('math');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag', 'attrs', 'children']);
      expect(node.type).toBe(VNodeTypes.elem);
      expect(node.tag).toBe('math');
      expect(node.attrs).toEqual({});
      expect(node.children).toEqual([]);
    });

    test('Attempting to modify attrs throws an error', () => {
      const node = z.elem('div');
      expect(() => {
        node.attrs.id = 'test';
      }).toThrow(Error);
    });

    test('Handles children with keys', () => {
      const node1 = z.elem('div', {key:1});
      const node2 = z.elem('div', {key:2});
      z.elem('div', node1, node2);
      expect(node1.attrs.key).toBe(1);
      expect(node2.attrs.key).toBe(2);
    });

    test('Handles children with no keys', () => {
      const node1 = z.elem('div');
      const node2 = z.elem('div');
      z.elem('div', node1, node2);
      expect(node1.attrs.key).toBe(undefined);
      expect(node2.attrs.key).toBe(undefined);
    });

    test('Throws error on children with mixed keys', () => {
      expect(() => {
        z.elem('div',
          z.elem('div', {key:1}),
          z.elem('div')
        );
      }).toThrow(Error);
    });

    test('Handles single z.elem() child', () => {
      const node = z.elem('div', z.elem('div'));
      expect(node.children).toEqual([{
        tag: 'div',
        type: VNodeTypes.elem,
        attrs: {},
        children: [],
      }]);
    });

    test('Handles array with one z.elem()', () => {
      const node = z.elem('div', [z.elem('div')]);
      expect(node.children).toEqual([{
        tag: 'div',
        type: VNodeTypes.elem,
        attrs: {},
        children: [],
      }]);
    });

    test('Handles multiple z.elem() children', () => {
      const node = z.elem('div', z.elem('div'), z.elem('p'));
      expect(node.children).toEqual([
        {
          tag: 'div',
          type: VNodeTypes.elem,
          attrs: {},
          children: [],
        },
        {
          tag: 'p',
          type: VNodeTypes.elem,
          attrs: {},
          children: [],
        }
      ]);
    });

    test('Handles array with multiple z.elem() children', () => {
      const node = z.elem('div', [z.elem('div'), z.elem('p')]);
      expect(node.children).toEqual([
        {
          tag: 'div',
          type: VNodeTypes.elem,
          attrs: {},
          children: [],
        },
        {
          tag: 'p',
          type: VNodeTypes.elem,
          attrs: {},
          children: [],
        }
      ]);
    });

    test('Handles single null child', () => {
      const node = z.elem('div', null);
      expect(node.children).toEqual([null]);
    });

    test('Handles single null child array', () => {
      const node = z.elem('div', [null]);
      expect(node.children).toEqual([null]);
    });

    test('Handles single undefined child', () => {
      const node = z.elem('div', undefined);
      expect(node.children).toEqual([null]);
    });

    test('Handles single undefined child array', () => {
      const node = z.elem('div', [undefined]);
      expect(node.children).toEqual([null]);
    });

    test('Handles single false child', () => {
      const node = z.elem('div', false);
      expect(node.children).toEqual([null]);
    });

    test('Handles single false child array', () => {
      const node = z.elem('div', [false]);
      expect(node.children).toEqual([null]);
    });

    test('Handles single true child', () => {
      const node = z.elem('div', true);
      expect(node.children).toEqual([null]);
    });

    test('Handles single true child array', () => {
      const node = z.elem('div', [true]);
      expect(node.children).toEqual([null]);
    });

    test('Handles multiple null children', () => {
      const node = z.elem('div', null, null);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles mixed null children', () => {
      const node = z.elem('div', null, [null]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple null children array', () => {
      const node = z.elem('div', [null, null]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple undefined children', () => {
      const node = z.elem('div', undefined, undefined);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple undefined children array', () => {
      const node = z.elem('div', [undefined, undefined]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles mixed undefined children', () => {
      const node = z.elem('div', undefined, [undefined]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple false children', () => {
      const node = z.elem('div', false, false);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple false children array', () => {
      const node = z.elem('div', [false, false]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles mixed false children', () => {
      const node = z.elem('div', false, [false]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple true children', () => {
      const node = z.elem('div', true, true);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles multiple true children array', () => {
      const node = z.elem('div', [true, true]);
      expect(node.children).toEqual([null, null]);
    });

    test('Handles mixed true children', () => {
      const node = z.elem('div', true, [true]);
      expect(node.children).toEqual([null, null]);
    });

  });

  describe('z.comp()', () => {
  
    test('Returns a vNode with the correct type', () => {
      const compDef = z.compDef({
        draw: () => null
      });
      const node = z.comp(compDef);
      expect(node.type).toBe(VNodeTypes.comp);
    });

    test('Returns a vNode with the correct type when an incorrect type is passed', () => {
      const compDef = z.compDef({
        draw: () => null,
        type: 0
      });
      const node = z.comp(compDef);
      expect(node.type).toBe(VNodeTypes.comp);
    });

    test('Returns a vNode with a frozen empty attrs object', () => {
      const compDef = z.compDef({
        draw: () => null
      });
      const node = z.comp(compDef);
      expect(node.attrs).toEqual({});
      expect(Object.isFrozen(node.attrs)).toBe(true);
    });

    test('Returns a vNode with a frozen attrs object with the expected properties', () => {
      const compDef = z.compDef({
        draw: () => null
      });
      const node = z.comp(compDef, {
        id: 'test'
      });
      expect(node.attrs).toEqual({id:'test'});
      expect(Object.isFrozen(node.attrs)).toBe(true);
    });

    test('Returns a vNode with the component definition as .tag', () => {
      const compDef = z.compDef({
        draw: () => null
      })
      const node = z.comp(compDef);
      expect(node.tag).toBe(compDef);
    });

  });

  describe('z.text()', () => {

    test('Handles empty string', () => {
      const node = z.text('');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

    test('Handles non-empty string', () => {
      const node = z.text('test');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('test');
    });

    test('Handles number', () => {
      const node = z.text(1);
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('1');
    });

    test('Handles BigInt', () => {
      const node = z.text(BigInt(9007199254740991));
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('9007199254740991');
    });

    test('Handles null', () => {
      // eslint-disable-next-line
      const node = z.text(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

    test('Handles undefined', () => {
      const node = z.text(undefined as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

    test('Handles true', () => {
      const node = z.text(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

    test('Handles false', () => {
      const node = z.text(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

    test('Handles object', () => {
      const node = z.text({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.text);
      expect(node.tag).toBe('');
    });

  });

  describe('z.html()', () => {

    test('Returns the expected object', () => {
      const node = z.html('test');
      expect(node).not.toBeNull();
      expect(typeof node).toBe('object');
      expect(node).toHaveOnlyProperties(['type', 'tag']);
      expect(node.type).toBe(VNodeTypes.html);
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('test');
    });

    test('Handles string', () => {
      const node = z.html('test');
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('test');
    });

    test('Handles number', () => {
      const node = z.html(1 as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('1');
    });

    test('Handles BigInt', () => {
      const node = z.html(BigInt(9007199254740991) as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('9007199254740991');
    });

    test('Handles null', () => {
      const node = z.html(null as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('');
    });

    test('Handles true', () => {
      const node = z.html(true as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('');
    });

    test('Handles false', () => {
      const node = z.html(false as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(typeof node.tag).toBe('string');
      expect(node.tag).toBe('');
    });

  });

});

describe('DOM', () => {

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

    test('z.comp() with single z.elem(), redrawn deffered with single z.text()', () => {
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
      node3.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('z.comp() with single z.elem(), redrawn immediately with single z.text()', () => {
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
      node3.redraw(true);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toBe(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(text1);
    });

    test('z.comp() with single z.text(), redrawn deffered with single z.elem()', () => {
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
      node3.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(mountedNode.children[0]).toBe(node3);
      expect(mountedNode.children[0].children.length).toEqual(1);
      expect(mountedNode.children[0].children[0]).toEqual(node2);
      expect(mountedNode.children[0].children[0].dom).toEqual(elem1);
    });

    test('z.comp() with single z.text(), redrawn immediately with single z.elem()', () => {
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
      node3.redraw(true);
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


  });
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

  describe('Sorting', () => {

    test('unkeyed nodes sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0,1,2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.draw(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      [ids[0], ids[2]] = [ids[2], ids[0]];
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('0');
    });

    test('unkeyed nodes sort as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0,1,2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.draw(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      [ids[0], ids[2]] = [ids[2], ids[0]];
      list.redraw(true);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('0');
    });

    test('keyed nodes sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0,1,2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.draw(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      [ids[0], ids[2]] = [ids[2], ids[0]];
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('0');
    });

    test('keyed nodes sort as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0,1,2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.draw(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      [ids[0], ids[2]] = [ids[2], ids[0]];
      list.redraw(true);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('0');
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