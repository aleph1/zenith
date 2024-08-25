import z from '../src/index';
import {
	VNodeAnyOrArray,
  VNodeTypes
} from '../src/vNode.defs';

describe('z.compDef()', () => {

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