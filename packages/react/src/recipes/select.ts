/**
 * Select's recipe: the classes its trigger, list, rows, labels and
 * separators are drawn with, and how a row with a count is named, for every
 * framework that draws one. React's `Select` parts build their elements from
 * it, and so do Vue's `KozmosSelect` parts. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/** The closed field: the trigger, bordered by default. */
export const SELECT_TRIGGER_CLASS =
  "flex h-field w-full items-center justify-between rounded-control border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1";
/**
 * `ghost`: no edge and no fill at rest, as wide as its words, the hover
 * fill under the pointer and while open (decision 151, CLOUD-UI-009).
 */
export const SELECT_TRIGGER_GHOST_CLASS =
  "w-auto max-w-full self-start justify-start gap-2 border-transparent bg-transparent hover:bg-hover-fill data-[state=open]:bg-hover-fill";
export const SELECT_TRIGGER_ERROR_CLASS =
  "border-destructive text-destructive-text focus:ring-destructive";
/** The trigger's chevron. */
export const SELECT_ICON_CLASS = "h-4 w-4 opacity-50";

export const SELECT_SCROLL_BUTTON_CLASS =
  "flex cursor-default items-center justify-center py-1";
export const SELECT_SCROLL_ICON_CLASS = "h-4 w-4";

/** The open list's panel. */
export const SELECT_CONTENT_CLASS =
  "relative z-50 max-h-96 min-w-32 overflow-hidden rounded-control border bg-popover text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
/** The panel placed beside the trigger (`position="popper"`, the default). */
export const SELECT_CONTENT_POPPER_CLASS =
  "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1";
export const SELECT_VIEWPORT_CLASS = "p-3";
export const SELECT_VIEWPORT_POPPER_CLASS =
  "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]";

export const SELECT_LABEL_CLASS = "px-3 py-1.5 text-sm font-semibold";

/**
 * Combobox's row (owned-selection.css): the words, then the check at the
 * end, a light row under the pointer or the keyboard.
 */
export const SELECT_ITEM_CLASS =
  "kozmos-reset kozmos-option select-none data-[disabled]:pointer-events-none";
/** The count's Counter (GAP-164). */
export const SELECT_ITEM_COUNT_CLASS = "shrink-0";
/**
 * The check's place, kept on every row, so counts form one column that a
 * new choice never moves (decision 1).
 */
export const SELECT_ITEM_CHECK_SLOT_CLASS =
  "flex h-4 w-4 shrink-0 items-center justify-center";

export const SELECT_SEPARATOR_CLASS = "-mx-1 my-1 h-px bg-muted";

/** A count given at all: anything but nothing or false. */
export const hasSelectCount = (count: unknown) =>
  count !== undefined && count !== null && count !== false;

/**
 * A number in the app's grouping, as SwiftUI and Compose write it: "1,234",
 * "1.234" in German. Anything else is drawn as it is given.
 */
export function selectCountText<T>(count: T, locale: string): T | string {
  return typeof count === "number"
    ? new Intl.NumberFormat(locale).format(count)
    : count;
}

/** Words or a count a row can name itself by without drawing them first. */
export const isPlainText = (node: unknown): node is string | number =>
  typeof node === "string" || typeof node === "number";

/**
 * How a row is named. Radix names the option by its item text alone,
 * through aria-labelledby, which would beat a caller's aria-label: that
 * label wins. With a count, the name is the words, then the count: "POI,
 * 96", from `name` when it is known, else from the words' and the count's
 * ids. Null leaves the primitive's naming as it is.
 */
export function selectItemNaming({
  callerLabel,
  callerLabelledBy,
  hasCount,
  name,
  textId,
  countId,
}: {
  callerLabel: string | undefined;
  callerLabelledBy: string | undefined;
  hasCount: boolean;
  name: string | null;
  textId: string;
  countId: string;
}): Record<string, string | undefined> | null {
  if (callerLabel !== undefined && callerLabelledBy === undefined)
    return { "aria-labelledby": undefined };
  if (hasCount && callerLabelledBy === undefined)
    return name
      ? { "aria-label": name, "aria-labelledby": undefined }
      : { "aria-labelledby": `${textId} ${countId}` };
  return null;
}
