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
export const LIST_ITEM_SLOT_CLASSES = {
  leading: "kozmos-list-item-leading",
  body: "kozmos-list-item-body",
  heading: "kozmos-list-item-heading",
  title: "kozmos-list-item-title",
  titleAddon: "kozmos-list-item-title-addon",
  description: "kozmos-list-item-description",
  meta: "kozmos-list-item-meta",
  trailing: "kozmos-list-item-trailing",
} as const;

export type ListItemStatusValue = "todo" | "inProgress" | "done";

/** What a screen reader hears for each status, in English by default. */
export const LIST_ITEM_STATUS_LABELS: Record<ListItemStatusValue, string> = {
  todo: "Not started",
  inProgress: "In progress",
  done: "Done",
};

/** The status mark's box, its check (done) and its dot (in progress). */
export const LIST_ITEM_STATUS_CLASSES = {
  root: "kozmos-list-item-status",
  check: "kozmos-list-item-status-check",
  dot: "kozmos-list-item-status-dot",
} as const;
