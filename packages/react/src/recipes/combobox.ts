/**
 * Combobox's recipe: its field's end buttons, shared with MultiSelect, its
 * popup's classes, and how it filters and picks the option it makes active,
 * for every framework that draws one. React's `Combobox` builds its elements
 * from it, and so does Vue's `KozmosCombobox`. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/**
 * The clear and open buttons Combobox and MultiSelect draw at their field's
 * end, from one copy so the two cannot drift (decision 82; owner, 24 Oct
 * 2026). Internal.
 *
 * - The row sits out of the field's line, at its end, so the field keeps its
 *   height; it lets presses through between the buttons.
 * - Each button is as tall as the field, its hit target: 44 in touch, 40 in
 *   compact. It fills nothing of its own, so the field's edge it lies over
 *   stays drawn. Hovered, it draws a fill inside itself, 4 in from its edges
 *   and its corners the field's less 4, as Input's, PasswordInput's,
 *   DatePicker's and TimePicker's buttons do (decision 164): the owned rule
 *   on `kozmos-combobox-action` in owned-native-fields.css, with no fill at
 *   rest, disabled or in forced colours. MultiSelect's field draws no ring
 *   of its own while one of them has focus (owned-selection.css).
 * - The room is the field's padding at its end, after its own padding, so a
 *   caller's `px-*` sets the start and this end stays; a caller's `p-*` or
 *   `pe-*` replaces it, and content then runs under the buttons.
 */
export const FIELD_ACTIONS_ROW =
  "kozmos-combobox-actions pointer-events-none absolute inset-y-0 end-0 flex items-center";

export const FIELD_ACTION =
  "kozmos-combobox-action pointer-events-auto inline-flex h-field w-field items-center justify-center rounded-control text-muted-foreground ring-offset-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Room for the open button, and the clear beside it when there is one. */
export function fieldActionsRoom(withClear: boolean) {
  return withClear
    ? "pe-[calc(var(--density-field-height-md,2.75rem)_*_2_+_0.5rem)]"
    : "pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]";
}

/** The end buttons' glyphs: the clear's X, and the chevron, turned while open. */
export const COMBOBOX_ACTION_GLYPH_CLASS = "h-4 w-4";
export const FIELD_CHEVRON_CLASS = "h-4 w-4 transition-transform";
export const FIELD_CHEVRON_OPEN_CLASS = "rotate-180";

/**
 * The list's height: 16rem, or the room the window leaves on the side it
 * opens to. In its portal the list is fixed, so the page cannot scroll it
 * into view: on a phone on its side (568 by 320) it ran off the window.
 * Inline, outside the popper, the variable is unset and 16rem holds.
 */
export const FIELD_POPUP_MAX_HEIGHT =
  "min(16rem, var(--radix-popper-available-height, 16rem))";
/** The popper's box in the theme's portal, under the field. */
export const FIELD_POPUP_CONTENT_CLASS = "kozmos-reset z-50";
/** Where the popper places it: under the field, from its start, 4 below, 8 from the window's edge. */
export const FIELD_POPUP_PLACEMENT = {
  side: "bottom",
  align: "start",
  sideOffset: 4,
  collisionPadding: 8,
} as const;

/**
 * The field's own room for a press: a press on a group's label, the frame's
 * padding or the gap between rows takes no focus from the field, so its list
 * stays open (the rows prevent their own). A press on a scroll box's
 * scrollbar, outside its client area, is the browser's to drag: false then.
 */
export function keepsFieldFocus(
  target: EventTarget | null,
  offsetX: number,
  offsetY: number,
) {
  if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
    const style = target.ownerDocument.defaultView?.getComputedStyle(target);
    const border = (side: string) =>
      parseFloat(style?.getPropertyValue(`border-${side}-width`) ?? "") || 0;
    // Room a classic scrollbar takes: the box less its client area and borders.
    const across =
      target.offsetWidth -
      target.clientWidth -
      border("left") -
      border("right");
    const down =
      target.offsetHeight -
      target.clientHeight -
      border("top") -
      border("bottom");
    if (
      (across > 0 && (offsetX < 0 || offsetX >= target.clientWidth)) ||
      (down > 0 && (offsetY < 0 || offsetY >= target.clientHeight))
    )
      return false;
  }
  return true;
}

/** The field's input: the owned rule holds its end room where no @scope rule reaches an <input> (WebKit). */
export const COMBOBOX_INPUT_CLASS = "kozmos-combobox-input";
/**
 * The popup's frame. It does not scroll: the listbox in it does (GAP-137),
 * so the scroll region is the widget the input controls.
 */
export const COMBOBOX_POPUP_CLASS =
  "flex max-h-64 flex-col rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay";
/** Inline, it takes its place in the flow under the field. */
export const COMBOBOX_POPUP_INLINE_CLASS = "mt-1 w-full";
/** The scroll region the listbox is. */
export const COMBOBOX_LIST_CLASS = "min-h-0 overflow-y-auto";
/** The empty text, plain: the field's status says it aloud. */
export const COMBOBOX_EMPTY_CLASS = "px-3 py-2 text-sm text-muted-foreground";
/** The first command after the options draws a line above it. */
export const COMBOBOX_ACTIONS_START_CLASS = "border-t border-border";
export const COMBOBOX_ACTION_ICON_CLASS = "shrink-0";
export const COMBOBOX_ACTION_LABEL_CLASS =
  "min-w-0 flex-1 whitespace-normal font-medium [overflow-wrap:anywhere]";

/** An option as the default filter reads it. */
interface FilteredOption {
  label: string;
  value: string;
  description?: string;
}

/** The default filter: the query in the label, the value or the description. */
export function defaultFilterOption(
  option: FilteredOption,
  inputValue: string,
) {
  const query = inputValue.trim().toLowerCase();
  if (!query) return true;
  return (
    option.label.toLowerCase().includes(query) ||
    option.value.toLowerCase().includes(query) ||
    option.description?.toLowerCase().includes(query)
  );
}

/** The commands a popup draws: those with a nonblank id no other shares. */
export function validPopupActions<T extends { id: string }>(actions: T[]): T[] {
  const counts = new Map<string, number>();
  for (const action of actions)
    counts.set(action.id, (counts.get(action.id) ?? 0) + 1);
  return actions.filter(
    (action) => action.id.trim() && counts.get(action.id) === 1,
  );
}

/** A popup's entry: a value to choose, or a command to run. */
export type PopupEntryOf<Option, Action> =
  | { kind: "value"; option: Option; disabled?: boolean }
  | { kind: "action"; action: Action; disabled?: boolean };

export function popupEntryKey(
  entry: PopupEntryOf<{ value: string }, { id: string }>,
) {
  return entry.kind === "value"
    ? `value:${entry.option.value}`
    : `action:${entry.action.id}`;
}

/**
 * The entry made active for the visitor, as the popup opens or the query
 * changes: the first option that can be chosen, never a command. A command
 * runs only when the visitor moves to it, or Enter on text that matches
 * nothing would run "Current position" or "Select from map" in its place.
 */
export function firstAutomaticKey(
  entries: PopupEntryOf<{ value: string }, { id: string }>[],
) {
  const first = entries.find(
    (entry) => entry.kind === "value" && !entry.disabled,
  );
  return first ? popupEntryKey(first) : null;
}
