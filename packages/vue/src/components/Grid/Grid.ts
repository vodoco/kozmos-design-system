import {
  computed,
  defineComponent,
  h,
  mergeProps,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  GRID_VIRTUAL_ITEM_CLASS,
  GRID_VIRTUAL_SCROLLER_CLASS,
  cn,
  gridPixels,
  gridVariants,
  gridVirtualListStyle,
  gridVirtualSpacerStyle,
  gridVirtualWindow,
} from "#kozmos-recipes";
import { KozmosBox } from "../Box/Box";
import type {
  KozmosGridAlign,
  KozmosGridCols,
  KozmosGridFlow,
  KozmosGridGap,
  KozmosGridJustify,
  KozmosGridRows,
  KozmosGridVirtualRange,
  KozmosGridXGap,
  KozmosGridYGap,
} from "./types";

/** Grid's slots: its items, and a virtualized Grid's item at an index. */
type GridSlots = {
  /**
   * What React's `children` draws: the grid's items. A `virtualized` Grid
   * without `render-item` draws them as its items, so a caller draws only
   * the range `@range-change` reports.
   */
  default?: () => VNode[];
  /**
   * React's `renderItem(index)`: a `virtualized` Grid's item at `index`,
   * wrapped in a `listitem`.
   */
  renderItem?: (props: { index: number }) => VNode[];
};

const gridProps = {
  /**
   * Draws only the rows in view and `overscan` rows past each edge
   * (GAP-172), for hundreds of cards: the Grid scrolls itself, so give it a
   * height. Needs `item-count` and `row-height`, and `render-item` or the
   * default slot.
   */
  virtualized: { type: Boolean, default: undefined },
  /** How many items a `virtualized` Grid holds. */
  itemCount: { type: Number, default: undefined },
  /** Each row's height in px, a `virtualized` Grid's: every row is as tall. */
  rowHeight: { type: Number, default: undefined },
  /**
   * A `virtualized` Grid without `cols` fits as many columns of at least
   * this width, in px, as its width holds; with neither, one column.
   */
  minColumnWidth: { type: Number, default: undefined },
  /** Rows drawn past each edge of the view when `virtualized`: 2 by default. */
  overscan: { type: Number, default: undefined },
  asChild: { type: Boolean, default: undefined },
  align: { type: String as PropType<KozmosGridAlign>, default: undefined },
  cols: {
    type: [Number, String] as PropType<KozmosGridCols>,
    default: undefined,
  },
  rows: {
    type: [Number, String] as PropType<KozmosGridRows>,
    default: undefined,
  },
  flow: { type: String as PropType<KozmosGridFlow>, default: undefined },
  justify: { type: String as PropType<KozmosGridJustify>, default: undefined },
  gap: { type: Number as PropType<KozmosGridGap>, default: undefined },
  xGap: { type: Number as PropType<KozmosGridXGap>, default: undefined },
  yGap: { type: Number as PropType<KozmosGridYGap>, default: undefined },
} as const;

/**
 * A virtualized Grid (GAP-172): a focusable scroller as tall as the whole
 * list, and in it a `list` of only the rows in view and `overscan` past each
 * edge, moved down to where they belong. Each item is a `listitem` said as
 * its place in the whole list; a focused item that scrolls out of the drawn
 * rows hands focus to the scroller. React's `VirtualGrid`, from the same
 * recipe (`gridVirtualWindow`).
 */
const KozmosVirtualGrid = defineComponent({
  name: "KozmosVirtualGrid",
  inheritAttrs: false,
  props: gridProps,
  emits: {
    rangeChange: (_range: KozmosGridVirtualRange) => true,
  },
  slots: Object as SlotsType<GridSlots>,
  setup(props, { attrs, slots, emit }) {
    const scroller = ref<HTMLElement | null>(null);
    const list = ref<HTMLElement | null>(null);
    const scrollTop = ref(0);
    const size = ref({ width: 0, height: 0 });
    const gaps = ref<{ row: number; column: number } | null>(null);
    let focusedIndex: number | null = null;

    const view = computed(() =>
      gridVirtualWindow({
        cols: props.cols,
        gap: props.gap,
        xGap: props.xGap,
        yGap: props.yGap,
        gaps: gaps.value,
        width: size.value.width,
        height: size.value.height,
        scrollTop: scrollTop.value,
        itemCount: props.itemCount ?? 0,
        rowHeight: props.rowHeight ?? 0,
        minColumnWidth: props.minColumnWidth,
        overscan: props.overscan ?? 2,
      }),
    );
    // Each edge a source of its own, so a scroll that draws the same rows
    // reports nothing, as React's effect does not run.
    const edges = [() => view.value.start, () => view.value.end] as const;

    // The scroller's size and the gaps the list's classes draw, measured
    // once mounted and again when the scroller is resized.
    const measure = () => {
      const element = scroller.value;
      if (!element) return;
      const { clientWidth: width, clientHeight: height } = element;
      if (size.value.width !== width || size.value.height !== height)
        size.value = { width, height };
      if (list.value && typeof getComputedStyle === "function") {
        const computedStyle = getComputedStyle(list.value);
        const row = gridPixels(computedStyle.rowGap);
        const column = gridPixels(computedStyle.columnGap);
        if (
          row !== null &&
          column !== null &&
          (gaps.value?.row !== row || gaps.value?.column !== column)
        )
          gaps.value = { row, column };
      }
    };
    let observer: ResizeObserver | undefined;
    onMounted(() => {
      // The range drawn first, then the one the measured size draws, as
      // React's layout effects report them.
      emit("rangeChange", { start: view.value.start, end: view.value.end });
      measure();
      if (typeof ResizeObserver === "undefined" || !scroller.value) return;
      observer = new ResizeObserver(measure);
      observer.observe(scroller.value);
    });
    onBeforeUnmount(() => observer?.disconnect());

    watch(
      edges,
      ([start, end]) => {
        emit("rangeChange", { start, end });
      },
      { flush: "sync" },
    );

    // A focused item scrolled out of the drawn rows is gone, and focus with
    // it: the scroller takes it, so Tab goes on from the items in view.
    watch(
      edges,
      ([start, end]) => {
        const element = scroller.value;
        const index = focusedIndex;
        if (!element || index === null || (index >= start && index < end))
          return;
        focusedIndex = null;
        const active = document.activeElement;
        if (!active || active === document.body || !element.contains(active))
          element.focus({ preventScroll: true });
      },
      { flush: "post" },
    );

    return () => {
      const { class: className, ...rest } = attrs;
      const current = view.value;
      const items: VNode[] = [];
      if (slots.renderItem)
        for (let index = current.start; index < current.end; index += 1)
          items.push(
            h(
              "div",
              {
                key: index,
                role: "listitem",
                "aria-posinset": index + 1,
                "aria-setsize": props.itemCount ?? 0,
                "data-index": index,
                class: GRID_VIRTUAL_ITEM_CLASS,
              },
              slots.renderItem({ index }),
            ),
          );
      // The app's attributes over the scroller's own, as React spreads
      // them; its listeners beside the scroller's, which mergeProps chains.
      return h(
        "div",
        mergeProps(
          {
            ref: scroller,
            tabindex: 0,
            "data-virtual-scroller": "",
            class: cn(GRID_VIRTUAL_SCROLLER_CLASS, normalizeClass(className)),
            onScroll: (event: Event) => {
              scrollTop.value = (event.currentTarget as HTMLElement).scrollTop;
            },
            // React's onFocus hears an item's focus as it bubbles: focusin.
            onFocusin: (event: FocusEvent) => {
              const item = (event.target as HTMLElement).closest?.(
                "[data-index]",
              );
              const index = item
                ? Number(item.getAttribute("data-index"))
                : NaN;
              focusedIndex = Number.isFinite(index) ? index : null;
            },
          },
          rest,
        ),
        [
          h("div", { style: gridVirtualSpacerStyle(current) }, [
            h(
              "div",
              {
                ref: list,
                role: "list",
                class: cn(
                  gridVariants({
                    align: props.align,
                    justify: props.justify,
                    gap: props.gap,
                    xGap: props.xGap,
                    yGap: props.yGap,
                  }),
                ),
                style: gridVirtualListStyle(current, props.rowHeight ?? 0),
              },
              slots.renderItem ? items : slots.default?.(),
            ),
          ]),
        ],
      );
    };
  },
});

/**
 * Vue's counterpart of React's Grid: a CSS grid of 1 to 12 columns (none by
 * default), its rows, flow, alignment and gaps on the layout spacing steps,
 * drawn on `KozmosBox` from the same recipe as React's (`gridVariants`).
 *
 * `virtualized` (GAP-172) draws only the rows in view and `overscan` rows
 * past each edge, for hundreds of cards: the Grid scrolls itself, so give it
 * a height. Items are drawn in reading order, each a `listitem` said as its
 * place in the whole list (`aria-posinset` of `item-count`), and a focused
 * item that scrolls out of the drawn rows hands focus to the scroller, which
 * Tab and the arrow keys reach. It needs `item-count` and `row-height`, and
 * the `render-item` slot, given `{ index }`, or the default slot drawing the
 * range `@range-change` reports.
 */
export const KozmosGrid = defineComponent({
  name: "KozmosGrid",
  inheritAttrs: false,
  props: gridProps,
  emits: {
    /** Every change to the items a `virtualized` Grid draws. */
    rangeChange: (_range: KozmosGridVirtualRange) => true,
  },
  slots: Object as SlotsType<GridSlots>,
  setup(props, { attrs, slots, emit }) {
    return () => {
      if (props.virtualized)
        return h(
          KozmosVirtualGrid,
          {
            ...props,
            ...attrs,
            onRangeChange: (range: KozmosGridVirtualRange) =>
              emit("rangeChange", range),
          },
          slots,
        );
      const { class: className, ...rest } = attrs;
      return h(
        KozmosBox,
        {
          class: cn(
            gridVariants({
              cols: props.cols,
              rows: props.rows,
              flow: props.flow,
              align: props.align,
              justify: props.justify,
              gap: props.gap,
              xGap: props.xGap,
              yGap: props.yGap,
              className: normalizeClass(className),
            }),
          ),
          asChild: props.asChild === true,
          ...rest,
        },
        { default: () => slots.default?.() ?? [] },
      );
    };
  },
});
