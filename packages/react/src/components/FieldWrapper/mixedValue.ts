import * as React from "react";

// The mixed value state's helpers (GAP-153), in a module of its own that the
// package does not export: each field that takes `mixed` shares them, and
// FieldWrapper draws the reset.

/**
 * What a mixed field (GAP-153) draws in place of its own value: none, and
 * the mixed label as its placeholder, which is how a screen reader hears it
 * (an empty field's placeholder is read with it), once: the field has no
 * description of its own for it. A controlled field shows the empty text
 * until the product clears `mixed`; an uncontrolled one drops its default
 * value, and is emptied as it turns mixed (useClearWhenMixed). Shared by
 * Input and NumberInput.
 */
export function mixedFieldValue(
  mixed: boolean,
  mixedLabel: string,
  props: Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue"
  >,
): Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "placeholder"
> & { "data-mixed"?: "" } {
  if (!mixed) return {};
  return props.value !== undefined
    ? { value: "", placeholder: mixedLabel, "data-mixed": "" }
    : { defaultValue: undefined, placeholder: mixedLabel, "data-mixed": "" };
}

// React 18 warns on a server render that meets useLayoutEffect.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * An uncontrolled field's text is in the page, not in React. It is emptied
 * as the field turns mixed (and on mount, mixed), so the mixed label shows,
 * and on reset. The field is the one `field` is attached to, never one found
 * by id (ids repeat; a shadow root hides them), and `onCleared` empties
 * what React mirrors of it, a character count among them, without an input
 * event the product would read as an edit. A controlled field is given ""
 * instead (mixedFieldValue), and is left alone here.
 */
export function useMixedField(
  mixed: boolean,
  value: unknown,
  onCleared?: () => void,
) {
  const field = React.useRef<HTMLInputElement | null>(null);
  const latest = React.useRef({ value, onCleared });
  latest.current = { value, onCleared };
  const clear = React.useCallback(() => {
    if (latest.current.value !== undefined) return;
    if (field.current) field.current.value = "";
    latest.current.onCleared?.();
  }, []);
  // Only as it turns mixed: the visitor's typing after that is theirs.
  useIsomorphicLayoutEffect(() => {
    if (mixed) clear();
  }, [mixed, clear]);
  return { field, clear };
}

/** One ref for the field: the component's own and the caller's. */
export function useFieldRef<T>(
  own: React.MutableRefObject<T | null>,
  forwarded: React.ForwardedRef<T>,
) {
  return React.useCallback(
    (node: T | null) => {
      own.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [own, forwarded],
  );
}
