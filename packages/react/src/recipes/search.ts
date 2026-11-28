/**
 * Search's recipe: the classes its field, icon and clear draw with, and how
 * the clear empties the field (GAP-161), for every framework that draws one.
 * React's `Search` and Vue's `KozmosSearch` both build their element from
 * it. Framework-free (`recipes.framework-free.test.ts`).
 */

/** The box the field, its icon and its clear sit in. */
export const SEARCH_BOX_CLASS = "relative flex items-center";
/**
 * The icon is at the inline start, left or right as the field reads, and
 * the text clears it there (owned CSS on kozmos-search-input): a physical
 * left-3 / pl-9 kept both on the left in a right-to-left field.
 */
export const SEARCH_ICON_CLASS =
  "absolute start-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none";
/** Hides the browser's own clear, which empties the field behind the product's back. */
export const SEARCH_INPUT_CLASS = "kozmos-search-input";

/**
 * Empties the field as typing would: through the value's own setter and an
 * input event, so the framework hears the field's change with "", bound or
 * not, and a product's state follows. Setting `value` on the element alone
 * changed the DOM behind the framework's back.
 */
export function emptySearchField(input: HTMLInputElement) {
  const setValue = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  )?.set;
  if (setValue) setValue.call(input, "");
  else input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
