/**
 * Drawer's recipe: the classes its scrim, panel at each side and placement,
 * close, header, footer, title and description are drawn with, for every
 * framework that draws one. React's `Drawer` parts build their elements from
 * it, and so do Vue's `KozmosDrawer` parts; BottomSheet's own classes are in
 * bottom-sheet.ts. Framework-free (`recipes.framework-free.test.ts`).
 */

/** The edge a drawer slides in from. */
export type DrawerSideName = "left" | "right" | "top" | "bottom";

export const DRAWER_OVERLAY_CLASS =
  "kozmos-modal-overlay fixed inset-0 z-50 bg-overlay-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0";
/** An inline drawer's scrim covers its region alone. */
export const DRAWER_OVERLAY_INLINE_CLASS =
  "kozmos-modal-overlay-inline absolute";

export const DRAWER_SIDE_CLASSES: Record<DrawerSideName, string> = {
  bottom:
    "kozmos-drawer-bottom inset-x-0 bottom-0 max-h-[80vh] rounded-t-container border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  left: "kozmos-drawer-left inset-y-0 left-0 h-full w-[min(100vw,24rem)] rounded-r-container border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "kozmos-drawer-right inset-y-0 right-0 h-full w-[min(100vw,24rem)] rounded-l-container border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  top: "kozmos-drawer-top inset-x-0 top-0 max-h-[80vh] rounded-b-container border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
};

/**
 * Inline, a side drawer floats in its region, as Pointr Cloud's Get started
 * panel (decisions 139 and 148): 16 from every edge it reaches; 420 wide, or
 * the region less 16 each side; as tall as its content up to the region less
 * 16 top and bottom; the container's corners and its border all round. A top
 * or bottom one, BottomSheet's, stays at its edge across the region.
 */
export const DRAWER_INLINE_SIDE_CLASSES: Partial<
  Record<DrawerSideName, string>
> = {
  left: "kozmos-drawer-inline-left left-4 top-4 max-h-[calc(100%-2rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "kozmos-drawer-inline-right right-4 top-4 max-h-[calc(100%-2rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
};

/**
 * The owned classes hold its place and surface where no @scope rule applies
 * (GAP-262); under @scope its utilities and a caller's decide.
 */
export const DRAWER_CONTENT_CLASS = "kozmos-drawer-content";
export const DRAWER_CONTENT_FIXED_CLASS = "fixed";
export const DRAWER_CONTENT_INLINE_CLASS = "kozmos-drawer-inline absolute";
export const DRAWER_CONTENT_SURFACE_CLASS =
  "z-50 flex flex-col gap-4 overflow-auto bg-background p-6 text-foreground shadow-overlay outline-none transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=open]:duration-300";
export const DRAWER_CONTENT_BORDER_CLASS = "border-border";
/** At its edge, inline, the region is a limit too: past it is the header. */
export const DRAWER_CONTENT_INLINE_EDGE_CLASS =
  "kozmos-drawer-inline-edge max-h-[min(100%,80vh)]";

/**
 * The drawer's panel classes, in the order React's `cn` joins them, before
 * a caller's: its place (fixed, or inline in its region), its surface and
 * its side's.
 */
export function drawerContentClasses(
  side: DrawerSideName,
  inline: boolean,
): (string | false)[] {
  return [
    DRAWER_CONTENT_CLASS,
    inline ? DRAWER_CONTENT_INLINE_CLASS : DRAWER_CONTENT_FIXED_CLASS,
    DRAWER_CONTENT_SURFACE_CLASS,
    DRAWER_CONTENT_BORDER_CLASS,
    (inline && DRAWER_INLINE_SIDE_CLASSES[side]) || DRAWER_SIDE_CLASSES[side],
    inline &&
      (side === "top" || side === "bottom") &&
      DRAWER_CONTENT_INLINE_EDGE_CLASS,
  ];
}

/**
 * The close: the icon button's size, its centre where touch's 44 puts it,
 * on the title (decision 82): 16 from the top at 44, 22 at 32.
 */
export const DRAWER_CLOSE_CLASS =
  "kozmos-drawer-close absolute end-4 top-[calc(1rem_+_(2.75rem_-_var(--density-icon-control-size-md,2.75rem))_/_2)] inline-flex h-icon-control w-icon-control items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-hover-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none";
/** The close's glyph, and the words that name it to a reader. */
export const MODAL_CLOSE_ICON_CLASS = "h-4 w-4";
export const MODAL_CLOSE_NAME_CLASS = "kozmos-modal-close-name sr-only";

/** Room for the close, the icon button's size (decision 82). */
export const DRAWER_HEADER_CLASS =
  "flex flex-col gap-2 pe-[calc(var(--density-icon-control-size-md,2.75rem)_+_0.25rem)] text-start";
export const DRAWER_FOOTER_CLASS =
  "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
export const DRAWER_TITLE_CLASS =
  "text-lg font-semibold leading-6 text-foreground";
export const DRAWER_DESCRIPTION_CLASS =
  "text-sm leading-5 text-muted-foreground";

/** What an inline panel with no title says in development. */
export const DRAWER_UNNAMED_PANEL_WARNING =
  "Drawer: an inline panel has no DrawerTitle, so nothing names it to a screen reader. Render a DrawerTitle in it, or pass aria-label.";

/** Focuses `element` if it is still there to take it; says whether it did. */
export function focusIfStillThere(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  element.focus({ preventScroll: true });
  return element.ownerDocument.activeElement === element;
}
