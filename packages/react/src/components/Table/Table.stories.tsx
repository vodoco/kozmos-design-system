import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowSelect,
  TableSelectAll,
  type TableSortDirection,
} from "./Table";

const meta: Meta<typeof Table> = {
  id: "data-display-table",
  title: "Core/Data display/Table",
  component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell className="text-right">$80.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

/**
 * Decision 159: a 1px border and the control radius, 16, round the table, as
 * Figma, SwiftUI and Compose draw it. The header and rows are clipped inside
 * the frame, and the caption sits inside it, at its foot. Off by default.
 */
export const Framed: Story = {
  args: { framed: true },
  render: (args) => (
    <Table {...args}>
      <TableCaption>Places in this venue</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Floor</TableHead>
          <TableHead className="text-right">Visitors</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Reception</TableCell>
          <TableCell>Ground</TableCell>
          <TableCell className="text-right">412</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell className="font-medium">Library</TableCell>
          <TableCell>First</TableCell>
          <TableCell className="text-right">87</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Roof garden</TableCell>
          <TableCell>Fifth</TableCell>
          <TableCell className="text-right">35</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

const users = [
  { id: "ada", name: "Ada Lovelace", role: "Admin" },
  { id: "grace", name: "Grace Hopper", role: "Editor" },
  { id: "katherine", name: "Katherine Johnson", role: "Viewer" },
];

/**
 * GAP-171 (decision 209): User Management's rows, selected by pointer or by
 * Space on each row's checkbox. The header's box selects them all and is
 * mixed while some are; a status says how many are selected.
 */
export const Selectable: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(["grace"]);
    return (
      <Table
        framed
        selectable
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
      >
        <TableHeader>
          <TableRow>
            <TableHead>
              <TableSelectAll />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} rowId={user.id}>
              <TableCell>
                <TableRowSelect label={`Select ${user.name}`} />
              </TableCell>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

const floors = [
  { name: "Ground", pois: 1204, share: "48.2%" },
  { name: "First", pois: 86, share: "3.4%" },
  { name: "Roof", pois: 3, share: "0.1%" },
];

/**
 * GAP-037 (decision 209): a header that sorts, and numbers aligned to the
 * end in tabular figures, so counts and percentages line up.
 */
export const SortableNumeric: Story = {
  render: () => {
    const [direction, setDirection] =
      React.useState<TableSortDirection>("descending");
    const sorted = [...floors].sort((a, b) =>
      direction === "ascending" ? a.pois - b.pois : b.pois - a.pois,
    );
    return (
      <Table framed>
        <TableHeader>
          <TableRow>
            <TableHead>Floor</TableHead>
            <TableHead
              numeric
              sortDirection={direction}
              onSort={() =>
                setDirection(
                  direction === "ascending" ? "descending" : "ascending",
                )
              }
            >
              POIs
            </TableHead>
            <TableHead numeric>Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((floor) => (
            <TableRow key={floor.name}>
              <TableCell className="font-medium">{floor.name}</TableCell>
              <TableCell numeric>
                {floor.pois.toLocaleString("en-US")}
              </TableCell>
              <TableCell numeric>{floor.share}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};
