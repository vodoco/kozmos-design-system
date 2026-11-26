import type { VNode } from "vue";

/**
 * SegmentedControl's public prop types, written out so the package's
 * declarations name nothing outside it. `types.check.ts` holds each to the
 * shared recipe's own type.
 */

/** A control's size: `sm` and `default` are 52 tall, `lg` 56. */
export type KozmosSegmentedControlSize = "sm" | "default" | "lg";

/**
 * One segment: its value, its label, and whether it is disabled on its
 * own. React's label is a ReactNode; Vue's is text or a VNode (an icon
 * beside words, drawn with `h`), what Vue draws inside the segment.
 */
export type KozmosSegmentedControlItem = {
  disabled?: boolean;
  label: string | number | VNode | VNode[];
  value: string;
};
