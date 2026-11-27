/**
 * Tooltip's recipe: the classes its surface, in each tone, and its arrow are
 * drawn with, and a disabled trigger's wrapper, for every framework that
 * draws one. React's `Tooltip` parts build their elements from it, and so do
 * Vue's `KozmosTooltip` parts. Framework-free (`recipes.framework-free.test.ts`).
 */

/** The surface's tones (decision 192, GAP-210). */
export type TooltipToneName = "default" | "inverse";

/**
 * The surface each tone draws: the popover's, with its border, or the
 * inverse surface under its words, with the border in the surface's own
 * colour so the tooltip keeps its size (decision 192, GAP-210).
 */
export const TOOLTIP_TONE_CLASSES = {
  default: "border bg-popover px-3 py-1.5 text-sm text-popover-foreground",
  inverse:
    "border border-inverse bg-inverse px-3 py-1.5 text-sm text-inverse-foreground",
} as const;
export const TOOLTIP_ARROW_CLASSES = {
  default: "-translate-y-px fill-popover",
  inverse: "-translate-y-px fill-inverse",
} as const;

export const TOOLTIP_CONTENT_CLASS = "z-50 overflow-visible rounded-control";
export const TOOLTIP_CONTENT_MOTION_CLASS =
  "shadow-overlay animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
/**
 * The tip, 8 by 4, overlaps the body by 1px, as Figma's Tooltip tip does: it
 * covers the body's border where the two meet (site GAP-74).
 */
export const TOOLTIP_ARROW_SIZE = { width: 8, height: 4 } as const;

/** A disabled control's focusable wrapper, which the tooltip listens on. */
export const TOOLTIP_DISABLED_TRIGGER_CLASS = "inline-flex";

/** The tone a value draws: `inverse`, or the default. */
export const tooltipTone = (tone: string | undefined): TooltipToneName =>
  tone === "inverse" ? "inverse" : "default";
