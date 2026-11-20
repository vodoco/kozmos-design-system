import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

// GAP-037 (decision 209): Table's sortable headers and numeric alignment.
// A header given `onSort` is a button inside its cell that says its sort as
// `aria-sort` on the cell; `numeric` aligns a header and its cells to the
// end and draws tabular figures, so counts line up.
function Floors({
  sort,
  onSort,
}: {
  sort?: "ascending" | "descending" | "none";
  onSort?: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead sortDirection={sort} onSort={onSort}>
            Floor
          </TableHead>
          <TableHead numeric>POIs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ground</TableCell>
          <TableCell numeric>1,204</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table's sortable headers (GAP-037)", () => {
  it("a header with onSort is a button named by its words, and a click asks to sort", () => {
    const onSort = vi.fn();
    render(<Floors onSort={onSort} />);
    const button = screen.getByRole("button", { name: "Floor" });
    fireEvent.click(button);
    expect(onSort).toHaveBeenCalledTimes(1);
    // Enter and Space are a button's own: it is a real <button>.
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("says its sort on the header cell, none until it is sorted", () => {
    const { rerender } = render(<Floors onSort={() => {}} />);
    const cell = screen.getByRole("columnheader", { name: "Floor" });
    expect(cell).toHaveAttribute("aria-sort", "none");
    rerender(<Floors onSort={() => {}} sort="ascending" />);
    expect(cell).toHaveAttribute("aria-sort", "ascending");
    rerender(<Floors onSort={() => {}} sort="descending" />);
    expect(cell).toHaveAttribute("aria-sort", "descending");
  });

  it("draws an arrow for the direction, hidden from the name", () => {
    const { rerender } = render(<Floors onSort={() => {}} sort="ascending" />);
    const button = screen.getByRole("button", { name: "Floor" });
    const arrow = () => button.querySelector("svg");
    expect(arrow()).toHaveAttribute("aria-hidden", "true");
    expect(arrow()).toHaveAttribute("data-sort-icon", "ascending");
    rerender(<Floors onSort={() => {}} sort="descending" />);
    expect(arrow()).toHaveAttribute("data-sort-icon", "descending");
    rerender(<Floors onSort={() => {}} />);
    expect(arrow()).toHaveAttribute("data-sort-icon", "none");
  });

  it("a header without onSort is as before: words, no button, no aria-sort", () => {
    render(<Floors />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("columnheader", { name: "Floor" }),
    ).not.toHaveAttribute("aria-sort");
  });
});

describe("Table's numeric alignment (GAP-037)", () => {
  it("aligns a numeric header and cell to the end in tabular figures", () => {
    render(<Floors />);
    const head = screen.getByRole("columnheader", { name: "POIs" });
    const cell = screen.getByRole("cell", { name: "1,204" });
    for (const node of [head, cell]) {
      expect(node).toHaveClass("text-end", "tabular-nums");
      expect(node).not.toHaveClass("text-left");
    }
    expect(screen.getByRole("cell", { name: "Ground" })).not.toHaveClass(
      "text-end",
    );
  });
});
