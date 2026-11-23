/**
 * DescriptionList's recipe: the classes a Kozmos description list and each
 * of its items draw with, for every framework that draws them. React's
 * `DescriptionList` and `DescriptionListItem` and Vue's
 * `KozmosDescriptionList` and `KozmosDescriptionListItem` build their
 * elements from it. Framework-free (`recipes.framework-free.test.ts`).
 */

/** The `<dl>`, its `<div>` items, and each item's label, value, words and action. */
export const DESCRIPTION_LIST_CLASS = "kozmos-description-list";

export const DESCRIPTION_LIST_ITEM_CLASS = "kozmos-description-list-item";

export const DESCRIPTION_LIST_LABEL_CLASS = "kozmos-description-list-label";

export const DESCRIPTION_LIST_VALUE_CLASS = "kozmos-description-list-value";

export const DESCRIPTION_LIST_CONTENT_CLASS = "kozmos-description-list-content";

export const DESCRIPTION_LIST_ACTION_CLASS = "kozmos-description-list-action";

/**
 * How a DescriptionList's items go (GAP-221, decision 199): `"stack"`, one
 * under another; `"row"`, side by side, as many to a line as fit, each at
 * least 10rem wide, wrapping onto the next.
 */
export type DescriptionListLayout = "stack" | "row";
