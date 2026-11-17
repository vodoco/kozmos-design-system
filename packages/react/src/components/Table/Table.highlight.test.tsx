import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableBody, TableCell, TableRow } from "./Table";

// GAP-276 (decision 186): a row just added tints in the informative tone
// and fades; the look itself is owned CSS, measured in e2e/TableHighlight.
describe("TableRow highlight (GAP-276)", () => {
  it('takes highlight="new" as its data-highlight and the highlight class', () => {
    render(
      <Table>
        <TableBody>
          <TableRow highlight="new" aria-label="Ada">
            <TableCell>Ada</TableCell>
          </TableRow>
          <TableRow aria-label="Grace">
            <TableCell>Grace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const added = screen.getByRole("row", { name: "Ada" });
    expect(added).toHaveAttribute("data-highlight", "new");
    expect(added).toHaveClass("kozmos-table-row-highlight");
    const other = screen.getByRole("row", { name: "Grace" });
    expect(other).not.toHaveAttribute("data-highlight");
    expect(other).not.toHaveClass("kozmos-table-row-highlight");
  });
});
