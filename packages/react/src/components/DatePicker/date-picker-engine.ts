import React from "react";

/**
 * Whether the browser's own date picker button can give way to Kozmos's, read
 * from what the engine's CSS supports, not from its name: an engine with
 * `::-webkit-calendar-picker-indicator` draws its button there and Kozmos
 * hides it (Chromium); one with WebKit's segmented editor
 * (`::-webkit-datetime-edit`) and no such button draws none (Safari); one
 * with neither (Firefox 146) draws a button no page can hide. Firefox moves
 * over by itself the day it supports the pseudo-element (Mozilla bug
 * 2051201).
 */
export function canReplaceDatePicker() {
  const css = globalThis.CSS;
  if (typeof css?.supports !== "function") return false;
  return (
    css.supports("selector(::-webkit-calendar-picker-indicator)") ||
    css.supports("selector(::-webkit-datetime-edit)")
  );
}

const noSubscription = () => () => {};
/** False on the server and while hydrating; the engine's answer after. */
export const useCanReplaceDatePicker = () =>
  React.useSyncExternalStore(noSubscription, canReplaceDatePicker, () => false);

/**
 * A mixed date or time field (GAP-255) holds none of its own: a controlled
 * one is given "", an uncontrolled one drops its default (and is emptied as
 * it turns mixed, by useMixedField). No placeholder: a date or time input
 * draws none, so the mixed label is drawn over its empty segments
 * (`.kozmos-temporal-mixed`, hidden from screen readers) and said once, as
 * the field's description.
 */
export function mixedTemporalValue(
  mixed: boolean,
  props: { value?: unknown; defaultValue?: unknown },
): { value?: ""; defaultValue?: undefined; "data-mixed"?: "" } {
  if (!mixed) return {};
  return props.value !== undefined
    ? { value: "", "data-mixed": "" }
    : { defaultValue: undefined, "data-mixed": "" };
}

/** Sets a field's value as typing would, so React's onChange and a form's change listeners hear it. */
export function typeInto(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
