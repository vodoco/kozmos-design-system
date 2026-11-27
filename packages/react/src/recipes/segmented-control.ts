/**
 * SegmentedControl's recipe: the track and its segments, for every framework
 * that draws one. React's `SegmentedControl` (on Radix's ToggleGroup) and
 * Vue's `KozmosSegmentedControl` build the same elements from it.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva } from "class-variance-authority";
import { cn } from "../utils";

/** A control's size: `sm` and `default` are 52 tall, `lg` 56. */
export type SegmentedControlSize = "sm" | "default" | "lg";

// The track. A line comment: React's declarations name this recipe, and a
// doc comment here would be written into them.
export const segmentedControlVariants = cva(
  "inline-flex max-w-full overflow-x-auto items-center justify-start rounded-[16px] border border-transparent bg-muted p-1 text-muted-foreground transition-colors aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive data-[disabled=true]:opacity-50",
  {
    variants: {
      fullWidth: {
        true: "w-full",
        false: "w-fit",
      },
      size: {
        sm: "min-h-[52px]",
        default: "min-h-[52px]",
        lg: "min-h-[56px]",
      },
    },
    defaultVariants: {
      fullWidth: false,
      size: "default",
    },
  },
);

/** A segment. */
export const segmentedControlItemVariants = cva(
  // GAP-267 (decision 201): an option is a one-column grid whose column is
  // `minmax(max-content, M)`, M its minimum width less its padding. Its
  // words are its min-content width, and its words or its minimum,
  // whichever is wider, its max-content width: every engine reads both off
  // the grid, so the track asks for the same room it always did, and when
  // it is given less, each option gives up its spare width, down to its
  // words (min-width: min-content) and never past them, so they are never
  // clipped and never run into the next option's. Only when the words alone
  // are wider does the track scroll. A width with a min-width of
  // max-content did the same in Chromium and Firefox, but WebKit counted
  // the width alone in the track's, and scrolled German options with room.
  // The grid centres the label in the option, as the flex box did.
  "inline-grid min-w-min items-center justify-center justify-items-center whitespace-nowrap rounded-[12px] font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-raised",
  {
    variants: {
      fullWidth: {
        true: "flex-1",
        false: "shrink",
      },
      size: {
        sm: "min-h-11 px-3 text-xs",
        default: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-sm",
      },
    },
    // The minimum widths, 97, 117 and 137, less each size's padding, 12,
    // 16 and 20 a side.
    compoundVariants: [
      {
        fullWidth: false,
        size: "sm",
        className: "grid-cols-[minmax(max-content,73px)]",
      },
      {
        fullWidth: false,
        size: "default",
        className: "grid-cols-[minmax(max-content,85px)]",
      },
      {
        fullWidth: false,
        size: "lg",
        className: "grid-cols-[minmax(max-content,97px)]",
      },
    ],
    defaultVariants: {
      fullWidth: false,
      size: "default",
    },
  },
);

/**
 * The track's own focus ring, drawn inside it, over `segmentedControlVariants`.
 */
export const SEGMENTED_CONTROL_FOCUS_CLASS =
  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/**
 * A segment's class: the recipe's, the error's words on the chosen one, and
 * a disabled control's segments left at full: the group is drawn at half,
 * and its segments must not halve themselves again (they drew at 25%). A
 * segment disabled on its own still dims itself.
 */
export function segmentedControlItemClass({
  fullWidth,
  size,
  hasError,
  disabled,
}: {
  fullWidth: boolean;
  size: SegmentedControlSize;
  hasError: boolean;
  disabled: boolean;
}) {
  return cn(
    segmentedControlItemVariants({ fullWidth, size }),
    hasError && "data-[state=on]:text-destructive-text",
    disabled && "disabled:opacity-100",
  );
}

/**
 * The segment's one grid item, whatever its label holds: eight between its
 * parts, as Button and ToggleButton space theirs (an icon beside its words).
 */
export const SEGMENTED_CONTROL_LABEL_CLASS =
  "inline-flex items-center justify-center gap-2";
