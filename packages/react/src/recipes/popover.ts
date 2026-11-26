/**
 * Popover's recipe: the classes its panel and arrow are drawn with, their
 * defaults, and how a closed popover gives focus back, for every framework
 * that draws one. React's `Popover` parts build their elements from it, and
 * so do Vue's `KozmosPopover` parts. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

export const POPOVER_CONTENT_CLASS = "kozmos-reset kozmos-popover";
/** Where the panel sits beside its anchor unless told: centred, 4 off. */
export const POPOVER_CONTENT_DEFAULTS = {
  align: "center",
  sideOffset: 4,
} as const;

/**
 * The pointer tying a popover to what opened it: a filled triangle, 8 by 4,
 * that overlaps the bordered body by 1px, as Figma's tip does (site GAP-74).
 */
export const POPOVER_ARROW_CLASS = "kozmos-reset kozmos-popover-arrow";
export const POPOVER_ARROW_SIZE = { width: 8, height: 4 } as const;

/** Focuses `element` if it can take focus there and then; says whether it did. */
export function focusIfFocusable(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  const document = element.ownerDocument;
  if (element === document.body || element === document.documentElement)
    return false;
  element.focus({ preventScroll: true });
  return document.activeElement === element;
}
