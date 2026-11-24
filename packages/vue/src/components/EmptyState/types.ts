import type { VNode } from "vue";

/**
 * EmptyState's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type.
 */
export type KozmosEmptyStateSize = "default" | "compact";

/**
 * A long wait the empty state is explaining, such as a download, and how far
 * it has got (GAP-115).
 */
export interface KozmosEmptyStateProgress {
  /** How far it has got, from 0 to 100. Outside that it is clamped, and NaN is 0. */
  value: number;
  /** What is in progress, shown above the bar and naming it: "Downloading the assistant". */
  label: string;
  /** How far, in words, shown beside the label and said as the bar's value: "40%", "12 of 30 MB". */
  valueText?: string;
}

/** One item of the list: a line of text, or the product's own inline content. */
export type KozmosEmptyStateListItem = string | VNode;
