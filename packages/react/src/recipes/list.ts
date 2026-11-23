/**
 * List's recipe: the classes a Kozmos list, its rows and a checklist row's
 * status mark draw with, for every framework that draws them. React's
 * `List`, `ListItem` and `ListItemStatus` and Vue's `KozmosList`,
 * `KozmosListItem` and `KozmosListItemStatus` build their elements from it.
 * Framework-free (`recipes.framework-free.test.ts`).
 */

/** The list's own box, a `<ul>` with no bullets. */
export const LIST_CLASS =
  "m-0 flex w-full list-none flex-col overflow-hidden rounded-control border bg-background p-0 text-sm text-foreground";

export type ListDensity = "default" | "compact";

/** Each row's height and inset, by the list's density. */
export const listDensityClasses: Record<ListDensity, string> = {
  default: "[&>li]:min-h-12 [&>li]:px-4 [&>li]:py-3",
  compact: "[&>li]:min-h-10 [&>li]:px-4 [&>li]:py-2",
};

/** A row: a line under every row but the last. */
export const LIST_ITEM_CLASS = "flex items-center border-b last:border-b-0";

/**
 * A row's slots (GAP-195, decision 135), owned by the stylesheet: the row
 * that has any, the tint of a selected row, and each slot's box.
 */
export const LIST_ITEM_SLOTTED_CLASS = "kozmos-list-item-slotted";
export const LIST_ITEM_SELECTED_CLASS = "kozmos-list-item-selected";
export const LIST_ITEM_LEADING_CLASS = "kozmos-list-item-leading";

export const LIST_ITEM_BODY_CLASS = "kozmos-list-item-body";

export const LIST_ITEM_HEADING_CLASS = "kozmos-list-item-heading";

export const LIST_ITEM_TITLE_CLASS = "kozmos-list-item-title";

export const LIST_ITEM_TITLE_ADDON_CLASS = "kozmos-list-item-title-addon";

export const LIST_ITEM_DESCRIPTION_CLASS = "kozmos-list-item-description";

export const LIST_ITEM_META_CLASS = "kozmos-list-item-meta";

export const LIST_ITEM_TRAILING_CLASS = "kozmos-list-item-trailing";

export type ListItemStatusValue = "todo" | "inProgress" | "done";

/** What a screen reader hears for each status, in English by default. */
export const LIST_ITEM_STATUS_LABELS: Record<ListItemStatusValue, string> = {
  todo: "Not started",
  inProgress: "In progress",
  done: "Done",
};

/** The status mark's box, its check (done) and its dot (in progress). */
export const LIST_ITEM_STATUS_CLASS = "kozmos-list-item-status";

export const LIST_ITEM_STATUS_CHECK_CLASS = "kozmos-list-item-status-check";

export const LIST_ITEM_STATUS_DOT_CLASS = "kozmos-list-item-status-dot";
