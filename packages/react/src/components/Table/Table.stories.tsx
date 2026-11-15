import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
