/**
 * Grid's recipe: the classes a Kozmos grid draws with, and the window a
 * virtualized grid draws (GAP-172), for every framework that draws one.
 * React's `Grid` and Vue's `KozmosGrid` both build their element, and decide
 * which rows to draw and where, from it, so the two cannot drift.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      12: "grid-cols-12",
      none: "grid-cols-none",
    },
    rows: {
      1: "grid-rows-1",
      2: "grid-rows-2",
      3: "grid-rows-3",
      4: "grid-rows-4",
      5: "grid-rows-5",
      6: "grid-rows-6",
      none: "grid-rows-none",
    },
    flow: {
      row: "grid-flow-row",
      col: "grid-flow-col",
      dense: "grid-flow-dense",
      "row-dense": "grid-flow-row-dense",
      "col-dense": "grid-flow-col-dense",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    },
    xGap: {
      0: "gap-x-0",
      1: "gap-x-1",
      2: "gap-x-2",
      4: "gap-x-4",
      8: "gap-x-8",
    },
    yGap: {
      0: "gap-y-0",
      1: "gap-y-1",
      2: "gap-y-2",
      4: "gap-y-4",
      8: "gap-y-8",
    },
  },
  defaultVariants: {
    cols: "none",
    flow: "row",
    gap: 4,
  },
});

type GridVariant<K extends keyof VariantProps<typeof gridVariants>> =
  NonNullable<VariantProps<typeof gridVariants>[K]>;

export type GridCols = GridVariant<"cols">;
export type GridRows = GridVariant<"rows">;
export type GridFlow = GridVariant<"flow">;
export type GridAlign = GridVariant<"align">;
export type GridJustify = GridVariant<"justify">;
export type GridGap = GridVariant<"gap">;
export type GridXGap = GridVariant<"xGap">;
export type GridYGap = GridVariant<"yGap">;

/**
 * A virtualized Grid's scroller: it scrolls itself, and shows its focus ring
 * inside its edge when the keyboard reaches it.
 */
export const GRID_VIRTUAL_SCROLLER_CLASS =
  "relative overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/** A virtualized Grid's item, the `listitem` around each `renderItem`. */
export const GRID_VIRTUAL_ITEM_CLASS = "min-w-0";

/** A length in px from a computed style, or null when there is none. */
export function gridPixels(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** What a virtualized Grid's window is worked out from. */
export interface GridVirtualInput {
  cols?: GridCols | null;
  gap?: GridGap | null;
  xGap?: GridXGap | null;
  yGap?: GridYGap | null;
  /** The gaps the list's classes draw, measured, or null before they are. */
  gaps: { row: number; column: number } | null;
  /** The scroller's client size. */
  width: number;
  height: number;
  scrollTop: number;
  itemCount: number;
  rowHeight: number;
  minColumnWidth?: number;
  overscan: number;
}

/** The rows a virtualized Grid draws, and where. */
export interface GridVirtualWindow {
  columns: number;
  /** One row and the gap under it, in px. */
  stride: number;
  /** The whole list's height, in px, so the scrollbar is the whole list's. */
  totalHeight: number;
  /** The first row drawn. */
  firstRow: number;
  /** The items drawn: `start` up to, not including, `end`. */
  start: number;
  end: number;
}

/**
 * The window a virtualized Grid draws: the rows in view and `overscan` rows
 * past each edge, in as many columns as `cols` gives, or as fit
 * `minColumnWidth`, or one.
 */
export function gridVirtualWindow({
  cols,
  gap,
  xGap,
  yGap,
  gaps,
  width,
  height,
  scrollTop,
  itemCount,
  rowHeight,
  minColumnWidth,
  overscan,
}: GridVirtualInput): GridVirtualWindow {
  // Without a computed style (a test's DOM, a server render), the scale's
  // own steps: Tailwind's spacing, 4 px a step.
  const scale = (step: number | null | undefined) =>
    typeof step === "number" ? step * 4 : null;
  const rowGap = gaps?.row ?? scale(yGap) ?? scale(gap) ?? 16;
  const columnGap = gaps?.column ?? scale(xGap) ?? scale(gap) ?? 16;

  const columns = (() => {
    if (typeof cols === "number") return cols;
    if (minColumnWidth && minColumnWidth > 0 && width > 0)
      return Math.max(
        1,
        Math.floor((width + columnGap) / (minColumnWidth + columnGap)),
      );
    return 1;
  })();
  const rowCount = Math.ceil(itemCount / columns);
  const stride = rowHeight + rowGap;
  const totalHeight =
    rowCount > 0 ? rowCount * rowHeight + (rowCount - 1) * rowGap : 0;
  const firstRow =
    stride > 0 ? Math.max(0, Math.floor(scrollTop / stride) - overscan) : 0;
  const lastRow =
    stride > 0
      ? Math.min(rowCount, Math.ceil((scrollTop + height) / stride) + overscan)
      : rowCount;
  const start = Math.min(itemCount, firstRow * columns);
  const end = Math.min(itemCount, Math.max(start, lastRow * columns));
  return { columns, stride, totalHeight, firstRow, start, end };
}

/** The style of the box as tall as the whole list, inside the scroller. */
export function gridVirtualSpacerStyle(view: GridVirtualWindow) {
  return { position: "relative", height: `${view.totalHeight}px` } as const;
}

/** The style of the list, moved down to the first row it draws. */
export function gridVirtualListStyle(
  view: GridVirtualWindow,
  rowHeight: number,
) {
  return {
    position: "absolute",
    insetInline: 0,
    top: 0,
    transform: `translateY(${view.firstRow * view.stride}px)`,
    gridTemplateColumns: `repeat(${view.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${rowHeight}px`,
  } as const;
}
