import figma from "@figma/code-connect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowSelect,
  TableSelectAll,
} from "./Table";

const tableUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=237-2547";

// The header's TableSelectAll and each row's TableRowSelect are drawn only by
// mappings, which Code Connect does not collect imports from: they are listed
// here.
figma.connect(Table, tableUrl, {
  imports: [
    "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowSelect, TableSelectAll } from '@kozmos-ds/react';",
  ],
  props: {
    // Table has no density prop: Compact is the shorter rows' classes, mapped
    // straight to className, as Code Connect substitutes a property only where
    // the example uses it.
    density: figma.enum("Density", {
      Default: undefined,
      Compact: "[&_td]:py-2 [&_th]:h-10",
    }),
    header1: figma.string("Header 1 Text"),
    header2: figma.string("Header 2 Text"),
    header3: figma.string("Header 3 Text"),
    row1Cell1: figma.string("Row 1 Cell 1 Text"),
    row1Cell2: figma.string("Row 1 Cell 2 Text"),
    row1Cell3: figma.string("Row 1 Cell 3 Text"),
    row2Cell1: figma.string("Row 2 Cell 1 Text"),
    row2Cell2: figma.string("Row 2 Cell 2 Text"),
    row2Cell3: figma.string("Row 2 Cell 3 Text"),
    row3Cell1: figma.string("Row 3 Cell 1 Text"),
    row3Cell2: figma.string("Row 3 Cell 2 Text"),
    row3Cell3: figma.string("Row 3 Cell 3 Text"),
    // GAP-171: Selectable is a selectable Table, the header's TableSelectAll
    // and each row's TableRowSelect, the last row selected as Figma draws it.
    selectable: figma.boolean("Selectable"),
    defaultSelectedIds: figma.boolean("Selectable", {
      true: ["row-3"],
      false: undefined,
    }),
    selectAll: figma.boolean("Selectable", {
      true: (
        <TableHead>
          <TableSelectAll />
        </TableHead>
      ),
      false: undefined,
    }),
    row1Id: figma.boolean("Selectable", { true: "row-1", false: undefined }),
    row2Id: figma.boolean("Selectable", { true: "row-2", false: undefined }),
    row3Id: figma.boolean("Selectable", { true: "row-3", false: undefined }),
    row1Select: figma.boolean("Selectable", {
      true: (
        <TableCell>
          <TableRowSelect label="Select row 1" />
        </TableCell>
      ),
      false: undefined,
    }),
    row2Select: figma.boolean("Selectable", {
      true: (
        <TableCell>
          <TableRowSelect label="Select row 2" />
        </TableCell>
      ),
      false: undefined,
    }),
    row3Select: figma.boolean("Selectable", {
      true: (
        <TableCell>
          <TableRowSelect label="Select row 3" />
        </TableCell>
      ),
      false: undefined,
    }),
    // Sortable is Header 1 sorted ascending: TableHead's onSort and
    // sortDirection. Sorting the rows is the product's.
    sortDirection: figma.boolean("Sortable", {
      true: "ascending",
      false: undefined,
    }),
    onSort: figma.boolean("Sortable", { true: () => {}, false: undefined }),
    // GAP-037: Numeric Column is a fourth column aligned to the end,
    // TableHead's and TableCell's `numeric`, with the set's sample values.
    numericHead: figma.boolean("Numeric Column", {
      true: <TableHead numeric>POIs</TableHead>,
      false: undefined,
    }),
    numericCell1: figma.boolean("Numeric Column", {
      true: <TableCell numeric>1,204</TableCell>,
      false: undefined,
    }),
    numericCell2: figma.boolean("Numeric Column", {
      true: <TableCell numeric>86</TableCell>,
      false: undefined,
    }),
    numericCell3: figma.boolean("Numeric Column", {
      true: <TableCell numeric>3</TableCell>,
      false: undefined,
    }),
  },
  example: ({
    density,
    header1,
    header2,
    header3,
    row1Cell1,
    row1Cell2,
    row1Cell3,
    row2Cell1,
    row2Cell2,
    row2Cell3,
    row3Cell1,
    row3Cell2,
    row3Cell3,
    selectable,
    defaultSelectedIds,
    selectAll,
    row1Id,
    row2Id,
    row3Id,
    row1Select,
    row2Select,
    row3Select,
    sortDirection,
    onSort,
    numericHead,
    numericCell1,
    numericCell2,
    numericCell3,
  }) => {
    // Figma draws the table framed (decision 159), as React's `framed` does.
    return (
      <Table
        framed
        className={density}
        selectable={selectable}
        defaultSelectedIds={defaultSelectedIds}
      >
        <TableHeader>
          <TableRow>
            {selectAll}
            <TableHead onSort={onSort} sortDirection={sortDirection}>
              {header1}
            </TableHead>
            <TableHead>{header2}</TableHead>
            <TableHead>{header3}</TableHead>
            {numericHead}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow rowId={row1Id}>
            {row1Select}
            <TableCell>{row1Cell1}</TableCell>
            <TableCell>{row1Cell2}</TableCell>
            <TableCell>{row1Cell3}</TableCell>
            {numericCell1}
          </TableRow>
          <TableRow rowId={row2Id}>
            {row2Select}
            <TableCell>{row2Cell1}</TableCell>
            <TableCell>{row2Cell2}</TableCell>
            <TableCell>{row2Cell3}</TableCell>
            {numericCell2}
          </TableRow>
          <TableRow rowId={row3Id}>
            {row3Select}
            <TableCell>{row3Cell1}</TableCell>
            <TableCell>{row3Cell2}</TableCell>
            <TableCell>{row3Cell3}</TableCell>
            {numericCell3}
          </TableRow>
        </TableBody>
      </Table>
    );
  },
});
