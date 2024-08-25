import z from '../src/index';
import {
  VNodeAnyOrArray,
  VNodeComp,
  VNodeHTML,
  //VNodeFlatArray,
  VNodeTypes
} from '../src/vNode.defs';

describe('Sorting', () => {

  test('Unkeyed z.elem() sort as expected when drawn deferred', () => {
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].tag).toEqual('0');
  });

  test('Unkeyed z.elem() sort as expected when drawn immediately', () => {
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
    list.draw(true);
    expect(list.children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].tag).toEqual('0');
  });

  test('Keyed z.elem() sort as expected when drawn deferred', () => {
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].tag).toEqual('0');
  });

  test('Keyed z.elem() sort as expected when drawn immediately', () => {
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
    list.draw(true);
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
    list.draw();
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
    list.draw();
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
    list.draw();
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
    list.draw();
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].tag).toEqual('2');
    expect(list.children[0].children[1].children[0].tag).toEqual('1');
  });

  test('Unkeyed z.comp() sort as expected when drawn deferred', () => {
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
  });

  test('Unkeyed z.comp() sort as expected when drawn deferred', () => {
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
    list.draw(true);
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
  });

  test('Keyed z.comp() sort as expected when drawn deferred', () => {
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].children[0].tag).toEqual('1');
    expect(list.children[0].children[1].children[0].children[0].tag).toEqual('0');
  });

  test('Keyed z.comp() sort as expected when drawn immediately', () => {
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
    list.draw(true);
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
    list.draw();
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
    list.draw();
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
    list.draw();
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
    list.draw();
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
    list.draw();
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
    list.draw();
    jest.advanceTimersByTime(global.FRAME_TIME);
    expect(list.children[0].children[0].children[0].type).toEqual(VNodeTypes.html);
    expect((list.children[0].children[0].children[0] as VNodeHTML).doms[0]).toEqual(elem2);
    expect(list.children[0].children[1].children[0].type).toEqual(VNodeTypes.html);
    expect((list.children[0].children[1].children[0] as VNodeHTML).doms[0]).toEqual(elem1);
  });

});