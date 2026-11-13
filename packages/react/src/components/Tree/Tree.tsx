import React from "react";
import {
  ChevronDown,
  ChevronRight,
  File01 as File,
  Folder,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";

export type TreeDensity = "default" | "compact";
export type TreeActivationMode = "select" | "toggle" | "select-toggle";
/** One selected row, or a set of them with ranges (GAP-151). */
export type TreeSelectionMode = "single" | "multiple";
/** Where a row's meta goes: after the name, or on a line under it (GAP-107). */
export type TreeMetaPlacement = "inline" | "below";

export interface TreeItemRenderContext {
  item: TreeItem;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  toggle: (force?: boolean) => void;
  select: () => void;
}

export type TreeItemSlot =
  | React.ReactNode
  | ((context: TreeItemRenderContext) => React.ReactNode);

export interface TreeItem {
  id: string;
  name: React.ReactNode;
  children?: TreeItem[];
  disabled?: boolean;
  /**
   * A section heading (GAP-151): its name and count drawn as a heading over
   * its `children`, which are the section's items, at the section's own depth.
   * A section is always open, and is never focused, selected or counted as a
   * row; its items are a set of their own, in a group named by it.
   */
  section?: boolean;
  /**
   * The item's words, for type-ahead and a section's group name, where
   * `name` is not plain text.
   */
  textValue?: string;
  icon?: TreeItemSlot;
  count?: TreeItemSlot;
  meta?: TreeItemSlot;
  actions?: TreeItemSlot;
  className?: string;
}

export interface TreeProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  data?: TreeItem[];
  children?: React.ReactNode;
  ariaLabel?: string;
  density?: TreeDensity;
  /**
   * A stroke under every row and an open parent row on a surface of its own
   * (GAP-201): a list of records, as Pointr Cloud's Map Content tree draws
   * its buildings and levels, rather than a navigation tree. The stroke sits
   * under the row, so a divided row is a pixel taller; the hover and
   * selected fills keep their corners, inside the stroke and over the
   * surface, and the focus ring is drawn inside the row. Rows composed as
   * children take it from here too.
   */
  divided?: boolean;
  /**
   * How far a divided row's stroke and an open row's surface reach past the
   * tree on each side, so they run to the panel's edges while the rows stay
   * where they are: the panel's own inline padding, 16 in a
   * `Container inset="panel"`. A number is pixels. 0 by default, the tree's
   * own edges.
   */
  bleed?: number | string;
  indent?: number;
  activationMode?: TreeActivationMode;
  /**
   * `"multiple"` holds a set of rows (GAP-151): a click selects one row,
   * Ctrl or Cmd with a click adds or takes away a row, and Shift with a click
   * selects the rows from the last one chosen; Shift with the arrows, Home
   * and End selects as focus moves, Space adds or takes away the focused row
   * and Ctrl or Cmd+A selects every row. Ranges pass over disabled rows and
   * section headings. `"single"`, the default, is one `selectedId`.
   */
  selectionMode?: TreeSelectionMode;
  /** The selected rows of a `"multiple"` tree, controlled. */
  selectedIds?: string[];
  /** The rows a `"multiple"` tree starts with selected. */
  defaultSelectedIds?: string[];
  /** Every change to a `"multiple"` tree's selected rows. */
  onSelectedIdsChange?: (ids: string[]) => void;
  /**
   * Where each row's meta goes: `"inline"`, after the name (the default), or
   * `"below"`, on a line of its own under it, so the name keeps the row's
   * width (GAP-107). Rows composed as children take it from here too.
   */
  metaPlacement?: TreeMetaPlacement;
  /**
   * Draws only the rows in view (GAP-151), for a tree of thousands: the Tree
   * scrolls itself, so give it a height. The focused row is always drawn, and
   * every row's level, place in its set and type-ahead come from `data`, so
   * the keyboard and a screen reader reach rows out of view.
   */
  virtualized?: boolean;
  /** Rows drawn past each edge of the view when `virtualized`: 8 by default. */
  overscan?: number;
  /**
   * A right click, or the keyboard's menu key, on a row: the row takes focus
   * and, if it is not selected, the selection, then this runs. Wrap the Tree
   * in a `ContextMenuTrigger` for the menu itself (GAP-155).
   */
  onItemContextMenu?: (item: TreeItem, event: React.MouseEvent) => void;
  /**
   * The locale a section's count is written in for a screen reader ("POI,
   * 3,257"). Without it, the page's `lang`, read once the tree has mounted;
   * until then, and on a server render, en-US, so a server and its client
   * write the same words and hydration never disagrees.
   */
  locale?: string;
  /**
   * The element that scrolls a `virtualized` tree: a box inside the tree,
   * which `ref` is not. Use it to read or set the scroll position. Without
   * `virtualized` the tree does not scroll itself, and this stays null.
   */
  scrollerRef?: React.Ref<HTMLDivElement>;
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  defaultSelectedId?: string;
  selectedId?: string;
  onSelectionChange?: (item: TreeItem) => void;
  renderIcon?: (context: TreeItemRenderContext) => React.ReactNode;
  renderMeta?: (context: TreeItemRenderContext) => React.ReactNode;
  renderActions?: (context: TreeItemRenderContext) => React.ReactNode;
}

export interface TreeItemRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: React.ReactNode;
  actions?: React.ReactNode;
  actionsVisibility?: "auto" | "always";
  count?: React.ReactNode;
  density?: TreeDensity;
  /** How deep the row is, 0 at the top: its indent, and its `aria-level`, one more. */
  depth?: number;
  /** Dims the row, and is its `aria-disabled`. */
  disabled?: boolean;
  /**
   * As Tree's `divided`: a stroke under the row, and an open parent row on a
   * surface, both reaching the Tree's `bleed` past it. Defaults to the
   * Tree's.
   */
  divided?: boolean;
  /** Whether a row with children shows them: its `aria-expanded`. */
  expanded?: boolean;
  /**
   * As Tree's `metaPlacement`: `"below"` draws `meta` on a line under the
   * name (GAP-107). Defaults to the Tree's, else `"inline"`.
   */
  metaPlacement?: TreeMetaPlacement;
  focusVisible?: boolean;
  /** Draws the disclosure, and gives the row `aria-expanded`. */
  hasChildren?: boolean;
  icon?: React.ReactNode;
  indent?: number;
  meta?: React.ReactNode;
  onDisclosureClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  /** Its `aria-selected`, and the selected fill. */
  selected?: boolean;
}

export interface TreeSectionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: React.ReactNode;
  count?: React.ReactNode;
  density?: TreeDensity;
  /** The depth of the items it heads: its indent. */
  depth?: number;
  indent?: number;
}

interface VisibleTreeItem {
  item: TreeItem;
  depth: number;
  /** The nearest row above it, past any section. */
  parentId?: string;
  /** The innermost section it is in. */
  sectionId?: string;
  section: boolean;
  /** Its place in its set of rows, from 1, and the set's size. */
  posInSet: number;
  setSize: number;
}

/** Rows past which a virtualized tree with no height of its own warns. */
const UNBOUNDED_WARNING_ROWS = 100;

// A layout effect in the browser, an effect on a server render.
const useTreeLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/** A Tree's `divided`, for the rows composed in it as children. */
const TreeDividedContext = React.createContext(false);
/**
 * The locale a Tree writes its counts in: its `locale`, else the page's
 * `lang` after mount; en-US on a server render, the first client render and
 * a row outside a Tree.
 */
const TreeLocaleContext = React.createContext("en-US");
/**
 * Whether the rows are in a virtualised Tree, which scrolls itself and so
 * clips whatever reaches past it: their focus ring is drawn inside them.
 */
const TreeScrollerContext = React.createContext(false);
/** A Tree's `metaPlacement`, for the rows composed in it as children. */
const TreeMetaPlacementContext = React.createContext<
  TreeMetaPlacement | undefined
>(undefined);

const countPillClass =
  "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill border border-border bg-muted px-1.5 text-xs font-medium leading-none text-foreground";

/** A row's words, for type-ahead and a section's group name. */
const treeItemText = (item: TreeItem) =>
  item.textValue ??
  (typeof item.name === "string" || typeof item.name === "number"
    ? String(item.name)
    : "");

/**
 * A section's group name: its words and its count, "POI, 3,257", so a
 * screen reader hears the count the heading shows.
 */
const treeSectionLabel = (
  item: TreeItem,
  depth: number,
  locale: string | undefined,
) => {
  const text = treeItemText(item);
  // A count given as a slot is read for what it returns; a number is
  // written in the tree's locale, a string as it is, anything else not read.
  const given =
    typeof item.count === "function"
      ? item.count(sectionContext(item, depth))
      : item.count;
  let count = "";
  if (typeof given === "number") count = formatTreeCount(given, locale);
  else if (typeof given === "string") count = given;
  return [text, count].filter(Boolean).join(", ") || undefined;
};

/**
 * A number count as the app's language writes it, grouped: 13,031 in
 * en-US, 13.031 in de-DE. The same on screen as a screen reader hears it.
 */
const formatTreeCount = (count: number, locale: string | undefined) => {
  try {
    return count.toLocaleString(locale);
  } catch {
    return count.toLocaleString(RENDER_LOCALE);
  }
};

/** A count as drawn: a number grouped in the tree's locale, else as given. */
const useTreeCount = (count: React.ReactNode) => {
  const locale = React.useContext(TreeLocaleContext);
  return typeof count === "number" ? formatTreeCount(count, locale) : count;
};

/** What a section's slots are given: it is open, and never selected. */
const sectionContext = (
  item: TreeItem,
  depth: number,
): TreeItemRenderContext => ({
  item,
  depth,
  hasChildren: Boolean(item.children?.length),
  expanded: true,
  selected: false,
  focused: false,
  disabled: Boolean(item.disabled),
  toggle: () => undefined,
  select: () => undefined,
});

/** The page's language, for a tree given no `locale`. */
const documentLocale = () =>
  (typeof document !== "undefined" && document.documentElement.lang) ||
  undefined;

/** The locale a server render and the first client render share. */
const RENDER_LOCALE = "en-US";

const isEnabledRow = (visible: VisibleTreeItem) =>
  !visible.section && !visible.item.disabled;

const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      ariaLabel = "Tree",
      activationMode = "select-toggle",
      children,
      className,
      data = [],
      density = "default",
      divided,
      bleed,
      defaultExpandedIds = [],
      expandedIds,
      indent = 20,
      onExpandedChange,
      defaultSelectedId,
      selectedId,
      onSelectionChange,
      selectionMode = "single",
      selectedIds,
      defaultSelectedIds,
      onSelectedIdsChange,
      metaPlacement,
      virtualized = false,
      overscan = 8,
      onItemContextMenu,
      locale,
      scrollerRef: scrollerRefProp,
      renderIcon,
      renderMeta,
      renderActions,
      ...props
    },
    ref,
  ) => {
    const multiple = selectionMode === "multiple";
    const [internalExpandedIds, setInternalExpandedIds] = React.useState(
      () => new Set(defaultExpandedIds),
    );
    const [internalSelectedId, setInternalSelectedId] =
      React.useState(defaultSelectedId);
    const [internalSelectedIds, setInternalSelectedIds] = React.useState(
      () => new Set(defaultSelectedIds),
    );
    const [focusedId, setFocusedId] = React.useState(
      () =>
        (multiple ? defaultSelectedIds?.[0] : defaultSelectedId) ??
        findFirstEnabledTreeItemId(data),
    );
    const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
    const expandedSet = React.useMemo(
      () => new Set(expandedIds ?? Array.from(internalExpandedIds)),
      [expandedIds, internalExpandedIds],
    );
    const currentSelectedId = selectedId ?? internalSelectedId;
    const selectedSet = React.useMemo(
      () =>
        multiple
          ? new Set(selectedIds ?? Array.from(internalSelectedIds))
          : new Set(currentSelectedId === undefined ? [] : [currentSelectedId]),
      [multiple, selectedIds, internalSelectedIds, currentSelectedId],
    );
    const visibleItems = React.useMemo(
      () => flattenTreeItems(data, expandedSet),
      [data, expandedSet],
    );
    const visibleById = React.useMemo(
      () => new Map(visibleItems.map((visible) => [visible.item.id, visible])),
      [visibleItems],
    );
    // Where a range starts: the row last chosen, or moved to without Shift.
    const anchorId = React.useRef<string | undefined>(focusedId);
    // What has been typed for type-ahead, and when it is forgotten.
    const typeahead = React.useRef({ text: "", timer: 0 });
    const pendingFocusId = React.useRef<string | undefined>();
    const scrollerRef = React.useRef<HTMLDivElement | null>(null);
    // The page's language, read after mount: a server has none to read, so
    // its render and the client's first are both en-US.
    const [pageLocale, setPageLocale] = React.useState(RENDER_LOCALE);
    React.useEffect(() => {
      const lang = documentLocale();
      if (lang) setPageLocale(lang);
    }, []);
    const setScrollerRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        scrollerRef.current = node;
        if (typeof scrollerRefProp === "function") scrollerRefProp(node);
        else if (scrollerRefProp)
          (
            scrollerRefProp as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
      },
      [scrollerRefProp],
    );

    const setExpandedSet = React.useCallback(
      (next: Set<string>) => {
        if (expandedIds === undefined) {
          setInternalExpandedIds(next);
        }
        onExpandedChange?.(Array.from(next));
      },
      [expandedIds, onExpandedChange],
    );

    // The selection as last set, so two changes in one event (select, then
    // collapse) build on each other rather than on the render's.
    const latestSelected = React.useRef(selectedSet);
    latestSelected.current = selectedSet;

    const setSelectedSet = React.useCallback(
      (next: Set<string>) => {
        latestSelected.current = next;
        if (selectedIds === undefined) setInternalSelectedIds(next);
        onSelectedIdsChange?.(Array.from(next));
      },
      [onSelectedIdsChange, selectedIds],
    );

    const toggleExpanded = React.useCallback(
      (item: TreeItem, force?: boolean) => {
        if (!item.children?.length || item.disabled || item.section) return;

        const next = new Set(expandedSet);
        const shouldExpand = force ?? !next.has(item.id);

        if (shouldExpand) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }

        setExpandedSet(next);
      },
      [expandedSet, setExpandedSet],
    );

    // A multiple tree lets go of the rows a collapse hides, in one change,
    // once the collapse has taken effect: from the expanded set the tree
    // draws, so a controlled `expandedIds` that keeps a row open keeps its
    // rows selected. A single tree keeps its one row, which a product's
    // editor shows, wherever it is.
    const drawnExpanded = React.useRef(expandedSet);
    React.useEffect(() => {
      const before = drawnExpanded.current;
      drawnExpanded.current = expandedSet;
      if (!multiple || before === expandedSet) return;
      const closed = Array.from(before).filter((id) => !expandedSet.has(id));
      if (closed.length === 0) return;
      const hidden = new Set<string>();
      for (const id of closed) {
        const item = findTreeItem(data, id);
        if (item) collectDescendantIds(item, hidden);
      }
      // A row still drawn (under another open path) is not hidden.
      for (const id of visibleById.keys()) hidden.delete(id);
      const current = latestSelected.current;
      if (Array.from(current).some((id) => hidden.has(id))) {
        setSelectedSet(
          new Set(Array.from(current).filter((id) => !hidden.has(id))),
        );
      }
      if (anchorId.current && hidden.has(anchorId.current))
        anchorId.current = undefined;
      // Runs when the drawn expanded set changes, and only then.
    }, [expandedSet]);

    const selectItem = React.useCallback(
      (item: TreeItem) => {
        if (item.disabled || item.section) return;

        anchorId.current = item.id;
        if (multiple) {
          setSelectedSet(new Set([item.id]));
        } else if (selectedId === undefined) {
          setInternalSelectedId(item.id);
        }
        onSelectionChange?.(item);
      },
      [multiple, onSelectionChange, selectedId, setSelectedSet],
    );

    /** The enabled rows from the anchor to `toId`, in the order drawn. */
    const rangeIds = React.useCallback(
      (toId: string) => {
        const from = visibleItems.findIndex(
          (visible) => visible.item.id === (anchorId.current ?? toId),
        );
        const to = visibleItems.findIndex(
          (visible) => visible.item.id === toId,
        );
        if (to < 0) return [];
        const [start, end] =
          from < 0 ? [to, to] : from < to ? [from, to] : [to, from];
        return visibleItems
          .slice(start, end + 1)
          .filter(isEnabledRow)
          .map((visible) => visible.item.id);
      },
      [visibleItems],
    );

    const selectRange = React.useCallback(
      (toId: string, add = false) => {
        const next = new Set(add ? selectedSet : []);
        for (const id of rangeIds(toId)) next.add(id);
        setSelectedSet(next);
      },
      [rangeIds, selectedSet, setSelectedSet],
    );

    const toggleSelected = React.useCallback(
      (item: TreeItem) => {
        anchorId.current = item.id;
        const next = new Set(selectedSet);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        setSelectedSet(next);
      },
      [selectedSet, setSelectedSet],
    );

    // ---- Virtualisation (GAP-151) ----------------------------------------
    // Each row's height: measured once drawn, else estimated from what it
    // shows. The offsets are their running sum, so a row out of view still
    // has its place.
    const measuredHeights = React.useRef(new Map<string, number>());
    const [measureVersion, bumpMeasureVersion] = React.useReducer(
      (version: number) => version + 1,
      0,
    );
    const [scrollTop, setScrollTop] = React.useState(0);
    const [viewportHeight, setViewportHeight] = React.useState(0);
    const offsets = React.useMemo(() => {
      if (!virtualized) return [];
      const rowHeight = density === "compact" ? 32 : 40;
      const sums = new Array<number>(visibleItems.length + 1);
      sums[0] = 0;
      visibleItems.forEach((visible, index) => {
        const measured = measuredHeights.current.get(visible.item.id);
        let height = measured;
        if (height === undefined) {
          if (visible.section) {
            height = density === "compact" ? 24 : 32;
          } else {
            const hasMeta =
              visible.item.meta !== undefined || renderMeta !== undefined;
            height =
              (metaPlacement === "below" && hasMeta
                ? rowHeight + (density === "compact" ? 12 : 8)
                : rowHeight) + (divided ? 1 : 0);
          }
        }
        sums[index + 1] = sums[index] + height;
      });
      return sums;
      // measureVersion: a new measurement moves the offsets.
    }, [
      virtualized,
      visibleItems,
      density,
      divided,
      metaPlacement,
      renderMeta,
      measureVersion,
    ]);

    const scrollRowIntoView = React.useCallback(
      (id: string) => {
        const scroller = scrollerRef.current;
        if (!virtualized || !scroller) return;
        const index = visibleItems.findIndex(
          (visible) => visible.item.id === id,
        );
        if (index < 0) return;
        const top = offsets[index];
        const bottom = offsets[index + 1];
        const view = scroller.clientHeight || viewportHeight;
        let next = scroller.scrollTop;
        if (top < next) next = top;
        else if (bottom > next + view) next = bottom - view;
        if (next !== scroller.scrollTop) {
          scroller.scrollTop = next;
          setScrollTop(next);
        }
      },
      [offsets, viewportHeight, virtualized, visibleItems],
    );

    const focusItem = React.useCallback(
      (id: string) => {
        setFocusedId(id);
        scrollRowIntoView(id);
        const node = itemRefs.current.get(id);
        if (node) node.focus();
        // Out of view, the row is drawn in the next commit: focus it then.
        else pendingFocusId.current = id;
      },
      [scrollRowIntoView],
    );

    useTreeLayoutEffect(() => {
      const id = pendingFocusId.current;
      if (id === undefined) return;
      const node = itemRefs.current.get(id);
      if (node) {
        pendingFocusId.current = undefined;
        node.focus();
      }
    });

    const activateItem = React.useCallback(
      (item: TreeItem, event?: React.MouseEvent) => {
        if (item.disabled || item.section) return;

        if (
          multiple &&
          event &&
          (event.shiftKey || event.ctrlKey || event.metaKey)
        ) {
          setFocusedId(item.id);
          if (event.shiftKey)
            selectRange(item.id, event.ctrlKey || event.metaKey);
          else toggleSelected(item);
          return;
        }

        if (activationMode === "select" || activationMode === "select-toggle") {
          selectItem(item);
        }

        if (
          (activationMode === "toggle" || activationMode === "select-toggle") &&
          item.children?.length
        ) {
          toggleExpanded(item);
        }
      },
      [
        activationMode,
        multiple,
        selectItem,
        selectRange,
        toggleExpanded,
        toggleSelected,
      ],
    );

    const handleItemContextMenu = React.useCallback(
      (item: TreeItem, event: React.MouseEvent) => {
        if (!onItemContextMenu || item.disabled || item.section) return;
        if (!selectedSet.has(item.id)) selectItem(item);
        setFocusedId(item.id);
        onItemContextMenu(item, event);
      },
      [onItemContextMenu, selectItem, selectedSet],
    );

    /** Type-ahead: the next row whose words start with what was typed. */
    const typeAhead = React.useCallback(
      (item: TreeItem, key: string): boolean => {
        const state = typeahead.current;
        window.clearTimeout(state.timer);
        state.text += key.toLowerCase();
        state.timer = window.setTimeout(() => {
          state.text = "";
        }, 500);
        const rows = visibleItems.filter(isEnabledRow);
        const current = rows.findIndex(
          (visible) => visible.item.id === item.id,
        );
        // One letter, or the same letter again, moves on from this row;
        // more letters keep to it while it still matches.
        const repeated = Array.from(state.text).every(
          (letter) => letter === state.text[0],
        );
        const search = repeated ? state.text[0] : state.text;
        const start = repeated ? current + 1 : current;
        for (let step = 0; step < rows.length; step += 1) {
          const candidate = rows[(start + step + rows.length) % rows.length];
          if (treeItemText(candidate.item).toLowerCase().startsWith(search)) {
            if (candidate.item.id === item.id) return false;
            focusItem(candidate.item.id);
            anchorId.current = candidate.item.id;
            return true;
          }
        }
        return false;
      },
      [focusItem, visibleItems],
    );

    const handleItemKeyDown = React.useCallback(
      (item: TreeItem, event: React.KeyboardEvent<HTMLDivElement>) => {
        if (item.disabled) return;

        const currentIndex = visibleItems.findIndex(
          (visible) => visible.item.id === item.id,
        );
        const enabledItems = visibleItems.filter(isEnabledRow);
        const currentEnabledIndex = enabledItems.findIndex(
          (visible) => visible.item.id === item.id,
        );
        const hasChildren = Boolean(item.children?.length);
        const isOpen = expandedSet.has(item.id);
        const command = event.ctrlKey || event.metaKey;
        const extend = multiple && event.shiftKey;
        // Focus moves to `id`: with Shift in a multiple tree, the range from
        // the anchor goes with it; without, the anchor does.
        const moveTo = (id: string | undefined) => {
          if (!id) return;
          focusItem(id);
          if (extend) selectRange(id);
          else anchorId.current = id;
        };

        if (
          multiple &&
          command &&
          !event.altKey &&
          event.key.toLowerCase() === "a"
        ) {
          event.preventDefault();
          setSelectedSet(
            new Set(enabledItems.map((visible) => visible.item.id)),
          );
          return;
        }

        // Type-ahead is the tree's, after the product's own onKeyDown: a
        // Space while a word is being typed is part of it.
        if (event.key === " " && typeahead.current.text !== "") return;

        // `*` opens every row beside this one that has rows of its own.
        if (event.key === "*" && !command && !event.altKey) {
          event.preventDefault();
          const here = visibleItems[currentIndex];
          const next = new Set(expandedSet);
          for (const visible of visibleItems) {
            if (
              isEnabledRow(visible) &&
              visible.parentId === here.parentId &&
              visible.depth === here.depth &&
              visible.item.children?.length
            )
              next.add(visible.item.id);
          }
          if (next.size !== expandedSet.size) setExpandedSet(next);
          return;
        }

        // A page of rows: as many as the view holds, less one to keep.
        if (event.key === "PageDown" || event.key === "PageUp") {
          event.preventDefault();
          const view = virtualized
            ? scrollerRef.current?.clientHeight || viewportHeight || 400
            : typeof window === "undefined"
              ? 400
              : window.innerHeight;
          // One rule on every platform: the rows that fit the view, less
          // one, at the density's row height and a divided row's stroke.
          const rowHeight =
            (density === "compact" ? 32 : 40) + (divided ? 1 : 0);
          const page = Math.max(1, Math.floor(view / rowHeight) - 1);
          const target =
            event.key === "PageDown"
              ? Math.min(enabledItems.length - 1, currentEnabledIndex + page)
              : Math.max(0, currentEnabledIndex - page);
          moveTo(enabledItems[target]?.item.id);
          return;
        }

        if (event.key === " " && multiple) {
          event.preventDefault();
          if (event.shiftKey) selectRange(item.id);
          else toggleSelected(item);
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateItem(item);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveTo(enabledItems[currentEnabledIndex + 1]?.item.id);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveTo(enabledItems[currentEnabledIndex - 1]?.item.id);
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          moveTo(enabledItems[0]?.item.id);
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          moveTo(enabledItems[enabledItems.length - 1]?.item.id);
          return;
        }

        if (event.key === "ArrowRight" && hasChildren) {
          event.preventDefault();
          if (!isOpen) {
            toggleExpanded(item, true);
          } else {
            // Its first child: past a section's heading, if it opens with one.
            const depth = visibleItems[currentIndex].depth;
            for (const next of visibleItems.slice(currentIndex + 1)) {
              if (next.depth <= depth && !next.section) break;
              if (next.section) continue;
              if (next.depth > depth) moveTo(next.item.id);
              break;
            }
          }
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (hasChildren && isOpen) {
            toggleExpanded(item, false);
            return;
          }

          const parentId = visibleItems[currentIndex]?.parentId;
          if (parentId) moveTo(parentId);
        }
      },
      [
        activateItem,
        density,
        divided,
        expandedSet,
        focusItem,
        multiple,
        selectRange,
        setExpandedSet,
        setSelectedSet,
        toggleExpanded,
        toggleSelected,
        viewportHeight,
        virtualized,
        visibleItems,
      ],
    );

    React.useEffect(() => {
      const state = typeahead.current;
      return () => window.clearTimeout(state.timer);
    }, []);

    // The tab stop moves off an item that is no longer drawn, or can no
    // longer be used, in the render that says so, so every commit has one
    // (GAP-231): to the chosen item if it is drawn and enabled, else the
    // first enabled one.
    const isTabStop = (id: string | undefined) =>
      id !== undefined &&
      Boolean(visibleById.get(id) && isEnabledRow(visibleById.get(id)!));
    if (!isTabStop(focusedId)) {
      const chosen = multiple
        ? visibleItems.find(
            (visible) =>
              isEnabledRow(visible) && selectedSet.has(visible.item.id),
          )?.item.id
        : currentSelectedId;
      const nextFocusedId = isTabStop(chosen)
        ? chosen
        : visibleItems.find(isEnabledRow)?.item.id;
      if (nextFocusedId !== focusedId) setFocusedId(nextFocusedId);
    }

    // Virtualised, the rows in view, measured after each commit, and the
    // view's own height.
    const rowBoxes = React.useRef(new Map<string, HTMLElement>());
    const warnedUnbounded = React.useRef(false);
    useTreeLayoutEffect(() => {
      if (!virtualized) return;
      const scroller = scrollerRef.current;
      if (scroller && scroller.clientHeight !== viewportHeight) {
        setViewportHeight(scroller.clientHeight);
      }
      let changed = false;
      rowBoxes.current.forEach((box, id) => {
        const height = box.offsetHeight;
        // 0 is a box with no layout (hidden, or a test's DOM): keep the
        // estimate.
        if (height > 0 && measuredHeights.current.get(id) !== height) {
          measuredHeights.current.set(id, height);
          changed = true;
        }
      });
      if (changed) bumpMeasureVersion();
      // With no height to hold it, the tree is as tall as its rows and draws
      // every one: say so once, in development.
      if (
        process.env.NODE_ENV !== "production" &&
        scroller &&
        !warnedUnbounded.current &&
        visibleItems.length > UNBOUNDED_WARNING_ROWS &&
        scroller.clientHeight > 0 &&
        scroller.clientHeight >= scroller.scrollHeight
      ) {
        warnedUnbounded.current = true;
        console.warn(
          `Tree: a virtualized tree of ${visibleItems.length} rows has no height of its own, so it is as tall as its rows and draws every one. Give it a height (style={{ height: 480 }} or a class), or, in a flex column, flex: 1 with min-height: 0 (min-h-0), so it scrolls itself.`,
        );
      }
    });
    React.useEffect(() => {
      const scroller = scrollerRef.current;
      if (!virtualized || !scroller || typeof ResizeObserver === "undefined")
        return;
      const observer = new ResizeObserver(() =>
        setViewportHeight(scroller.clientHeight),
      );
      observer.observe(scroller);
      return () => observer.disconnect();
    }, [virtualized]);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const nodeProps: TreeNodeSharedProps = {
      density,
      locale: locale ?? pageLocale,
      divided,
      expandedSet,
      focusedId,
      indent,
      itemRefs,
      metaPlacement,
      selectedSet,
      visibleById,
      onActivate: activateItem,
      onContextMenu: onItemContextMenu ? handleItemContextMenu : undefined,
      onFocusItem: setFocusedId,
      onKeyDown: handleItemKeyDown,
      onSelect: selectItem,
      onToggle: toggleExpanded,
      renderActions,
      renderIcon,
      renderMeta,
    };

    let content: React.ReactNode;
    if (children !== undefined && children !== null) {
      content = children;
    } else if (virtualized) {
      content = renderVirtualRows({
        visibleItems,
        visibleById,
        offsets,
        scrollTop,
        viewportHeight,
        overscan,
        focusedId,
        rowBoxes,
        nodeProps,
      });
    } else {
      content = data.map((item) => (
        <TreeNode key={item.id} item={item} depth={0} {...nodeProps} />
      ));
    }

    return (
      <div
        ref={setRefs}
        role="tree"
        aria-label={ariaLabel}
        aria-multiselectable={multiple || undefined}
        data-virtualized={virtualized || undefined}
        className={cn(
          "w-full text-sm",
          virtualized && "relative flex flex-col",
          className,
        )}
        {...props}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Type-ahead, on a row of this tree's own: a printable key with no
          // Ctrl, Cmd or Alt, never + - or *, which a tree's keys may mean.
          const target = event.target as HTMLElement;
          const id = target.getAttribute?.("data-tree-id");
          const visible = id === null ? undefined : visibleById.get(id);
          if (
            !visible ||
            !isEnabledRow(visible) ||
            event.key.length !== 1 ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            "+-*".includes(event.key) ||
            (event.key === " " && typeahead.current.text === "")
          )
            return;
          // A Space inside a word is always the word's, so the page under
          // it never scrolls, whether or not focus moves.
          if (typeAhead(visible.item, event.key) || event.key === " ")
            event.preventDefault();
        }}
        onScroll={virtualized ? undefined : props.onScroll}
        style={
          bleed === undefined
            ? props.style
            : ({
                "--kozmos-tree-bleed":
                  typeof bleed === "number" ? `${bleed}px` : bleed,
                ...props.style,
              } as React.CSSProperties)
        }
      >
        <TreeDividedContext.Provider value={!!divided}>
          <TreeMetaPlacementContext.Provider value={metaPlacement}>
            <TreeScrollerContext.Provider value={virtualized}>
              <TreeLocaleContext.Provider value={locale ?? pageLocale}>
                {virtualized ? (
                  // The scroller is inside the tree, so the product's width,
                  // margin and height classes stay the tree's own. A scroller
                  // clips what reaches past it: divided with a bleed, this one
                  // reaches the bleed past the tree on each side, and keeps the
                  // rows in place inside its padding, where each stroke meets
                  // its edges with no sideways scroll.
                  <div
                    ref={setScrollerRef}
                    data-tree-scroller=""
                    className="relative min-h-0 flex-auto overflow-y-auto"
                    style={
                      divided && bleed !== undefined
                        ? {
                            marginInline: "calc(var(--kozmos-tree-bleed) * -1)",
                            paddingInline: "var(--kozmos-tree-bleed)",
                          }
                        : undefined
                    }
                    onScroll={(event) => {
                      setScrollTop(event.currentTarget.scrollTop);
                      props.onScroll?.(event);
                    }}
                  >
                    {content}
                  </div>
                ) : (
                  content
                )}
              </TreeLocaleContext.Provider>
            </TreeScrollerContext.Provider>
          </TreeMetaPlacementContext.Provider>
        </TreeDividedContext.Provider>
      </div>
    );
  },
);
Tree.displayName = "Tree";

interface TreeNodeSharedProps {
  density: TreeDensity;
  /** The locale a section's count is written in, for its group's name. */
  locale?: string;
  divided?: boolean;
  expandedSet: Set<string>;
  focusedId?: string;
  indent: number;
  itemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  metaPlacement?: TreeMetaPlacement;
  selectedSet: Set<string>;
  visibleById: Map<string, VisibleTreeItem>;
  onActivate: (item: TreeItem, event?: React.MouseEvent) => void;
  onContextMenu?: (item: TreeItem, event: React.MouseEvent) => void;
  onFocusItem: (id: string) => void;
  onKeyDown: (
    item: TreeItem,
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => void;
  onSelect: (item: TreeItem) => void;
  onToggle: (item: TreeItem, force?: boolean) => void;
  renderIcon?: (context: TreeItemRenderContext) => React.ReactNode;
  renderMeta?: (context: TreeItemRenderContext) => React.ReactNode;
  renderActions?: (context: TreeItemRenderContext) => React.ReactNode;
}

interface TreeNodeProps extends TreeNodeSharedProps {
  item: TreeItem;
  depth: number;
}

/** A section's heading, drawn by Tree from `data`. */
const TreeSectionHeading = ({
  item,
  depth,
  density,
  indent,
}: Pick<TreeNodeProps, "item" | "depth" | "density" | "indent">) => {
  const context = sectionContext(item, depth);
  return (
    <TreeSectionRow
      name={item.name}
      count={resolveTreeSlot(item.count, context)}
      depth={depth}
      density={density}
      indent={indent}
      className={item.className}
    />
  );
};

/** One row of a tree drawn from `data`, without its children. */
const TreeNodeRow = ({
  item,
  depth,
  density,
  divided,
  expandedSet,
  focusedId,
  indent,
  itemRefs,
  metaPlacement,
  selectedSet,
  visibleById,
  onActivate,
  onContextMenu,
  onFocusItem,
  onKeyDown,
  onSelect,
  onToggle,
  renderIcon,
  renderMeta,
  renderActions,
}: TreeNodeProps) => {
  const hasChildren = Boolean(item.children?.length);
  const isOpen = expandedSet.has(item.id);
  const isSelected = selectedSet.has(item.id);
  const isFocused = focusedId === item.id;
  const isDisabled = Boolean(item.disabled);
  const visible = visibleById.get(item.id);

  const select = () => {
    onSelect(item);
  };

  const toggle = (force?: boolean) => {
    onToggle(item, force);
  };

  const context: TreeItemRenderContext = {
    item,
    depth,
    hasChildren,
    expanded: isOpen,
    selected: isSelected,
    focused: isFocused,
    disabled: isDisabled,
    toggle,
    select,
  };
  const itemIcon = resolveTreeSlot(item.icon, context);
  const icon =
    itemIcon !== undefined
      ? itemIcon
      : (renderIcon?.(context) ??
        (hasChildren ? (
          <Folder aria-hidden="true" className="h-4 w-4" />
        ) : (
          <File aria-hidden="true" className="h-4 w-4" />
        )));
  const count = resolveTreeSlot(item.count, context);
  const itemMeta = resolveTreeSlot(item.meta, context);
  const meta = itemMeta !== undefined ? itemMeta : renderMeta?.(context);
  const itemActions = resolveTreeSlot(item.actions, context);
  const actions =
    itemActions !== undefined ? itemActions : renderActions?.(context);
  const registerItem = (node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(item.id, node);
    } else {
      itemRefs.current.delete(item.id);
    }
  };

  return (
    // The row is the treeitem: its level and state come from the props
    // below, as a composed row's do; its place in its set from the data, so
    // it is right when the rows round it are not drawn.
    <TreeItemRow
      ref={registerItem}
      tabIndex={isDisabled ? -1 : isFocused ? 0 : -1}
      aria-setsize={visible?.setSize}
      aria-posinset={visible?.posInSet}
      data-tree-id={item.id}
      actions={actions}
      count={count}
      density={density}
      depth={depth}
      disabled={isDisabled}
      divided={divided}
      expanded={isOpen}
      hasChildren={hasChildren}
      icon={icon}
      indent={indent}
      meta={meta}
      metaPlacement={metaPlacement}
      name={item.name}
      selected={isSelected}
      className={item.className}
      onClick={(event) => onActivate(item, event)}
      onContextMenu={
        onContextMenu ? (event) => onContextMenu(item, event) : undefined
      }
      onDisclosureClick={(event) => {
        if (!hasChildren) return;
        event.stopPropagation();
        onToggle(item);
      }}
      onFocus={() => onFocusItem(item.id)}
      onKeyDown={(event) => onKeyDown(item, event)}
    />
  );
};

const TreeNode = (props: TreeNodeProps) => {
  const { item, depth, expandedSet } = props;

  // A section: its heading, then its items in a group named by it, at its
  // own depth. The heading is for the eye; the group's name is what a screen
  // reader hears.
  if (item.section) {
    return (
      <>
        <TreeSectionHeading {...props} />
        {Boolean(item.children?.length) && (
          <div
            role="group"
            aria-label={treeSectionLabel(item, depth, props.locale)}
          >
            {item.children?.map((child) => (
              <TreeNode key={child.id} {...props} item={child} depth={depth} />
            ))}
          </div>
        )}
      </>
    );
  }

  const isOpen = expandedSet.has(item.id);
  return (
    <>
      <TreeNodeRow {...props} />
      {isOpen && Boolean(item.children?.length) && (
        <div role="group">
          {item.children?.map((child) => (
            <TreeNode
              key={child.id}
              {...props}
              item={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

/**
 * The rows of a virtualised tree in view, and the focused row wherever it
 * is, with spacers for the rows between them (GAP-151). A section's items
 * drawn together are in a group named by it.
 */
const renderVirtualRows = ({
  visibleItems,
  visibleById,
  offsets,
  scrollTop,
  viewportHeight,
  overscan,
  focusedId,
  rowBoxes,
  nodeProps,
}: {
  visibleItems: VisibleTreeItem[];
  visibleById: Map<string, VisibleTreeItem>;
  offsets: number[];
  scrollTop: number;
  viewportHeight: number;
  overscan: number;
  focusedId?: string;
  rowBoxes: React.MutableRefObject<Map<string, HTMLElement>>;
  nodeProps: TreeNodeSharedProps;
}) => {
  const count = visibleItems.length;
  if (count === 0) return null;
  // With no layout to read yet, a view of 400.
  const view = viewportHeight > 0 ? viewportHeight : 400;
  const first = Math.max(0, findOffsetIndex(offsets, scrollTop) - overscan);
  const last = Math.min(
    count - 1,
    findOffsetIndex(offsets, scrollTop + view) + overscan,
  );
  const indices: number[] = [];
  const focused =
    focusedId === undefined ? undefined : visibleById.get(focusedId);
  const focusedIndex = focused ? visibleItems.indexOf(focused) : -1;
  if (focusedIndex >= 0 && focusedIndex < first) indices.push(focusedIndex);
  for (let index = first; index <= last; index += 1) indices.push(index);
  if (focusedIndex > last) indices.push(focusedIndex);

  // Rows go in their section's group, keyed by the section, so a row keeps
  // its element (and its focus) as the view moves; a section drawn again
  // after a section inside it gets a second group.
  const out: React.ReactNode[] = [];
  let block: React.ReactNode[] = out;
  let blockSection: string | undefined;
  const seen = new Map<string, number>();
  const openBlock = (sectionId: string | undefined) => {
    blockSection = sectionId;
    if (sectionId === undefined) {
      block = out;
      return;
    }
    const occurrence = seen.get(sectionId) ?? 0;
    seen.set(sectionId, occurrence + 1);
    const section = visibleById.get(sectionId);
    block = [];
    out.push(
      <div
        key={`group-${sectionId}-${occurrence}`}
        role="group"
        aria-label={
          section &&
          treeSectionLabel(section.item, section.depth, nodeProps.locale)
        }
      >
        {block}
      </div>,
    );
  };
  let previous = -1;
  for (const index of indices) {
    const visible = visibleItems[index];
    if (previous === -1 || visible.sectionId !== blockSection) {
      openBlock(visible.sectionId);
    }
    const gap = offsets[index] - offsets[previous + 1];
    if (gap > 0) {
      block.push(
        <div
          key={`gap-${visible.item.id}`}
          aria-hidden="true"
          data-tree-spacer=""
          style={{ height: gap }}
        />,
      );
    }
    const id = visible.item.id;
    block.push(
      <div
        key={id}
        data-tree-row-box=""
        ref={(node) => {
          if (node) rowBoxes.current.set(id, node);
          else rowBoxes.current.delete(id);
        }}
      >
        {visible.section ? (
          <TreeSectionHeading
            item={visible.item}
            depth={visible.depth}
            density={nodeProps.density}
            indent={nodeProps.indent}
          />
        ) : (
          <TreeNodeRow
            {...nodeProps}
            item={visible.item}
            depth={visible.depth}
          />
        )}
      </div>,
    );
    previous = index;
  }
  const rest = offsets[count] - offsets[previous + 1];
  if (rest > 0) {
    out.push(
      <div
        key="gap-end"
        aria-hidden="true"
        data-tree-spacer=""
        style={{ height: rest }}
      />,
    );
  }
  return out;
};

/** The row at `offset`: the last whose top is at or above it. */
const findOffsetIndex = (offsets: number[], offset: number) => {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (offsets[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return Math.max(0, low);
};

/**
 * One row of a tree, and its treeitem: `depth` gives its `aria-level`,
 * `expanded` its `aria-expanded` when it has children, `selected` its
 * `aria-selected` and `disabled` its `aria-disabled`.
 *
 * Tree draws these rows itself from `data`. To compose a tree, put the rows
 * in a `Tree` with children, which is the `role="tree"` container, and a
 * parent's children in a `<div role="group">` right after its row. A composed
 * tree has no keyboard of its own: Tree moves focus with the arrow keys only
 * through `data`.
 *
 * A caller's own `role` or `aria-*` wins. With another role, such as `"none"`
 * inside a treeitem of the caller's own, the row adds no tree state.
 */
const TreeItemRow = React.forwardRef<HTMLDivElement, TreeItemRowProps>(
  (
    {
      actions,
      actionsVisibility = "auto",
      className,
      count,
      density = "default",
      depth = 0,
      disabled = false,
      divided: dividedProp,
      expanded = false,
      focusVisible = false,
      hasChildren = false,
      icon,
      indent = 20,
      meta,
      metaPlacement: metaPlacementProp,
      name,
      onDisclosureClick,
      role = "treeitem",
      selected = false,
      style,
      ...props
    },
    ref,
  ) => {
    const stopActionPropagation = (event: React.SyntheticEvent) => {
      event.stopPropagation();
    };
    const treeDivided = React.useContext(TreeDividedContext);
    const divided = dividedProp ?? treeDivided;
    // Divided, or in a tree that scrolls itself, the ring is drawn inside
    // the row, where nothing covers or clips it.
    const inScroller = React.useContext(TreeScrollerContext);
    const ringInside = divided || inScroller;
    const treeMetaPlacement = React.useContext(TreeMetaPlacementContext);
    const hasMeta = meta !== undefined && meta !== null;
    // GAP-107: below, the meta has a line of its own, so the name keeps the
    // row's width.
    const metaBelow =
      hasMeta && (metaPlacementProp ?? treeMetaPlacement) === "below";
    const shownCount = useTreeCount(count);
    const countPill = count !== undefined && count !== null && (
      <span className={countPillClass}>{shownCount}</span>
    );
    // GAP-204: the row is a treeitem whose level and state are the props it
    // already takes. A caller's own role or aria-* wins; with another role,
    // the row adds no tree state to it.
    const treeitem = role === "treeitem";

    const row = (
      <div
        ref={ref}
        role={role}
        aria-level={treeitem ? depth + 1 : undefined}
        aria-expanded={treeitem && hasChildren ? expanded : undefined}
        aria-selected={treeitem ? selected : undefined}
        aria-disabled={treeitem && disabled ? true : undefined}
        data-depth={depth}
        data-expanded={hasChildren ? expanded : undefined}
        data-selected={selected || undefined}
        data-focus-visible={focusVisible || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "group/treeitem flex w-full cursor-pointer items-center gap-2 rounded-control px-2 text-start outline-none transition-colors",
          density === "compact" ? "min-h-8 py-1" : "min-h-10 py-1.5",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Divided, the ring is drawn inside the row: outside it, the next
          // row's surface covered it, and a panel's edge could cut it.
          ringInside && "focus-visible:ring-inset focus-visible:ring-offset-0",
          // Selected, the hover fill at full strength, under the pointer
          // too; the hover's half step is for the rows not selected
          // (decision 173).
          selected ? "bg-hover-fill text-foreground" : "hover:bg-hover-fill/50",
          focusVisible &&
            (ringInside
              ? "ring-2 ring-inset ring-ring"
              : "ring-2 ring-ring ring-offset-2 ring-offset-background"),
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        style={{ paddingInlineStart: depth * indent + 8, ...style }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
          onClick={onDisclosureClick}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ChevronRight
                aria-hidden="true"
                className="kozmos-rtl-mirror h-4 w-4"
              />
            )
          ) : null}
        </span>
        {icon !== null && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
        )}
        {metaBelow ? (
          <span
            data-tree-meta-placement="below"
            className="flex min-w-0 flex-1 flex-col"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate">{name}</span>
              {countPill}
            </span>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {meta}
            </span>
          </span>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="min-w-0 truncate">{name}</span>
              {countPill}
            </span>
            {hasMeta && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {meta}
              </span>
            )}
          </>
        )}
        {actions !== undefined && actions !== null && (
          <span
            className={cn(
              "ms-auto flex shrink-0 items-center gap-1 transition-opacity",
              actionsVisibility === "auto" &&
                "opacity-0 group-hover/treeitem:opacity-100 group-focus-within/treeitem:opacity-100 group-data-[focus-visible=true]/treeitem:opacity-100 group-data-[selected=true]/treeitem:opacity-100 motion-reduce:transition-none",
              actionsVisibility === "always" && "opacity-100",
            )}
            onClick={stopActionPropagation}
            onDoubleClick={stopActionPropagation}
            onKeyDown={stopActionPropagation}
            onPointerDown={stopActionPropagation}
          >
            {actions}
          </span>
        )}
      </div>
    );
    // Divided (GAP-201): the stroke under the row and an open parent's
    // surface, on a box that reaches the Tree's bleed past it on each side,
    // to the panel's edges, while the row and its fills stay where they are.
    // The stroke is outside the row's height: a row and its stroke, as the
    // design draws a row and a separator.
    return divided ? (
      <div
        data-tree-divider=""
        className={cn(
          "border-b border-border",
          hasChildren &&
            expanded &&
            "bg-[var(--primitives-colors-background-50)]",
        )}
        style={{
          marginInline: "calc(var(--kozmos-tree-bleed, 0px) * -1)",
          paddingInline: "var(--kozmos-tree-bleed, 0px)",
        }}
      >
        {row}
      </div>
    ) : (
      row
    );
  },
);
TreeItemRow.displayName = "TreeItemRow";

type TreeParentItemRowProps = Omit<TreeItemRowProps, "hasChildren">;

/**
 * A row with children, as `TreeItemRow` with `hasChildren`: a treeitem whose
 * `expanded` is its `aria-expanded`. When it is expanded, put its children in
 * a `<div role="group">` right after it, at `depth` one more.
 */
const TreeParentItemRow = React.forwardRef<
  HTMLDivElement,
  TreeParentItemRowProps
>((props, ref) => <TreeItemRow ref={ref} {...props} hasChildren />);
TreeParentItemRow.displayName = "TreeParentItemRow";

type TreeChildItemRowProps = Omit<TreeItemRowProps, "hasChildren" | "expanded">;

/**
 * A row with no children: a treeitem with no disclosure and no
 * `aria-expanded`.
 */
const TreeChildItemRow = React.forwardRef<
  HTMLDivElement,
  TreeChildItemRowProps
>((props, ref) => (
  <TreeItemRow ref={ref} {...props} hasChildren={false} expanded={false} />
));
TreeChildItemRow.displayName = "TreeChildItemRow";

/**
 * A section's heading (GAP-151): its name in the theme's colour, with a
 * count, over the items it heads. It is for the eye, and hidden from a
 * screen reader: put the section's items in a `<div role="group">` named by
 * `aria-label`, as Tree does from `data`.
 */
const TreeSectionRow = React.forwardRef<HTMLDivElement, TreeSectionRowProps>(
  (
    {
      className,
      count,
      density = "default",
      depth = 0,
      indent = 20,
      name,
      style,
      ...props
    },
    ref,
  ) => {
    const shownCount = useTreeCount(count);
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-tree-section=""
        className={cn(
          "flex w-full items-center gap-1.5 px-2 text-[11px] font-medium leading-[14px] text-primary",
          density === "compact" ? "min-h-6" : "min-h-8",
          className,
        )}
        style={{ paddingInlineStart: depth * indent + 8, ...style }}
        {...props}
      >
        <span className="min-w-0 truncate">{name}</span>
        {count !== undefined && count !== null && (
          <span className={countPillClass}>{shownCount}</span>
        )}
      </div>
    );
  },
);
TreeSectionRow.displayName = "TreeSectionRow";

/**
 * The rows drawn, in order: every root, the children of each open row, and
 * every section's items, at the section's own depth. Each row's set is the
 * rows beside it, apart from sections, or a section's items.
 */
const flattenTreeItems = (
  items: TreeItem[],
  expandedSet: Set<string>,
  depth = 0,
  parentId?: string,
  sectionId?: string,
  out: VisibleTreeItem[] = [],
): VisibleTreeItem[] => {
  const setSize = items.reduce(
    (size, item) => (item.section ? size : size + 1),
    0,
  );
  let posInSet = 0;
  for (const item of items) {
    if (item.section) {
      out.push({
        item,
        depth,
        parentId,
        sectionId,
        section: true,
        posInSet: 0,
        setSize: 0,
      });
      if (item.children?.length)
        flattenTreeItems(
          item.children,
          expandedSet,
          depth,
          parentId,
          item.id,
          out,
        );
      continue;
    }
    posInSet += 1;
    out.push({
      item,
      depth,
      parentId,
      sectionId,
      section: false,
      posInSet,
      setSize,
    });
    if (item.children?.length && expandedSet.has(item.id))
      flattenTreeItems(
        item.children,
        expandedSet,
        depth + 1,
        item.id,
        sectionId,
        out,
      );
  }
  return out;
};

/** The item with `id`, anywhere in `items`. */
const findTreeItem = (items: TreeItem[], id: string): TreeItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    const found = item.children ? findTreeItem(item.children, id) : undefined;
    if (found) return found;
  }
  return undefined;
};

/** Every id under `item`, open or not. */
const collectDescendantIds = (item: TreeItem, into: Set<string>) => {
  for (const child of item.children ?? []) {
    into.add(child.id);
    collectDescendantIds(child, into);
  }
};

const findFirstEnabledTreeItemId = (items: TreeItem[]): string | undefined => {
  for (const item of items) {
    // A section is never a row: its items are, at its own place.
    if (item.section) {
      const id = item.children
        ? findFirstEnabledTreeItemId(item.children)
        : undefined;
      if (id) return id;
      continue;
    }
    if (!item.disabled) return item.id;
    const childId = item.children
      ? findFirstEnabledTreeItemId(item.children)
      : undefined;
    if (childId) return childId;
  }
  return undefined;
};

const resolveTreeSlot = (
  slot: TreeItemSlot | undefined,
  context: TreeItemRenderContext,
): React.ReactNode | undefined => {
  if (slot === undefined) return undefined;
  return typeof slot === "function" ? slot(context) : slot;
};

export {
  Tree,
  TreeChildItemRow,
  TreeItemRow,
  TreeParentItemRow,
  TreeSectionRow,
};
export type { TreeChildItemRowProps, TreeParentItemRowProps };
