/**
 * Timeline's recipe: the classes a Kozmos timeline and its parts draw with,
 * for every framework that draws them. React's `Timeline`, `TimelineItem`,
 * `TimelineTime`, `TimelineTitle` and `TimelineDescription` and Vue's
 * `KozmosTimeline…` build their elements from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
// The rail is each item's own, from its marker to the next one's, so it
// ends at the last marker (GAP-247): no border on the list, which keeps
// the border's 1 as padding, so nothing moves.
export const TIMELINE_CLASS = "relative ml-3 pl-px";

/** The compact density, set on the list for every part inside it. */
export const TIMELINE_COMPACT_CLASS =
  "[&_[data-timeline-description]]:mb-2 [&_[data-timeline-description]]:text-sm [&_[data-timeline-item]]:mb-6 [&_[data-timeline-time]]:mb-1 [&_[data-timeline-title]]:text-base";

// Its rail is drawn down its height and its margin to the next item
// (owned CSS), and the last item draws none (GAP-247).
export const TIMELINE_ITEM_CLASS = "relative mb-10 ml-6 last:mb-0";

// 36 left of the item: 12 left of the list's edge, as it was.
export const TIMELINE_MARKER_CLASS =
  "absolute -left-9 flex h-6 w-6 items-center justify-center rounded-pill bg-secondary ring-8 ring-background";

export const TIMELINE_DOT_CLASS = "h-2 w-2 rounded-pill bg-primary";

export const TIMELINE_TIME_CLASS =
  "block mb-2 text-sm font-normal leading-none text-muted-foreground";

export const TIMELINE_TITLE_CLASS =
  "flex items-center mb-1 text-lg font-semibold";

export const TIMELINE_DESCRIPTION_CLASS =
  "mb-4 text-base font-normal text-muted-foreground";

export type TimelineDensity = "default" | "compact";
