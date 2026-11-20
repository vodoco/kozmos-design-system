import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Box, type BoxProps } from "../Box/Box";
import { cn } from "../../utils";

const gridVariants = cva("grid", {
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

/** The items a virtualized Grid draws (GAP-172): `start` up to, not including, `end`. */
export interface GridVirtualRange {
  start: number;
  end: number;
}

export interface GridProps extends BoxProps, VariantProps<typeof gridVariants> {
  /**
   * Draws only the rows in view and `overscan` rows past each edge
   * (GAP-172), for hundreds of cards: the Grid scrolls itself, so give it
   * a height. Items are drawn in reading order, each a `listitem` said as
   * its place in the whole list (`aria-posinset` of `itemCount`), and a
   * focused item that scrolls out of the drawn rows hands focus to the
   * scroller, which Tab and the arrow keys reach. Needs `itemCount` and
   * `rowHeight`, and `renderItem` or children.
   */
  virtualized?: boolean;
  /** How many items a `virtualized` Grid holds. */
  itemCount?: number;
  /** Each row's height in px, a `virtualized` Grid's: every row is as tall. */
  rowHeight?: number;
  /**
   * A `virtualized` Grid's item at `index`, wrapped in a `listitem`. Without
   * it, children are drawn as the items from the range `onRangeChange`
   * reports, so a caller, Vue's slot among them, draws only those.
   */
  renderItem?: (index: number) => React.ReactNode;
  /**
   * A `virtualized` Grid without `cols` fits as many columns of at least
   * this width, in px, as its width holds; with neither, one column.
   */
  minColumnWidth?: number;
  /** Rows drawn past each edge of the view when `virtualized`: 2 by default. */
  overscan?: number;
  /** Every change to the items a `virtualized` Grid draws. */
  onRangeChange?: (range: GridVirtualRange) => void;
}

/** The props only a virtualized Grid reads. */
const VIRTUAL_PROPS = [
  "virtualized",
  "itemCount",
  "rowHeight",
  "renderItem",
  "minColumnWidth",
  "overscan",
  "onRangeChange",
] as const;

// A layout effect in the browser, an effect on a server render.
const useGridLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/** A length in px from a computed style, or null when there is none. */
function pixels(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type VirtualGridProps = GridProps & {
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
};

function VirtualGrid({
  forwardedRef,
  className,
  cols,
  gap,
  xGap,
  yGap,
  align,
  justify,
  itemCount = 0,
  rowHeight = 0,
  renderItem,
  minColumnWidth,
  overscan = 2,
  onRangeChange,
  children,
  onScroll,
  onFocus,
  style,
  // Grid's axes that a virtualized grid sets itself.
  rows: _rows,
  flow: _flow,
  virtualized: _virtualized,
  ...props
}: VirtualGridProps) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [gaps, setGaps] = React.useState<{
    row: number;
    column: number;
  } | null>(null);
  const focusedIndex = React.useRef<number | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  // The scroller's size and the gaps the list's classes draw, measured
  // before paint and again when the scroller is resized.
  useGridLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => {
      setSize((old) =>
        old.width === scroller.clientWidth &&
        old.height === scroller.clientHeight
          ? old
          : { width: scroller.clientWidth, height: scroller.clientHeight },
      );
      const list = listRef.current;
      if (list && typeof getComputedStyle === "function") {
        const computed = getComputedStyle(list);
        const row = pixels(computed.rowGap);
        const column = pixels(computed.columnGap);
        if (row !== null && column !== null)
          setGaps((old) =>
            old && old.row === row && old.column === column
              ? old
              : { row, column },
          );
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  // Without a computed style (a test's DOM, a server render), the scale's
  // own steps: Tailwind's spacing, 4 px a step.
  const scale = (step: number | null | undefined) =>
    typeof step === "number" ? step * 4 : null;
  const rowGap = gaps?.row ?? scale(yGap) ?? scale(gap) ?? 16;
  const columnGap = gaps?.column ?? scale(xGap) ?? scale(gap) ?? 16;

  const columns = (() => {
    if (typeof cols === "number") return cols;
    if (minColumnWidth && minColumnWidth > 0 && size.width > 0)
      return Math.max(
        1,
        Math.floor((size.width + columnGap) / (minColumnWidth + columnGap)),
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
      ? Math.min(
          rowCount,
          Math.ceil((scrollTop + size.height) / stride) + overscan,
        )
      : rowCount;
  const start = Math.min(itemCount, firstRow * columns);
  const end = Math.min(itemCount, Math.max(start, lastRow * columns));

  const report = React.useRef(onRangeChange);
  report.current = onRangeChange;
  useGridLayoutEffect(() => {
    report.current?.({ start, end });
  }, [start, end]);

  // A focused item scrolled out of the drawn rows is gone, and focus with
  // it: the scroller takes it, so Tab goes on from the items in view.
  useGridLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const index = focusedIndex.current;
    if (!scroller || index === null || (index >= start && index < end)) return;
    focusedIndex.current = null;
    const active =
      typeof document === "undefined" ? null : document.activeElement;
    if (!active || active === document.body || !scroller.contains(active))
      scroller.focus({ preventScroll: true });
  }, [start, end]);

  const items: React.ReactNode[] = [];
  if (renderItem) {
    for (let index = start; index < end; index += 1) {
      items.push(
        <div
          key={index}
          role="listitem"
          aria-posinset={index + 1}
          aria-setsize={itemCount}
          data-index={index}
          className="min-w-0"
        >
          {renderItem(index)}
        </div>,
      );
    }
  }

  return (
    <div
      ref={setRefs}
      tabIndex={0}
      data-virtual-scroller=""
      className={cn(
        "relative overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
      style={style}
      onScroll={(event) => {
        onScroll?.(event);
        setScrollTop(event.currentTarget.scrollTop);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        const item = (event.target as HTMLElement).closest?.("[data-index]");
        const index = item ? Number(item.getAttribute("data-index")) : NaN;
        focusedIndex.current = Number.isFinite(index) ? index : null;
      }}
      {...props}
    >
      <div style={{ position: "relative", height: `${totalHeight}px` }}>
        <div
          ref={listRef}
          role="list"
          className={cn(gridVariants({ align, justify, gap, xGap, yGap }))}
          style={{
            position: "absolute",
            insetInline: 0,
            top: 0,
            transform: `translateY(${firstRow * stride}px)`,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}px`,
          }}
        >
          {renderItem ? items : children}
        </div>
      </div>
    </div>
  );
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    { className, cols, rows, flow, align, justify, gap, xGap, yGap, ...props },
    ref,
  ) => {
    if (props.virtualized)
      return (
        <VirtualGrid
          forwardedRef={ref}
          className={className}
          cols={cols}
          align={align}
          justify={justify}
          gap={gap}
          xGap={xGap}
          yGap={yGap}
          {...props}
        />
      );
    // A virtualized Grid's own props are never written on the box.
    const boxProps: BoxProps = { ...props };
    for (const key of VIRTUAL_PROPS)
      delete (boxProps as Record<string, unknown>)[key];
    return (
      <Box
        ref={ref}
        className={cn(
          gridVariants({
            cols,
            rows,
            flow,
            align,
            justify,
            gap,
            xGap,
            yGap,
            className,
          }),
        )}
        {...boxProps}
      />
    );
  },
);
Grid.displayName = "Grid";

export { Grid };
