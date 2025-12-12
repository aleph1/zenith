import { expect, vi, afterAll } from 'vitest';
import type { MatcherContext } from 'vitest';

declare global {
	var DEBUG: boolean;
  var BROWSER: boolean;
  var FRAME_TIME: number;
}

global.DEBUG = true;
global.BROWSER = false;
global.FRAME_TIME = 16;

Object.defineProperty(window, 'navigator', { value: 'node' });
Object.defineProperty(window, 'userAgent', { value: 'node' });
Object.defineProperty(window, 'requestAnimationFrame', { 
  value: (callback: any) => {},
  writable: true,        // Add this
  configurable: true     // Add this
});

vi.useFakeTimers();

afterAll(() => {
  vi.clearAllTimers();
});

const matchers = {
  toHaveOnlyProperties(
    // a matcher is a method, it has access to Vitest context on `this`
    this: MatcherContext,
    received: Object,
    expected: Array<string>
  ) {
    const receivedKeys: Array<string> = Object.keys(received);
    const expectedKeys: Array<string> = Array.from(new Set<string>(expected));
    if(receivedKeys.length !== expectedKeys.length) return {
      pass: false,
      message: () => 'Received object contains ' + ( receivedKeys.length < expectedKeys.length ? 'less' : 'more' ) + ' properties than expected'
    }
    // validate expected keys
    const missingKeys = expectedKeys.filter(key => !receivedKeys.includes(key));
    if(missingKeys.length !== 0) return {
      pass: false,
      message: () => 'Received object missing properties: ' + missingKeys.join(', ')
    }
    return {
      pass: true,
      message: () => 'Received object has only expected properties'
    }
  },
  toBeNullish(
    this: MatcherContext,
    received: any
  ) {
    const pass = received == null;
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be null or undefined`
          : `expected ${received} to be null or undefined`
    };
  }
};

expect.extend(matchers);

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveOnlyProperties(expected: Array<string>): T;
    toBeNullish(): T;
  }
}