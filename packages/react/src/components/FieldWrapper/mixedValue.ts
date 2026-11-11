import type React from "react";

// The mixed value state's helpers (GAP-153), in a module of its own that the
// package does not export: each field that takes `mixed` shares them, and
// FieldWrapper draws the reset.

/**
 * What a mixed field (GAP-153) draws in place of its own value: none, and
 * the mixed label as its placeholder. A controlled field shows the empty
 * text until the product clears `mixed`; an uncontrolled one drops its
 * default value. Shared by NumberInput.
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

/**
 * Reset, an uncontrolled field's text is the visitor's, in the page and not
 * in React: it is emptied, so the field shows its several values again.
 */
export function clearUncontrolled(inputId: string, value: unknown) {
  if (value !== undefined || typeof document === "undefined") return;
  const field = document.getElementById(inputId);
  if (field instanceof HTMLInputElement) field.value = "";
}
