---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Table's row selection, sortable headers and numeric alignment, SplitButton's menu items and a virtualised Grid (decision 209).

- **Table selects rows (GAP-171):** `selectable` with `selectedIds`, `defaultSelectedIds` and `onSelectedIdsChange`; a `TableRow`'s `rowId`; `TableRowSelect`, a row's checkbox, and `TableSelectAll`, the header's, mixed while some rows are selected. A selected row draws `data-state="selected"`, and a polite status says how many are selected, in `selectionAnnouncement`'s words.
- **Table's headers sort and its numbers line up (GAP-037):** `TableHead`'s `onSort` and `sortDirection` make its words a button with an arrow and say the order as `aria-sort`; `numeric` on `TableHead` and `TableCell` aligns to the end in tabular figures. `TableSortDirection`, `TableHeadProps` and `TableCellProps` are exported.
- **SplitButton's menu takes Menu's items (GAP-168):** each of `menuItems` may have an `icon` or be `disabled`, `{ type: "separator" }` draws a line, and `menuContent` draws Menu's own parts after them. A disabled item no longer runs its `onClick`. `SplitButtonProps`, `SplitButtonMenuItem`, `SplitButtonMenuAction` and `SplitButtonMenuSeparator` are exported.
- **Grid virtualises (GAP-172):** `virtualized` with `itemCount`, `rowHeight`, `renderItem`, `cols` or `minColumnWidth`, `overscan` and `onRangeChange` draws only the rows in view, in reading order, each item said as its place in the whole list, and hands focus to the Grid when a focused item scrolls away.
