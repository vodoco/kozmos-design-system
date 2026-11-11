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
 * An uncontrolled field that turns mixed after it is drawn shows its text
 * in the page, not in React: it is emptied as it turns mixed, so the mixed
 * label shows. A controlled field is given "" instead (mixedFieldValue).
 */
export function useClearWhenMixed(
  mixed: boolean,
  inputId: string,
  value: unknown,
) {
  // Only as it turns mixed: the visitor's typing after that is theirs. The
  // latest id and value are read from a ref, so `mixed` alone runs it.
  const latest = React.useRef({ inputId, value });
  latest.current = { inputId, value };
  useIsomorphicLayoutEffect(() => {
    if (mixed) clearUncontrolled(latest.current.inputId, latest.current.value);
  }, [mixed]);
}

/**
 * Reset, an uncontrolled field's text is the visitor's, in the page and not
 * in React: it is emptied, so the field shows its several values again.
 */
export function clearUncontrolled(inputId: string, value: unknown) {
  if (value !== undefined || typeof document === "undefined") return;
  const field = document.getElementById(inputId);
  if (field instanceof HTMLInputElement) field.value = "";
}
