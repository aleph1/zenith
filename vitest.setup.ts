import { expect } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var DEBUG: boolean;
  // eslint-disable-next-line no-var
  var BROWSER: boolean;
  // eslint-disable-next-line no-var
  var FRAME_TIME: number;
}

globalThis.DEBUG = false;
globalThis.BROWSER = false;
globalThis.FRAME_TIME = 16;

expect.extend({
  toHaveOnlyProperties(received: object, expected: string[]) {
    const receivedKeys = Object.keys(received);
    const expectedKeys = [...new Set(expected)];

    if (receivedKeys.length !== expectedKeys.length) return {
      pass: false,
      message: () =>
        'Received object contains ' +
        (receivedKeys.length < expectedKeys.length ? 'fewer' : 'more') +
        ' properties than expected'
    };

    const missingKeys = expectedKeys.filter(
      key => !receivedKeys.includes(key)
    );

    if (missingKeys.length) return {
      pass: false,
      message: () =>
        'Received object missing properties: ' + missingKeys.join(', ')
    };

    return {
      pass: true,
      message: () => 'Received object has only expected properties'
    };
  },

  toBeNullish(received: unknown) {
    const pass = received == null;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be null or undefined`
          : `expected ${received} to be null or undefined`
    };
  }
});

declare module 'vitest' {
  interface Assertion<T> {
    toHaveOnlyProperties(expected: string[]): T;
    toBeNullish(): T;
  }
}