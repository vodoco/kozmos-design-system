/**
 * Menu's recipe, shared with ContextMenu's (GAP-155) and SplitButton's: the
 * classes Menu's panel and rows draw with, how an `external` item reads and
 * where its new tab opens (decision 152), and how ContextMenu's keyboard
 * opens it at the focused item, for every framework that draws one. React's
 * `Menu` and `ContextMenu` parts build their elements from it, and so do
 * Vue's `KozmosMenu` and `KozmosContextMenu` parts. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

export const menuContentClass =
  "z-50 min-w-32 overflow-hidden rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

export const menuSubTriggerClass =
  "flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent";

export const menuItemClass =
  "relative flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

/** A checkbox or radio item: its indicator sits in the inset at its start. */
export const menuIndicatorItemClass =
  "relative flex cursor-default select-none items-center rounded-marker py-1.5 ps-8 pe-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const menuIndicatorClass =
  "absolute start-2 flex h-3.5 w-3.5 items-center justify-center";

export const menuLabelClass = "px-2 py-1.5 text-sm font-semibold";

export const menuSeparatorClass = "-mx-1 my-1 h-px bg-border";

export const menuShortcutClass = "ms-auto text-xs tracking-widest opacity-50";

export const menuSubIconClass = "kozmos-rtl-mirror ms-auto h-4 w-4";

/** The inset an `inset` item, label or submenu row starts at. */
export const MENU_INSET_CLASS = "ps-8";

/** A checkbox item's check, and a radio item's dot. */
export const MENU_CHECK_ICON_CLASS = "h-4 w-4";
export const MENU_RADIO_ICON_CLASS = "h-2 w-2 fill-current";

/**
 * An external item's icon, at the row's end, a gap from its words however
 * narrow the menu, pointing to the end: mirrored right to left, as Link's is.
 */
export const MENU_EXTERNAL_END_CLASS = "ms-auto flex shrink-0 ps-2";
export const MENU_EXTERNAL_ICON_CLASS = "kozmos-rtl-mirror h-4 w-4";
/** What a screen reader hears after an external item's name, by default. */
export const MENU_EXTERNAL_LABEL = "opens in a new tab";

// A target that keeps the page in this tab, as Link reads it. An empty
// target is this tab too.
const SAME_TAB = /^(?:_self|_parent|_top)?$/i;

/** Whether a caller's link `target` keeps the page in this tab. */
export function menuTargetKeepsTab(target: string | null | undefined) {
  return target != null && SAME_TAB.test(target);
}

/**
 * The keyboard's context-menu key and Shift+F10 open the menu at the item
 * that has focus, at its inline start and block end, in every browser and on
 * every system: a browser that fires `contextmenu` for them places it
 * somewhere of its own, and macOS's fire none.
 */
export function opensContextMenuFromKeyboard(event: {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}) {
  return (
    event.key === "ContextMenu" ||
    (event.key === "F10" &&
      event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey)
  );
}

/**
 * The reading direction the item is in: its nearest `dir` of "rtl" or
 * "ltr", else (`dir="auto"`, or none) its computed direction, which the
 * browser resolves.
 */
export function readsRightToLeft(item: HTMLElement) {
  const dir = item.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
  if (dir === "rtl" || dir === "ltr") return dir === "rtl";
  return getComputedStyle(item).direction === "rtl";
}

/**
 * Opens a context menu from the keyboard at `item`: its inline start and
 * block end, as a right click there would. The primitive opens the menu at
 * a contextmenu event's point.
 */
export function openContextMenuAt(item: HTMLElement) {
  const box = item.getBoundingClientRect();
  const rtl = readsRightToLeft(item);
  item.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rtl ? box.right : box.left,
      clientY: box.bottom,
    }),
  );
}

/** SplitButton's box, its two halves and an item's icon (GAP-168). */
export const SPLIT_BUTTON_CLASS = "inline-flex rounded-control shadow-raised";
/**
 * The main half. The seam tints the inline-end side alone: a colour on all
 * four sides outranked the outline variant's own, and its outline drew white
 * at a fifth over white (site GAP-73). On the subtle variant's pale fill
 * white does not show: the seam is the fill's pressed step, which an emotion
 * sets too (GAP-200).
 */
export const SPLIT_BUTTON_MAIN_CLASS = "rounded-e-none border-e focus:z-10";
export function splitButtonSeamClass(variant: string | null | undefined) {
  return variant === "subtle"
    ? "border-e-[var(--kz-button-bg-pressed)]"
    : "border-e-theme-fill-foreground/20";
}
export const SPLIT_BUTTON_MENU_CLASS = "rounded-s-none px-2 focus:z-10";
export const SPLIT_BUTTON_CHEVRON_CLASS = "h-4 w-4";
export const SPLIT_BUTTON_ITEM_WITH_ICON_CLASS = "gap-2";
export const SPLIT_BUTTON_ITEM_ICON_CLASS =
  "flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4";
