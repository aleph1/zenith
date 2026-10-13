type SignalSubscriber<T> = (val: T) => void;

export interface Signal<T> {
  get val(): T;
  set val(newVal: T);
  sub(fn: SignalSubscriber<T>): () => void;
  notify(): void;
}

/**
 * Creates a reactive value that notifies subscribers on change.
 * Uses strict inequality (!==) to detect changes, so object
 * mutations won't trigger notifications — use immutable updates
 * or call notify() manually.
 *
 * @example
 * const count = signal(0);
 * const unsub = count.sub(val => console.log(val));
 * count.val = 1; // logs 1
 * unsub();       // stop listening
 */
export const signal = <T>(val: T): Signal<T> => {
  let _val = val;
  const _fns = new Set<SignalSubscriber<T>>();

  const notify = () => {
    for (const fn of _fns) fn(_val);
  };

  return {
    get val() { return _val; },
    set val(newVal: T) {
      if (_val !== newVal) {
        _val = newVal;
        notify();
      }
    },
    sub(fn: SignalSubscriber<T>) {
      _fns.add(fn);
      return () => _fns.delete(fn);
    },
    notify
  };
};