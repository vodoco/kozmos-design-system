/**
 * Checkbox's recipe: the box, its mark and the words beside it, for every
 * framework that draws one. React's `Checkbox` (on Radix) and Vue's
 * `KozmosCheckbox` build the same elements from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

/** The column holding the row and the error under it. */
export const CHECKBOX_WRAPPER_CLASS = "flex flex-col gap-1.5 w-full";

/**
 * The row: the box beside its label, 44 tall at least. With a description
 * the box sits by the label's first line, else in the row's middle.
 */
export function checkboxRowClass(described: boolean) {
  return cn("flex min-h-11 gap-2", described ? "items-start" : "items-center");
}

/**
 * The box. `indeterminate` is painted exactly like `checked`: same border,
 * same fill. It is a real answer ("these disagree"), not a disabled or
 * half-pressed control, so it must not read as weaker than the other two.
 * Only the mark inside differs.
 */
export const CHECKBOX_CLASS =
  "peer h-5 w-5 shrink-0 rounded-marker border border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-theme-fill aria-checked:bg-theme-fill aria-checked:text-theme-fill-foreground aria-[checked=mixed]:border-theme-fill aria-[checked=mixed]:bg-theme-fill aria-[checked=mixed]:text-theme-fill-foreground";

/** The box in error, over `CHECKBOX_CLASS`. */
export const CHECKBOX_ERROR_CLASS =
  "border-destructive focus-visible:ring-destructive";

/** The indicator the mark is drawn in, checked or mixed. */
export const CHECKBOX_INDICATOR_CLASS =
  "flex items-center justify-center text-current";

/** The mark: a tick when checked, a dash when mixed. */
export const CHECKBOX_MARK_CLASS = "h-4 w-4";

/** The label alone, with no description under it. */
export const CHECKBOX_LABEL_CLASS =
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/** The error's words, under the row. */
export const CHECKBOX_ERROR_TEXT_CLASS = "text-sm text-destructive-text";
