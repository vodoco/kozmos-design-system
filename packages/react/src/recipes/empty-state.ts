// EmptyState's recipe: the classes a Kozmos empty state and its parts draw
// with, by density and tone, for every framework that draws one. React's
// `EmptyState` and Vue's `KozmosEmptyState` build their elements from it.
// Framework-free (`recipes.framework-free.test.ts`).
//
// Every compact class is layered AFTER the default one and resolved by
// tailwind-merge, so the default strings stay whole — `w-16 h-16
// rounded-pill bg-muted` is asserted verbatim as the Figma geometry by
// `pnpm components:contract:check`, and splitting it into a conditional
// broke that check the first time this prop was written.

export type EmptyStateSize = "default" | "compact";

/**
 * The natives clamp the value; Radix does not. Past either end, even by
 * 0.0000001, it logs an error, marks the bar indeterminate, draws it empty
 * and drops aria-valuenow and aria-valuetext.
 */
export function emptyStateClampPercent(value: number): number {
  return Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
}

/** The empty state's box, before a caller's. */
export function emptyStateClasses(compact: boolean, toned: boolean) {
  return [
    "flex flex-col items-center justify-center p-8 text-center h-full w-full",
    compact && "h-auto p-4",
    // The emotion's surface, edged in its text colour, at the
    // container's radius: a card of its own (GAP-213).
    toned &&
      "rounded-container border border-[var(--kz-emotion-text)] bg-[var(--kz-emotion-surface)]",
  ];
}

/** The icon's disc. */
export function emptyStateIconClasses(compact: boolean, toned: boolean) {
  return [
    "mb-4 flex items-center justify-center text-muted-foreground w-16 h-16 rounded-pill bg-muted",
    compact && "mb-2 h-10 w-10",
    // On the surface the muted disc would be grey on a tint: the
    // page's colour, with the emotion's text on it, 4.5:1 in both
    // themes as that text is on the page.
    toned && "bg-background text-[var(--kz-emotion-text)]",
  ];
}

/** The title's classes, on Text's. */
export function emptyStateTitleClasses(compact: boolean, toned: boolean) {
  return [
    "mb-1 text-foreground",
    compact && "mb-0.5",
    toned && "text-[var(--kz-emotion-on-surface)]",
  ];
}

/** The description's classes, on Text's. */
export function emptyStateDescriptionClasses(compact: boolean, toned: boolean) {
  return [
    "mb-4 text-muted-foreground max-w-[280px]",
    compact && "mb-0",
    toned && "text-[var(--kz-emotion-on-surface)]",
  ];
}

/** The list's classes. */
export function emptyStateListClasses(
  compact: boolean,
  toned: boolean,
  hasDescription: boolean,
) {
  return [
    "kozmos-empty-state-list mb-4 w-full max-w-[280px] text-start text-sm text-muted-foreground",
    !hasDescription && "mt-3",
    compact && (hasDescription ? "mb-0 mt-2" : "mb-0 mt-1.5"),
    toned && "text-[var(--kz-emotion-on-surface)]",
  ];
}

/** The progress's box. */
export function emptyStateProgressClasses(
  compact: boolean,
  hasDescription: boolean,
) {
  return [
    "mb-4 w-full max-w-[280px] text-start",
    !hasDescription && "mt-3",
    compact && (hasDescription ? "mb-0 mt-2" : "mb-0 mt-1.5"),
  ];
}

/** The progress's label row, hidden: the bar's name and its value in words. */
export const EMPTY_STATE_PROGRESS_LABELS_CLASS =
  "mb-1 flex items-baseline justify-between gap-2 text-sm";

/** The progress's label. */
export function emptyStateProgressLabelClasses(toned: boolean) {
  return [
    "min-w-0 text-foreground",
    toned && "text-[var(--kz-emotion-on-surface)]",
  ];
}

/** The progress's value in words. */
export function emptyStateProgressValueClasses(toned: boolean) {
  return [
    "shrink-0 text-muted-foreground",
    toned && "text-[var(--kz-emotion-on-surface)]",
  ];
}

/** The action's box. */
export function emptyStateActionClasses(compact: boolean) {
  return [compact && "mt-3"];
}
