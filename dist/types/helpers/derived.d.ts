import { Signal } from './signal';
export interface DerivedSignal<T> extends Signal<T> {
    destroy(): void;
}
/**
 * Creates a computed signal that updates when any dependency changes.
 * Call destroy() in component cleanup to prevent memory leaks.
 *
 * @example
 * const firstName = signal('John');
 * const lastName = signal('Smith');
 * const fullName = derived(
 *   () => `${firstName.val} ${lastName.val}`,
 *   [firstName, lastName]
 * );
 * // In component cleanup:
 * removed: () => fullName.destroy()
 */
export declare const derived: <T>(fn: () => T, deps: Signal<any>[]) => DerivedSignal<T>;
