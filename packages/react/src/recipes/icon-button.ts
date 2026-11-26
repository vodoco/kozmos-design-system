/**
 * IconButton's recipe: the square box an icon-only Button draws at each
 * size, for every framework that draws one. React's `IconButton` adds it to
 * its Button, and Vue's `KozmosCodeBlock` adds it to the copy `KozmosButton`
 * it draws where React's CodeBlock draws an IconButton. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import type { ButtonSize } from "./button";

export function iconButtonSizeClass(size: ButtonSize | null | undefined) {
  if (size === "sm") return "h-icon-control-sm w-icon-control-sm px-0";
  if (size === "lg")
    return "h-icon-control-lg w-icon-control-lg px-0 [&>svg]:h-5 [&>svg]:w-5";
  return "h-icon-control w-icon-control px-0";
}

/**
 * The count an IconButton draws at its top-end corner (GAP-197): Counter's
 * `brand` recipe at `sm`, written out without the Counter module, which takes
 * 0.3 KB off every React part that embeds an IconButton. React's
 * `IconButton.test.tsx` holds the two equal; Vue's `KozmosIconButton` draws
 * its count from this too.
 */
export const ICON_BUTTON_COUNTER_CLASS =
  "kozmos-icon-button-counter inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-theme-fill px-[5px] text-[11px] font-semibold tabular-nums text-theme-fill-foreground";
