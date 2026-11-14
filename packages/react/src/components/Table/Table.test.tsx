import { render, screen } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";
import { describe, it, expect } from "vitest";

describe("Table", () => {
  it("renders correctly", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });
  // Decision 159: `framed` draws a border and the control radius round the
  // scroller, which clips the header and rows; off, nothing changes.
  const framedTable = (framed?: boolean) =>
    render(
      <Table framed={framed}>
        <TableCaption>Places</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Reception</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

  it("framed draws a border and the control radius round the scroller, which clips the rows", () => {
    framedTable(true);
    const table = screen.getByRole("table");
    const frame = table.parentElement as HTMLElement;
    expect(frame).toHaveClass(
      "rounded-control",
      "border",
      "border-border",
      "overflow-auto",
    );
    // The caption sits inside the frame, so it keeps a gap above the border.
    expect(table).toHaveClass("[&>caption]:mb-4");
    expect(table).not.toHaveAttribute("framed");
  });

  it("is not framed by default, so existing tables do not change", () => {
    framedTable();
    const table = screen.getByRole("table");
    const frame = table.parentElement as HTMLElement;
    expect(frame).not.toHaveClass("rounded-control");
    expect(frame).not.toHaveClass("border");
    expect(table).not.toHaveClass("[&>caption]:mb-4");
  });
});
