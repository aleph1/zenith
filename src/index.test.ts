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

// jest’s handling of promises with setTimeout is not functional,
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

    test('z.comp() child changes from one compDef to a different compDef when redrawn deferred', () => {
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
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toBe(1);
      expect(node.children[0].tag).toEqual(compDef2);
    });

    test('z.comp() child changes from one compDef to a different compDef when redrawn immediately', () => {
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
      node.redraw(true);
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
      node3.redraw(true);
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
      node3.redraw(true);
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
      node3.redraw(true);
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
      node3.redraw(true);
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
      node3.redraw(true);
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
      node3.redraw(true);
      expect(node3.children.length).toBe(1);
      expect(node3.children[0]).toEqual(node2);
      expect(node3.children[0].dom).toEqual(elem2);
    });

    test('z.comp() number of children decreases when redrawn deferred', () => {
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
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toEqual(1);
    });

    test('z.comp() number of children decreases when redrawn immediately', () => {
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
      node.redraw(true);
      expect(node.children.length).toEqual(1);
    });

    test('z.comp() number of children increases when redrawn deferred', () => {
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
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children.length).toEqual(2);
    });

    test('z.comp() number of children increases when redrawn immediately', () => {
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
      node.redraw(true);
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
      listNode.redraw();
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
      listNode.redraw();
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
      listNode.redraw();
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
      node.redraw(true);
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
      node.redraw(true);
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
      node.redraw(true);
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
      node.redraw(true);
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
      node.redraw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('svg');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    test('z.comp() child element namespace is correct when node changes from svg to xhtml', () => {
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
      node.redraw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('z.comp() child element namespace is correct when node changes from math to xhtml', () => {
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
      node.redraw(true);
      expect(node.children.length).toBe(1);
      expect(node.doms[0].nodeName.toLowerCase()).toBe('div');
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
    });

    test('z.comp() children namespaces change correctly', () => {
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
      node.redraw(true);
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
      node.redraw(true);
      expect(node.children.length).toBe(1);
      expect((node.doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
      expect(node.children[0].children[0].children.length).toBe(1);
      expect(((node.children[0].children[0] as VNodeComp).doms[0] as Element).namespaceURI).toEqual('http://www.w3.org/2000/svg');
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
      node.redraw(true);
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
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(1);
    });

    test('Destroyed as expected when redrawn after removal but before destroy', async () => {
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
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      expect(removeFn).toHaveBeenCalledTimes(1);
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(node.children[0].children.length).toEqual(2);
      expect(removeFn).toHaveBeenCalledTimes(1);
      await deferredPromise.resolve();
      expect(node.children[0].children.length).toEqual(1);
      expect(removeFn).toHaveBeenCalledTimes(1);
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
      // when we nullify the index and redraw, the old node will be maintained
      // due to its remove method returning a timeout
      values[0] = null;
      node.redraw(true);
      jest.advanceTimersByTime(global.FRAME_TIME);
      // at this point there should still be two nodes left, with the node
      // being removed still displaying its prior state
      expect(node.children.length).toEqual(2);
      expect((node.children[0].children[0].dom as Element).id).toEqual('test1');
      await deferredPromise.resolve();
      expect(node.children.length).toEqual(1);
      expect((node.children[0].children[0].dom as Element).id).toEqual('test2');
    });

  });

  describe('Sorting', () => {

    test('Unkeyed z.elem() sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].tag).toEqual('0');
    });

    test('Unkeyed z.elem() sort as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw(true);
      expect(list.children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw(true);
      expect(list.children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when keys removed', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1, 2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      ids.splice(1, 1);
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('2');
    });

    test('Keyed z.elem() sort as expected when keys removed and sorted', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1, 2];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
      ids.splice(1, 1);
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when keys added', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.push(2);
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('2');
    });

    test('Keyed z.elem() sort as expected when keys added and sorted', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids.push(2);
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when keys partially change', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.elem('li', {
          key: id
        }, z.text(id))))
      })
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
      ids[0] = 2;
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].tag).toEqual('1');
    });

    test('Unkeyed z.comp() sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id
        })))
      });
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
    });

    test('Unkeyed z.comp() sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const UnkeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id
        })))
      });
      const list = z.comp(UnkeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw(true);
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
    });

    test('Keyed z.comp() sort as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
    });

    test('Keyed z.comp() sort as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.reverse();
      list.redraw(true);
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
    });

    test('Keyed z.comp() sort as expected when keys removed', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1, 2];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].children[0].tag).toEqual('2');
      ids.splice(1, 1);
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('2');
    });

    test('Keyed z.comp() sort as expected when keys removed and sorted', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1, 2];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].children[0].tag).toEqual('2');
      ids.splice(1, 1);
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
    });

    test('Keyed z.comp() sort as expected when keys added', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1, 2];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.push(2);
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].children[0].tag).toEqual('2');
    });

    test('Keyed z.comp() sort as expected when keys added and sorted', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids.push(2);
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      expect(list.children[0].children[2].children[0].children[0].tag).toEqual('0');
    });

    test('Keyed z.elem() sort as expected when keys partially change', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.elem('li', z.text(vNode.attrs.id))
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('0');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
      ids[0] = 2;
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].children[0].tag).toEqual('2');
      expect(list.children[0].children[1].children[0].children[0].tag).toEqual('1');
    });

    test('Keyed z.comp() that returns z.html()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const ids = [0, 1];
      const ListItem = z.compDef({
        draw: vNode => z.html('<li>' + vNode.attrs.id + '</li>')
      });
      const KeyedList = z.compDef({
        draw: vNode => z.elem('ul', ids.map(id => z.comp(ListItem, {
          id: id,
          key: id
        })))
      });
      const elem1 = document.createElement('li');
      elem1.innerHTML = '0';
      const elem2 = document.createElement('li');
      elem2.innerHTML = '1';
      const list = z.comp(KeyedList);
      z.mount(app, list);
      expect(list.children[0].children[0].children[0].type).toEqual(VNodeTypes.html);
      expect((list.children[0].children[0].children[0] as VNodeHTML).doms[0]).toEqual(elem1);
      expect(list.children[0].children[1].children[0].type).toEqual(VNodeTypes.html);
      expect((list.children[0].children[1].children[0] as VNodeHTML).doms[0]).toEqual(elem2);
      ids.reverse();
      list.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(list.children[0].children[0].children[0].type).toEqual(VNodeTypes.html);
      expect((list.children[0].children[0].children[0] as VNodeHTML).doms[0]).toEqual(elem2);
      expect(list.children[0].children[1].children[0].type).toEqual(VNodeTypes.html);
      expect((list.children[0].children[1].children[0] as VNodeHTML).doms[0]).toEqual(elem1);
    });

  });

  describe('DOM Attributes with z.elem()', () => {

    test('Handles string attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: 'test'});
      z.mount(app, el1);
      expect(el1.dom.getAttribute('id')).toBe('test');
    });

    test('Handles attribute "class" string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node = z.elem('div', {
        class: 'test',
      });
      z.mount(app, node);
      expect(node.dom.className).toEqual('test');
    });

    test('Handles attribute "class" array', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node = z.elem('div', {
        class: ['test', 'test2'],
      });
      z.mount(app, node);
      expect(node.dom.className).toEqual('test test2');
    });

    test('Handles attribute "style" string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node = z.elem('div', {
        style: 'background-color: red'
      });
      z.mount(app, node);
      expect((node.dom as HTMLElement).style.backgroundColor).toEqual('red');
    });

    test('Handles attribute "style" object', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node = z.elem('div', {
        style: {
          backgroundColor: 'red',
        }
      });
      z.mount(app, node);
      expect((node.dom as HTMLElement).style.backgroundColor).toEqual('red');
    });

    test('Attribute of null is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: null});
      z.mount(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of undefined is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: undefined});
      z.mount(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of false is equivalent to no attribute', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {id: false});
      z.mount(app, el1);
      expect(el1.dom.getAttribute('id')).toBeNull();
    });

    test('Attribute of true is equivalent to attribute="attribute"', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {disabled: true});
      z.mount(app, el1);
      expect(el1.dom.getAttribute('disabled')).toBe('disabled');
    });

    test('Attribute starting with "on" is applied as a function', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('div', {
        onclick: e => e.stopImmediatePropagation()
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLElement).toBe(true);
      expect(typeof (el1.dom as HTMLElement).onclick).toBe('function');
    });

    test('Attribute starting with "on" is removed as expected when redrawn immediately', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let enabled = true;
      const callback = jest.fn();
      const compDef = z.compDef({
        draw: vNode => z.elem('div', {
          onclick: enabled ? callback : null
        })
      })
      const node = z.comp(compDef);
      z.mount(app, node);
      // *** add tests!!!
      enabled = false;
      node.redraw(true);
    });

    test('Attribute starting with "on" is removed as expected when redrawn deferred', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      let enabled = true;
      const callback = jest.fn();
      const compDef = z.compDef({
        draw: vNode => z.elem('div', {
          onclick: enabled ? callback : null
        })
      })
      const node = z.comp(compDef);
      z.mount(app, node);
      // *** add tests!!!
      enabled = false;
      node.redraw();
      jest.advanceTimersByTime(global.FRAME_TIME);
    });

    test('Attribute starting with "on" is removed as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('div', {
        onclick: e => e.stopImmediatePropagation()
      });
      const node2 = z.elem('div', {
      });
      z.mount(app, node1);
      expect(node1.dom instanceof HTMLElement).toEqual(true);
      expect(typeof (node1.dom as HTMLElement).onclick).toEqual('function');
      z.mount(app, node2);
      expect(node2.dom instanceof HTMLElement).toEqual(true);
      expect((node2.dom as HTMLElement).onclick).toEqual(null);
    });

  });

  describe('Lifecycle', () => {

    test('z.comp() with init is called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const initFn = jest.fn();
      const compDef = z.compDef({
        init: initFn,
        draw: () => z.elem('div'),
      });
      const vNode = z.comp(compDef);
      expect(initFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(initFn).toHaveBeenCalledTimes(1);
      vNode.redraw(true);
      expect(initFn).toHaveBeenCalledTimes(1);
    });

    test('z.comp() with draw is called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const drawFn = jest.fn(() => z.elem('div'));
      const compDef = z.compDef({
        draw: drawFn
      });
      const vNode = z.comp(compDef);
      expect(drawFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(drawFn).toHaveBeenCalledTimes(1);
      vNode.redraw(true);
      expect(drawFn).toHaveBeenCalledTimes(2);
    });

    test('z.comp() with drawn is called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const drawnFn = jest.fn(() => z.elem('div'));
      const compDef = z.compDef({
        draw: () => z.elem('div'),
        drawn: drawnFn
      });
      const vNode = z.comp(compDef);
      expect(drawnFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(drawnFn).toHaveBeenCalledTimes(1);
      vNode.redraw(true);
      expect(drawnFn).toHaveBeenCalledTimes(2);
    });

    test('z.comp() with remove is called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const removeFn = jest.fn();
      const compDef = z.compDef({
        draw: () => z.elem('div'),
        remove: removeFn
      });
      const vNode = z.comp(compDef);
      expect(removeFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(removeFn).toHaveBeenCalledTimes(0);
      vNode.redraw(true);
      expect(removeFn).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(removeFn).toHaveBeenCalledTimes(1);
    });

    test('z.comp() with destroy is called as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const destroyFn = jest.fn();
      const compDef = z.compDef({
        draw: () => z.elem('div'),
        destroy: destroyFn
      });
      const vNode = z.comp(compDef);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      vNode.redraw(true);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(destroyFn).toHaveBeenCalledTimes(1);
    });

    test('z.comp() lifecycle hooks are called in correct order', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const initFn = jest.fn();
      const drawFn = jest.fn(() => z.elem('div'));
      const drawnFn = jest.fn();
      const removeFn = jest.fn();
      const destroyFn = jest.fn();
      const compDef = z.compDef({
        init: initFn,
        draw: drawFn,
        drawn: drawnFn,
        remove: removeFn,
        destroy: destroyFn,
      });
      const initSpy = jest.spyOn(compDef, 'init');
      const drawSpy = jest.spyOn(compDef, 'draw');
      const drawnSpy = jest.spyOn(compDef, 'drawn');
      const removeSpy = jest.spyOn(compDef, 'remove');
      const destroySpy = jest.spyOn(compDef, 'destroy');
      const vNode = z.comp(compDef);
      expect(initFn).toHaveBeenCalledTimes(0);
      expect(drawFn).toHaveBeenCalledTimes(0);
      expect(drawFn).toHaveBeenCalledTimes(0);
      expect(removeFn).toHaveBeenCalledTimes(0);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(initFn).toHaveBeenCalledTimes(1);
      expect(drawFn).toHaveBeenCalledTimes(1);
      expect(drawFn).toHaveBeenCalledTimes(1);
      expect(removeFn).toHaveBeenCalledTimes(0);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      vNode.redraw(true);
      expect(initFn).toHaveBeenCalledTimes(1);
      expect(drawFn).toHaveBeenCalledTimes(2);
      expect(drawFn).toHaveBeenCalledTimes(2);
      expect(removeFn).toHaveBeenCalledTimes(0);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(initFn).toHaveBeenCalledTimes(1);
      expect(drawFn).toHaveBeenCalledTimes(2);
      expect(drawFn).toHaveBeenCalledTimes(2);
      expect(removeFn).toHaveBeenCalledTimes(1);
      expect(destroyFn).toHaveBeenCalledTimes(1);
      const initOrder = initSpy.mock.invocationCallOrder[0];
      const drawOrder = drawSpy.mock.invocationCallOrder[0];
      const drawnOrder = drawnSpy.mock.invocationCallOrder[0];
      const removeOrder = removeSpy.mock.invocationCallOrder[0];
      const destroyOrder = destroySpy.mock.invocationCallOrder[0];
      expect(initOrder).toBeLessThan(drawOrder);
      expect(drawOrder).toBeLessThan(drawnOrder);
      expect(drawnOrder).toBeLessThan(removeOrder);
      expect(removeOrder).toBeLessThan(destroyOrder);
    });

    test('Destroying z.comp() on unmount when parent z.comp() has GUI', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const destroyFn1 = jest.fn();
      const destroyFn2 = jest.fn();
      const listItemDef = z.compDef({
        draw: () => z.elem('div'),
        destroy: destroyFn2
      });
      const listDef = z.compDef({
        draw: () => z.elem('div',
          z.comp(listItemDef)
        ),
        destroy: destroyFn1
      });
      const vNode = z.comp(listDef);
      const listDefDestroy1Spy = jest.spyOn(listDef, 'destroy');
      const listDefDestroy2Spy = jest.spyOn(listItemDef, 'destroy');
      expect(destroyFn1).toHaveBeenCalledTimes(0);
      expect(destroyFn2).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(destroyFn1).toHaveBeenCalledTimes(0);
      expect(destroyFn2).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(destroyFn1).toHaveBeenCalledTimes(1);
      expect(destroyFn2).toHaveBeenCalledTimes(1);
      const listDefDestroy1Order = listDefDestroy1Spy.mock.invocationCallOrder[0];
      const listDefDestroy2Order = listDefDestroy2Spy.mock.invocationCallOrder[0];
      expect(listDefDestroy1Order).toBeLessThan(listDefDestroy2Order);
    });

    test('Destroying z.comp() on unmount when parent z.comp() has no GUI', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const destroyFn1 = jest.fn();
      const destroyFn2 = jest.fn();
      const listItemDef = z.compDef({
        draw: () => z.elem('div'),
        destroy: destroyFn2
      });
      const listDef = z.compDef({
        draw: () => z.comp(listItemDef),
        destroy: destroyFn1
      });
      const vNode = z.comp(listDef);
      const listDefDestroy1Spy = jest.spyOn(listDef, 'destroy');
      const listDefDestroy2Spy = jest.spyOn(listItemDef, 'destroy');
      expect(destroyFn1).toHaveBeenCalledTimes(0);
      expect(destroyFn2).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(destroyFn1).toHaveBeenCalledTimes(0);
      expect(destroyFn2).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(destroyFn1).toHaveBeenCalledTimes(1);
      expect(destroyFn2).toHaveBeenCalledTimes(1);
      const listDefDestroy1Order = listDefDestroy1Spy.mock.invocationCallOrder[0];
      const listDefDestroy2Order = listDefDestroy2Spy.mock.invocationCallOrder[0];
      expect(listDefDestroy1Order).toBeLessThan(listDefDestroy2Order);
    });

    test('Destroying z.comp() on unmount with parent is z.elem()', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const destroyFn = jest.fn();
      const compDef = z.compDef({
        draw: () => z.elem('div'),
        destroy: destroyFn
      });
      const vNode = z.elem('div', z.comp(compDef));
      const compDefDestroySpy = jest.spyOn(compDef, 'destroy');
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, vNode);
      expect(destroyFn).toHaveBeenCalledTimes(0);
      z.mount(app, null);
      expect(destroyFn).toHaveBeenCalledTimes(1);
    });

  });

  describe('Forms', () => {

    test('input value can be set as text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        value: 'test'
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).value).toBe('test');
    });

    test('input value can be set as a number', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        value: 2
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).value).toBe('2');
    });

    test('input value of null is an empty string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        value: null
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).value).toBe('');
      expect((el1.dom as HTMLInputElement).getAttribute('value')).toBe(null);
    });

    test('input value is updated when DOM value differs from vNode value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('input', {
        value: 'test',
      });
      const node2 = z.elem('input', {
        value: 'test2',
      });
      z.mount(app, node1);
      (node1.dom as HTMLInputElement).value += '1';
      z.mount(app, node2);
      expect((node1.dom as HTMLInputElement).value).toBe('test2');
    });

    test('<option> value can be set as text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('option', {
        value: 'test'
      });
      const el2 = z.elem('select',
        el1
      );
      z.mount(app, el2);
      expect(el1.dom instanceof HTMLOptionElement);
      expect((el1.dom as HTMLOptionElement).value).toBe('test');
    });

    test('<option> value can be set as a number', () => {
      const app = document.querySelector('#app');
      const el1 = z.elem('option', {
        value: 2
      });
      const el2 = z.elem('select',
        el1
      );
      z.mount(app, el2);
      expect(el1.dom instanceof HTMLOptionElement);
      expect((el1.dom as HTMLOptionElement).value).toBe('2');
    });

    test('<option> value of null is an empty string', () => {
      const app = document.querySelector('#app');
      const el1 = z.elem('option', {
        value: null
      });
      const el2 = z.elem('select',
        el1
      );
      z.mount(app, el2);
      expect(el1.dom instanceof HTMLOptionElement);
      expect((el1.dom as HTMLInputElement).value).toBe('');
      expect((el1.dom as HTMLInputElement).getAttribute('value')).toBe(null);
    });

    test('<option> value is updated when DOM value differs from vNode value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('option', {
        value: 'test',
      });
      const node2 = z.elem('option', {
        value: 'test2',
      });
      z.mount(app, node1);
      (node1.dom as HTMLOptionElement).value += '1';
      z.mount(app, node2);
      expect((node1.dom as HTMLOptionElement).value).toBe('test2');
    });

    test('textarea value can be set as text', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('textarea', {
        value: 'test'
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLTextAreaElement);
      expect((el1.dom as HTMLTextAreaElement).value).toBe('test');
    });

    test('textarea value can be set as a number', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('textarea', {
        value: '2'
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLTextAreaElement);
      expect((el1.dom as HTMLTextAreaElement).value).toBe('2');
    });

    test('textarea value of null is an empty string', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('textarea', {
        value: null
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLTextAreaElement);
      expect((el1.dom as HTMLTextAreaElement).value).toBe('');
      expect((el1.dom as HTMLTextAreaElement).getAttribute('value')).toBe(null);
    });

    test('textarea value is updated when DOM value differs from vNode value', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const node1 = z.elem('textarea', {
        value: 'test',
      });
      const node2 = z.elem('textarea', {
        value: 'test2',
      });
      z.mount(app, node1);
      (node1.dom as HTMLTextAreaElement).value += '1';
      z.mount(app, node2);
      expect((node1.dom as HTMLTextAreaElement).value).toBe('test2');
    });

    test('Checkbox from z.elem("input", {type: "checkbox", checked: true}) is checked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'checkbox',
        checked: true
      });
      z.mount(app, el1);
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
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('Checkbox from z.elem("input", {type: "checkbox"}) is unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'checkbox'
      });
      z.mount(app, el1);
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
      z.mount(app, el1);
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
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('Radio from z.elem("input", {type: "radio"}) is unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const el1 = z.elem('input', {
        type: 'radio'
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
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
      z.mount(app, el1);
      expect(callback).not.toBeCalled();
      expect(el1.dom instanceof HTMLElement).toBe(true);
      (el1.dom as HTMLElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onclick removed when missing', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('div', {
        onclick: callback
      });
      const el2 = z.elem('div');
      z.mount(app, el1);
      z.mount(app, el2);
      (el2.dom as HTMLElement).click();
      expect(callback).toHaveBeenCalledTimes(0);
    });

    test('onclick removed when null', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('div', {
        onclick: callback
      });
      const el2 = z.elem('div', {
        onclick: null
      });
      z.mount(app, el1);
      z.mount(app, el2);
      (el2.dom as HTMLElement).click();
      expect(callback).toHaveBeenCalledTimes(0);
    });

    test('onclick removed when undefined', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('div', {
        onclick: callback
      });
      const el2 = z.elem('div', {
        onclick: undefined
      });
      z.mount(app, el1);
      z.mount(app, el2);
      (el2.dom as HTMLElement).click();
      expect(callback).toHaveBeenCalledTimes(0);
    });

    test('onchange is called when input value changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        onchange: callback
      });
      z.mount(app, el1);
      (el1.dom as HTMLInputElement).value = 'test';
      el1.dom.dispatchEvent(new Event('change', {
        bubbles: true,
        cancelable: true
      }));
      expect((el1.dom as HTMLInputElement).value).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onchange is called when checkbox goes from unchecked to checked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        type: 'checkbox',
        onclick: callback
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
      expect(callback).not.toBeCalled();
      (el1.dom as HTMLInputElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
    });

    test('onchange event when checkbox goes from checked to unchecked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        type: 'checkbox',
        checked: true,
        onchange: callback
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(true);
      expect(callback).not.toBeCalled();
      (el1.dom as HTMLInputElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
    });

    test('onchange event when radio goes from unchecked to checked', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('input', {
        type: 'radio',
        onchange: callback
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(false);
      expect(callback).not.toBeCalled();
      (el1.dom as HTMLInputElement).click();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(el1.dom instanceof HTMLInputElement).toBe(true);
      expect((el1.dom as HTMLInputElement).checked).toBe(true);
    });

    test('onchange is called when textarea value changes', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('textarea', {
        onchange: callback
      });
      z.mount(app, el1);
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

    test('oninput is called on element with contenteditable=true', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn();
      const el1 = z.elem('div', {
        contenteditable: 'true',
        oninput: callback
      });
      z.mount(app, el1);
      (el1.dom as Element).textContent = 'test';
      el1.dom.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
      }));
      expect((el1.dom as Element).textContent).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('onsubmit event is called on form', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const callback = jest.fn(e => e.preventDefault());
      const el1 = z.elem('form', {
        onsubmit: callback
      });
      z.mount(app, el1);
      expect(el1.dom instanceof HTMLFormElement).toBe(true);
      (el1.dom as HTMLFormElement).submit();
      expect(callback).toHaveBeenCalledTimes(1);
    });

  });

  describe('Tick', () => {

    test('z.elem() ticks as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const tick = jest.fn();
      const el1 = z.elem('div', {
        tick
      });
      z.mount(app, el1);
      expect(tick).not.toBeCalled();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(tick).toHaveBeenCalledTimes(1);
    });

    test('z.elem() stops ticking when destroyed', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const tick = jest.fn();
      const el1 = z.elem('div', {
        tick
      });
      const el2 = z.elem('div');
      z.mount(app, el1);
      z.mount(app, null);
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(tick).not.toBeCalled();
    });

    test('z.comp() ticks as expected', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const tick = jest.fn();
      const compDef = z.compDef({
        draw: vNode => z.elem('div'),
        tick
      });
      const comp1 = z.comp(compDef);
      z.mount(app, comp1);
      expect(tick).not.toBeCalled();
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(tick).toHaveBeenCalledTimes(1);
    });

    test('z.comp() stops ticking when destroyed', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const app = document.querySelector('#app');
      const tick = jest.fn();
      const compDef = z.compDef({
        draw: vNode => z.elem('div'),
        tick
      });
      const comp1 = z.comp(compDef);
      z.mount(app, comp1);
      z.mount(app, null);
      jest.advanceTimersByTime(global.FRAME_TIME);
      expect(tick).not.toBeCalled();
    });

  });

});