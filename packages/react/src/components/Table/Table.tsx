import React from "react";
import { ArrowDown, ArrowUp, SwitchVertical01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { scrollHorizontalWithKeyboard } from "../../utils/keyboard-scroll";
import { Checkbox } from "../Checkbox/Checkbox";

/**
 * What a selectable table says, in a polite status, when its selection
 * changes (GAP-171): `count` rows selected of the `total` rows it draws.
 */
export type TableSelectionAnnouncement = (
  count: number,
  total: number,
) => string;

const defaultSelectionAnnouncement: TableSelectionAnnouncement = (count) =>
  count === 0
    ? "No rows selected"
    : count === 1
      ? "1 row selected"
      : `${count} rows selected`;

interface TableSelectionValue {
  /** The selected ids, the table's rows' and any it no longer draws. */
  selected: readonly string[];
  /** The ids of the rows the table draws, in the order they mounted. */
  rowIds: readonly string[];
  register: (id: string) => () => void;
  setRowSelected: (id: string, selected: boolean) => void;
  setAllSelected: (selected: boolean) => void;
}

/** A selectable Table's selection, for its rows and checkboxes. */
const TableSelectionContext = React.createContext<TableSelectionValue | null>(
  null,
);
/** The `rowId` of the row a TableRowSelect is drawn in. */
const TableRowIdContext = React.createContext<string | undefined>(undefined);

// A layout effect in the browser, an effect on a server render.
const useTableLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * A 1px border round the table and the control radius, 16, at its corners
   * (decision 159), as Figma, SwiftUI and Compose draw it. The header and the
   * rows are clipped inside it, so a row's hover and selected fills keep its
   * corners, and a caption sits inside the frame, at its foot. Off by
   * default: a dense page's table runs edge to edge.
   */
  framed?: boolean;
  /**
   * Rows can be selected (GAP-171): each `TableRow` with a `rowId` is a
   * row of the selection, a `TableRowSelect` in it selects it, and a
   * `TableSelectAll` in the header selects them all, mixed while some are.
   * A selected row draws `data-state="selected"`, and a polite status says
   * how many are selected (`selectionAnnouncement`).
   */
  selectable?: boolean;
  /** The selected rows' `rowId`s, controlled. */
  selectedIds?: string[];
  /** The rows selected at first, uncontrolled. */
  defaultSelectedIds?: string[];
  /**
   * Every change to the selection, as the selected ids: a row's in the
   * order it was selected, and selecting all adds the rows not yet
   * selected after those that are. Ids of rows the table no longer draws
   * are kept, so a paged table keeps another page's selection.
   */
  onSelectedIdsChange?: (ids: string[]) => void;
  /**
   * What the status says when the selection changes: "No rows selected",
   * "1 row selected" and "3 rows selected" by default. A product that
   * translates passes its own, given the count and the rows drawn.
   */
  selectionAnnouncement?: TableSelectionAnnouncement;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      framed = false,
      selectable = false,
      selectedIds,
      defaultSelectedIds,
      onSelectedIdsChange,
      selectionAnnouncement = defaultSelectionAnnouncement,
      ...props
    },
    ref,
  ) => {
    const [ownSelected, setOwnSelected] = React.useState<string[]>(
      () => defaultSelectedIds ?? [],
    );
    const selected = selectedIds ?? ownSelected;
    const [rowIds, setRowIds] = React.useState<string[]>([]);
    // The latest selection and callback, for handlers made once.
    const latest = React.useRef({ selected, rowIds, onSelectedIdsChange });
    latest.current = { selected, rowIds, onSelectedIdsChange };
    const controlled = selectedIds !== undefined;

    const commit = React.useCallback(
      (next: string[]) => {
        if (!controlled) setOwnSelected(next);
        latest.current.onSelectedIdsChange?.(next);
      },
      [controlled],
    );
    const register = React.useCallback((id: string) => {
      setRowIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
      return () => setRowIds((ids) => ids.filter((other) => other !== id));
    }, []);
    const setRowSelected = React.useCallback(
      (id: string, on: boolean) => {
        const current = latest.current.selected;
        if (on === current.includes(id)) return;
        commit(on ? [...current, id] : current.filter((other) => other !== id));
      },
      [commit],
    );
    const setAllSelected = React.useCallback(
      (on: boolean) => {
        const { selected: current, rowIds: rows } = latest.current;
        commit(
          on
            ? [...current, ...rows.filter((id) => !current.includes(id))]
            : current.filter((id) => !rows.includes(id)),
        );
      },
      [commit],
    );
    const selection = React.useMemo<TableSelectionValue | null>(
      () =>
        selectable
          ? { selected, rowIds, register, setRowSelected, setAllSelected }
          : null,
      [selectable, selected, rowIds, register, setRowSelected, setAllSelected],
    );

    return (
      <div
        tabIndex={0}
        onKeyDown={scrollHorizontalWithKeyboard}
        className={cn(
          "relative w-full overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          framed && "rounded-control border border-border",
        )}
      >
        <TableSelectionContext.Provider value={selection}>
          <table
            ref={ref}
            className={cn(
              "w-full caption-bottom text-sm",
              framed && "[&>caption]:mb-4",
              className,
            )}
            {...props}
          />
        </TableSelectionContext.Provider>
        {selectable && (
          <span role="status" aria-live="polite" className="sr-only">
            {selectionAnnouncement(selected.length, rowIds.length)}
          </span>
        )}
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/**
 * A row's passing highlight (GAP-276): `"new"`, a row just added, drawn on
 * the informative surface that holds, then fades.
 */
export type TableRowHighlight = "new";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * `"new"` tints a row just added in the informative surface
   * (`--semantics-emotion-informative-surface`) so the eye finds it, then
   * fades it (GAP-276): held three deliberate durations, faded over one
   * (`--semantics-motion-duration-deliberate`, 1.84 s in all). Under reduced
   * motion, the system's or the design config's, the tint shows and clears
   * at the same time with no fade. It plays once, when the row is drawn
   * with it or is given it; give it again, after taking it away, to play it
   * again.
   */
  highlight?: TableRowHighlight;
  /**
   * The row's id in a `selectable` Table's selection (GAP-171): a row with
   * one is counted by `TableSelectAll`, selected by the `TableRowSelect` in
   * it, and draws `data-state="selected"` while it is selected. A header
   * row has none.
   */
  rowId?: string;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, highlight, rowId, ...props }, ref) => {
    const selection = React.useContext(TableSelectionContext);
    const register = selection?.register;
    useTableLayoutEffect(() => {
      if (register && rowId !== undefined) return register(rowId);
    }, [register, rowId]);
    const selectionState =
      selection && rowId !== undefined
        ? {
            "data-state": selection.selected.includes(rowId)
              ? "selected"
              : undefined,
          }
        : {};
    return (
      <TableRowIdContext.Provider value={rowId}>
        <tr
          ref={ref}
          data-highlight={highlight}
          className={cn(
            // Decision 207 (GAP-250): no divider under a selected row, whose
            // fill is the divider's own colour in dark; its 1px stays, clear.
            "border-b transition-colors hover:bg-hover-fill/50 data-[state=selected]:border-b-transparent data-[state=selected]:bg-hover-fill",
            highlight && "kozmos-table-row-highlight",
            className,
          )}
          {...props}
          {...selectionState}
        />
      </TableRowIdContext.Provider>
    );
  },
);
TableRow.displayName = "TableRow";

/** A sortable header's order (GAP-037), as `aria-sort` says it. */
export type TableSortDirection = "ascending" | "descending" | "none";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * The column holds numbers (GAP-037): the header and its cells align to
   * the end and draw tabular figures, so counts and percentages line up.
   * Give the column's `TableCell`s `numeric` too.
   */
  numeric?: boolean;
  /**
   * The header sorts its column (GAP-037): its words become a button that
   * runs this, with an arrow for `sortDirection`. Sorting the rows is the
   * caller's.
   */
  onSort?: () => void;
  /**
   * How the column is sorted, said on the header as `aria-sort` and drawn
   * as an arrow: up ascending, down descending, and both ways while it is
   * sortable but not sorted (`"none"`, the default with `onSort`).
   */
  sortDirection?: TableSortDirection;
}

const sortIcons = {
  ascending: ArrowUp,
  descending: ArrowDown,
  none: SwitchVertical01,
} as const;

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    { className, numeric = false, onSort, sortDirection, children, ...props },
    ref,
  ) => {
    const sortable = onSort !== undefined;
    const direction = sortDirection ?? "none";
    const SortIcon = sortIcons[direction];
    return (
      <th
        ref={ref}
        aria-sort={sortable ? direction : undefined}
        className={cn(
          "h-12 px-4 text-left align-middle text-xs font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          numeric && "text-end tabular-nums",
          className,
        )}
        {...props}
      >
        {sortable ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              "-mx-2 inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-medium hover:bg-hover-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              numeric && "flex-row-reverse",
              direction !== "none" && "text-foreground",
            )}
          >
            {children}
            <SortIcon
              aria-hidden="true"
              data-sort-icon={direction}
              className={cn(
                "h-4 w-4 shrink-0",
                direction === "none" && "opacity-60",
              )}
            />
          </button>
        ) : (
          children
        )}
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** A number (GAP-037): aligned to the end, in tabular figures. */
  numeric?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, numeric = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        numeric && "text-end tabular-nums",
        className,
      )}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

export interface TableSelectAllProps {
  /** Its name: "Select all rows" by default. */
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * The header's checkbox in a `selectable` Table (GAP-171): checked when
 * every row is selected, mixed when some are, and a click on it selects
 * them all, or, checked, clears them. Put it in a `TableHead`.
 */
const TableSelectAll = React.forwardRef<HTMLButtonElement, TableSelectAllProps>(
  ({ label = "Select all rows", className, disabled }, ref) => {
    const selection = React.useContext(TableSelectionContext);
    if (!selection) return null;
    const count = selection.rowIds.filter((id) =>
      selection.selected.includes(id),
    ).length;
    const checked =
      count === 0
        ? false
        : count === selection.rowIds.length
          ? true
          : ("indeterminate" as const);
    return (
      <Checkbox
        ref={ref}
        aria-label={label}
        checked={checked}
        disabled={disabled || selection.rowIds.length === 0}
        // A mixed box a click checks: Radix reports true, as decision 188's.
        onCheckedChange={(next) => selection.setAllSelected(next === true)}
        className={className}
        wrapperClassName="w-auto -my-3"
      />
    );
  },
);
TableSelectAll.displayName = "TableSelectAll";

export interface TableRowSelectProps {
  /**
   * Its name, which says the row: "Select Ada Lovelace". "Select row" by
   * default, which says nothing of which; pass the row's own words.
   */
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * A row's checkbox in a `selectable` Table (GAP-171), in a `TableCell` of a
 * `TableRow` with a `rowId`: it selects the row, by pointer and by Space.
 */
const TableRowSelect = React.forwardRef<HTMLButtonElement, TableRowSelectProps>(
  ({ label = "Select row", className, disabled }, ref) => {
    const selection = React.useContext(TableSelectionContext);
    const rowId = React.useContext(TableRowIdContext);
    if (!selection || rowId === undefined) return null;
    return (
      <Checkbox
        ref={ref}
        aria-label={label}
        checked={selection.selected.includes(rowId)}
        disabled={disabled}
        onCheckedChange={(next) =>
          selection.setRowSelected(rowId, next === true)
        }
        className={className}
        wrapperClassName="w-auto -my-3"
      />
    );
  },
);
TableRowSelect.displayName = "TableRowSelect";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSelectAll,
  TableRowSelect,
};
