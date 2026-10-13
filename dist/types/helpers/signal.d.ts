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
export declare const signal: <T>(val: T) => Signal<T>;
export {};
