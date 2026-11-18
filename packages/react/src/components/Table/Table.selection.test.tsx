import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

// GAP-171 (decision 209): Table's row selection. A selectable table holds
// which rows are selected, by each row's `rowId`; a row's checkbox selects
// it, by pointer and by keyboard; the header's checkbox selects every row
// and is mixed while some are; a selected row draws `data-state="selected"`;
// and a status says how many are selected.
const people = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "katherine", name: "Katherine Johnson" },
];

function Users(props: React.ComponentProps<typeof Table>) {
  return (
    <Table selectable aria-label="Users" {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>
            <TableSelectAll />
          </TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.id} rowId={person.id}>
            <TableCell>
              <TableRowSelect label={`Select ${person.name}`} />
            </TableCell>
            <TableCell>{person.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const box = (name: string) => screen.getByRole("checkbox", { name });
const row = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLTableRowElement;

describe("Table's row selection (GAP-171)", () => {
  it("selects a row by its checkbox, marks it selected and reports the ids", () => {
    const onSelectedIdsChange = vi.fn();
    render(<Users onSelectedIdsChange={onSelectedIdsChange} />);
    expect(row("Ada Lovelace")).not.toHaveAttribute("data-state");
    fireEvent.click(box("Select Ada Lovelace"));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["ada"]);
    expect(row("Ada Lovelace")).toHaveAttribute("data-state", "selected");
    expect(box("Select Ada Lovelace")).toHaveAttribute("aria-checked", "true");
    expect(row("Grace Hopper")).not.toHaveAttribute("data-state");
  });

  it("selects by keyboard: Space on a focused row checkbox", () => {
    render(<Users />);
    const checkbox = box("Select Grace Hopper");
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    // Radix's checkbox is a button: Space clicks it.
    fireEvent.keyDown(checkbox, { key: " " });
    fireEvent.keyUp(checkbox, { key: " " });
    fireEvent.click(checkbox);
    expect(row("Grace Hopper")).toHaveAttribute("data-state", "selected");
  });

  it("the header's checkbox is unchecked, mixed, then checked, and selects or clears every row", () => {
    const onSelectedIdsChange = vi.fn();
    render(<Users onSelectedIdsChange={onSelectedIdsChange} />);
    const all = box("Select all rows");
    expect(all).toHaveAttribute("aria-checked", "false");
    fireEvent.click(box("Select Ada Lovelace"));
    expect(all).toHaveAttribute("aria-checked", "mixed");
    // A click on a mixed header selects every row, as a mixed checkbox
    // checks.
    fireEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([
      "ada",
      "grace",
      "katherine",
    ]);
    expect(all).toHaveAttribute("aria-checked", "true");
    for (const person of people)
      expect(row(person.name)).toHaveAttribute("data-state", "selected");
    fireEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
    expect(all).toHaveAttribute("aria-checked", "false");
  });

  it("says how many rows are selected in a polite status, in the product's words", () => {
    const { rerender } = render(<Users />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveClass("sr-only");
    expect(status).toHaveTextContent("No rows selected");
    fireEvent.click(box("Select Ada Lovelace"));
    expect(status).toHaveTextContent("1 row selected");
    fireEvent.click(box("Select Grace Hopper"));
    expect(status).toHaveTextContent("2 rows selected");
    rerender(
      <Users
        selectionAnnouncement={(count, total) =>
          `${count} von ${total} ausgewählt`
        }
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("2 von 3 ausgewählt");
  });

  it("is controlled by selectedIds", () => {
    const onSelectedIdsChange = vi.fn();
    const { rerender } = render(
      <Users
        selectedIds={["katherine"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    expect(row("Katherine Johnson")).toHaveAttribute("data-state", "selected");
    fireEvent.click(box("Select Ada Lovelace"));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["katherine", "ada"]);
    // Controlled: nothing changes until the parent passes the new ids.
    expect(row("Ada Lovelace")).not.toHaveAttribute("data-state");
    rerender(
      <Users
        selectedIds={["katherine", "ada"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    expect(row("Ada Lovelace")).toHaveAttribute("data-state", "selected");
  });

  it("starts from defaultSelectedIds", () => {
    render(<Users defaultSelectedIds={["ada", "grace", "katherine"]} />);
    expect(box("Select all rows")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status")).toHaveTextContent("3 rows selected");
  });

  it("a row that leaves the table leaves the selection's total", () => {
    function Shrinking() {
      const [shown, setShown] = React.useState(people);
      return (
        <>
          <button onClick={() => setShown(people.slice(0, 1))}>Remove</button>
          <Table selectable defaultSelectedIds={["ada"]}>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <TableSelectAll label="Alle auswählen" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((person) => (
                <TableRow key={person.id} rowId={person.id}>
                  <TableCell>
                    <TableRowSelect label={person.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      );
    }
    render(<Shrinking />);
    expect(box("Alle auswählen")).toHaveAttribute("aria-checked", "mixed");
    act(() => {
      fireEvent.click(screen.getByText("Remove"));
    });
    expect(box("Alle auswählen")).toHaveAttribute("aria-checked", "true");
  });

  it("a table that is not selectable draws no status and no row state", () => {
    render(
      <Table>
        <TableBody>
          <TableRow rowId="ada">
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(row("Ada Lovelace")).not.toHaveAttribute("data-state");
  });
});
