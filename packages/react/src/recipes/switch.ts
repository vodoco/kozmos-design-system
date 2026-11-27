/**
 * Switch's recipe: the track, its thumb or its mixed dash, the state words
 * and the words beside it, for every framework that draws one. React's
 * `Switch` (on Radix) and Vue's `KozmosSwitch` build the same elements from
 * it. Framework-free (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

/** The column holding the row, the reset and the error under it. */
export const SWITCH_WRAPPER_CLASS = "flex flex-col gap-1.5 w-full";

/**
 * The row: the track beside its label, 44 tall at least. With a description
 * the track sits by the label's first line, else in the row's middle.
 */
export function switchRowClass(described: boolean) {
  return cn("flex min-h-11 gap-2", described ? "items-start" : "items-center");
}

/** The track, 44 by 24: the muted fill off, the theme fill on. */
export const SWITCH_CLASS =
  "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-muted-foreground bg-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-theme-fill aria-checked:bg-theme-fill";

/** The track in error, over `SWITCH_CLASS`. */
export const SWITCH_ERROR_CLASS =
  "border-destructive focus-visible:ring-destructive aria-checked:border-destructive aria-checked:bg-destructive";

/**
 * Mixed (decision 189): the track filled as when on, the destructive fill in
 * error as a checked one's, with the dash centred where the thumb was.
 */
export function switchMixedClass(hasError: boolean) {
  return cn(
    "justify-center",
    hasError
      ? "border-destructive bg-destructive"
      : "border-theme-fill bg-theme-fill",
  );
}

/**
 * The mixed dash: Checkbox's mixed mark, the minus at 16, in the colour the
 * thumb would be: the theme foreground on the theme fill, white in both
 * themes (5.6:1), and the surface on an error's fill, as its thumb.
 */
export function switchMixedDashClass(hasError: boolean) {
  return cn(
    "pointer-events-none h-4 w-4",
    hasError ? "text-background" : "text-theme-fill-foreground",
  );
}

/**
 * The thumb. On, it slides 20 toward the inline end: right, or left in a
 * right-to-left box, read from --kozmos-rtl as every direction rule is
 * (never :dir()). A bare translate-x-5 slid it right in both, out of a
 * right-to-left track.
 */
export const SWITCH_THUMB_CLASS =
  "pointer-events-none block h-5 w-5 rounded-pill bg-background shadow-raised ring-0 transition-transform data-[state=checked]:translate-x-[calc(1.25rem_*_(1_-_2_*_var(--kozmos-rtl,0)))] data-[state=unchecked]:translate-x-0";

/**
 * The thumb on the checked track is a mark on the theme fill: the theme
 * foreground, white in both themes (decision 59). On an error's track it
 * stays the surface, as SwiftUI and Compose draw it, so this is left out.
 */
export const SWITCH_THUMB_CHECKED_CLASS =
  "data-[state=checked]:bg-theme-fill-foreground";

/**
 * The state in words beside the track (GAP-162), 24 tall, so it is centred
 * on it with a description too.
 */
export const SWITCH_STATE_LABEL_CLASS =
  "flex h-6 shrink-0 items-center text-sm leading-5 text-muted-foreground peer-disabled:opacity-50";

/**
 * The label and its description beside the track, over ControlText's own
 * (recipes/control-text.ts): the track is 24 tall and the label's line 20,
 * so 2 down centres them.
 */
export const SWITCH_CONTROL_TEXT_CLASS = "pt-0.5";

/** The label alone, with no description under it. */
export const SWITCH_LABEL_CLASS =
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/** A label's words in error. */
export const SWITCH_LABEL_ERROR_CLASS = "text-destructive-text";

/** The error's words, under the row. */
export const SWITCH_ERROR_TEXT_CLASS = "text-sm text-destructive-text";
