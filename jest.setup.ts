global.BROWSER = false;
global.FRAME_TIME = 16;

Object.defineProperty(window, 'navigator', {value: 'node'});
Object.defineProperty(window, 'userAgent', {value: 'node'});
Object.defineProperty(window, 'requestAnimationFrame', {value: (callback:any) =>{}});

jest.useFakeTimers();

//const spiedRequestAnimationFrame = jest.spyOn(window, 'requestAnimationFrame');
//spiedRequestAnimationFrame.mockImplementation((callback: FrameRequestCallback): number => {
//  return window.setTimeout(callback, global.FRAME_TIME);
//});
//

afterAll(() => {
//  spiedRequestAnimationFrame.mockRestore();
  jest.clearAllTimers();
});

const matchers = {
  toHaveOnlyProperties(
    // a matcher is a method, it has access to Jest context on `this`
    this: jest.MatcherContext,
    received: Object,
    expected: Array<string>
  ) {
    const receivedKeys:Array<string> = Object.keys(received);
    const expectedKeys:Array<string> = Array.from(new Set<string>(expected));
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
};

expect.extend(matchers);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveOnlyProperties(expected: Array<string>): R
    }
  }
}

export {};