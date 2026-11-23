// Breadcrumb's recipe: the classes a Kozmos breadcrumb and its parts draw
// with, for every framework that draws one. React's `Breadcrumb…` parts and
// Vue's `KozmosBreadcrumb…` parts build their elements from it.
// Framework-free (`recipes.framework-free.test.ts`).

export const BREADCRUMB_LIST_CLASS =
  "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5";

export const BREADCRUMB_ITEM_CLASS = "inline-flex items-center gap-1.5";

export const BREADCRUMB_LINK_CLASS = "transition-colors hover:text-foreground";

export const BREADCRUMB_PAGE_CLASS = "font-normal text-foreground";

/** The separator's item: its icon 14. */
export const BREADCRUMB_SEPARATOR_CLASS = "[&>svg]:size-3.5";

/** The separator's default chevron, mirrored right to left. */
export const BREADCRUMB_SEPARATOR_ICON_CLASS = "kozmos-rtl-mirror";

export const BREADCRUMB_ELLIPSIS_CLASS =
  "flex h-9 w-9 items-center justify-center";

/** The ellipsis's dots, 16. */
export const BREADCRUMB_ELLIPSIS_ICON_CLASS = "h-4 w-4";

/** The ellipsis's words, for a screen reader alone. */
export const BREADCRUMB_ELLIPSIS_LABEL_CLASS = "sr-only";
