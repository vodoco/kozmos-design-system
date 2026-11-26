/**
 * Input's recipe and its status, shared by every field drawn on it
 * (PasswordInput, NumberInput, OTPInput, DatePicker, Search and the rest),
 * and the button at a field's end (GAP-154), for every framework that draws
 * one. React's `Input` and Vue's `KozmosInput` both build their element from
 * it. Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva } from "class-variance-authority";

export type InputStatus = "default" | "error" | "warning" | "success";

export const inputVariants = cva("kozmos-reset kozmos-input", {
  variants: {
    status: {
      default: "",
      error: "kozmos-input-error",
      warning: "kozmos-input-warning",
      success: "kozmos-input-success",
    },
    error: {
      true: "kozmos-input-error",
    },
  },
});

/**
 * Room for a button at the field's end, as PasswordInput keeps for its
 * toggle: the utility beats a caller's px-*, the owned rule holds in WebKit.
 */
export const INPUT_WITH_ACTION_CLASS =
  "kozmos-input-with-action pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]";
/**
 * The input's wrapper: with an action, the box the button sits in; without
 * one, a wrapper that draws no box of its own.
 */
export const INPUT_ACTION_FIELD_CLASS = "kozmos-reset kozmos-password-field";
export const INPUT_CONTROL_CLASS = "kozmos-input-control";
/** The action's button, and the glyph inside any field-end button. */
export const INPUT_ACTION_CLASS =
  "kozmos-reset kozmos-field-action kozmos-input-action";
export const FIELD_ACTION_ICON_CLASS = "kozmos-reset kozmos-field-action-icon";

/** How long "Copied" is said, and the check drawn, after a copy: 2 s. */
export const INPUT_COPIED_MS = 2000;

/**
 * What is announced after a copy. The same words twice are not read twice:
 * a second copy changes them by a no-break space.
 */
export function inputCopiedSaid(previous: string, copied: string) {
  return previous === copied ? `${copied}\u00a0` : copied;
}

/** The action button's name: a toggle's own, else the copy's or the edit's. */
export function inputActionLabel(action: {
  kind: "copy" | "toggle" | "edit";
  label?: string;
}) {
  return action.kind === "toggle"
    ? action.label
    : (action.label ?? (action.kind === "copy" ? "Copy" : "Edit"));
}
