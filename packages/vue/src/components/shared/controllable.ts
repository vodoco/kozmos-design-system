import { computed, ref, type Ref } from "vue";

/**
 * Radix's useControllableState, which React's choice parts hold their value
 * in: the prop while it is given (not `undefined`), else a value of the
 * part's own, starting from `initial`. A change is told only when there is
 * one: the prop's, or the part's own, which it also keeps. Internal: the
 * package exports none of it.
 */
export function useControllable<T>(
  prop: () => T | undefined,
  initial: T,
  onChange: (next: T) => void,
) {
  const own = ref(initial) as Ref<T>;
  const controlled = () => prop() !== undefined;
  const value = computed<T>(() => (controlled() ? (prop() as T) : own.value));
  const set = (next: T) => {
    if (controlled()) {
      if (next !== prop()) onChange(next);
      return;
    }
    if (next === own.value) return;
    own.value = next;
    onChange(next);
  };
  return { value, set, own };
}
