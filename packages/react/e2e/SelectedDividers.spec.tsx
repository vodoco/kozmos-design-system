import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DividedTreeFixture,
  SelectedTableFixture,
} from "./SelectedDividers.fixture";

// Decision 207 (GAP-250): since decision 173 a selected row draws the hover
// fill, which in dark is the divider's own colour, so the divider under it
// could not be seen. A divided Tree or a Table now skips the divider under a
// selected row: its 1px stays, drawn in no colour, so no row moves when the
// selection does. The rows that are not selected keep theirs.
const isClear = (colour: string) =>
  colour === "transparent" ||
  /rgba\(0, 0, 0, 0\)/.test(colour) ||
  /\/ 0\)$/.test(colour);

for (const theme of ["light", "dark"] as const) {
  for (const rowFill of ["inset", "band"] as const) {
    test(`${theme}, ${rowFill}: a divided Tree draws no divider under its selected row`, async ({
      mount,
    }) => {
      const component = await mount(
        <DividedTreeFixture theme={theme} rowFill={rowFill} />,
      );
      const rows = await component.evaluate((host) =>
        [...host.querySelectorAll("[data-tree-divider]")].map((box) => {
          const s = getComputedStyle(box);
          return {
            name: box.textContent,
            selected:
              box
                .querySelector('[role="treeitem"]')
                ?.getAttribute("aria-selected") === "true",
            width: s.borderBottomWidth,
            style: s.borderBottomStyle,
            colour: s.borderBottomColor,
            height: box.getBoundingClientRect().height,
          };
        }),
      );
      expect(rows.map((row) => row.name)).toEqual(["Lobby", "Cafe", "Gate"]);
      expect(rows.map((row) => row.selected)).toEqual([false, true, false]);
      for (const row of rows) {
        // Every row keeps its 1px, so the rows stay where they were.
        expect(row.width, row.name!).toBe("1px");
        expect(row.height, row.name!).toBe(rows[0].height);
        if (row.selected)
          expect(isClear(row.colour), `${row.name}: ${row.colour}`).toBe(true);
        else {
          expect(row.style, row.name!).toBe("solid");
          expect(isClear(row.colour), `${row.name}: ${row.colour}`).toBe(false);
        }
      }
    });
  }

  test(`${theme}: a Table draws no divider under its selected row`, async ({
    mount,
  }) => {
    const component = await mount(<SelectedTableFixture theme={theme} />);
    const rows = await component.evaluate((host) =>
      [...host.querySelectorAll("tbody tr")].map((row) => {
        const s = getComputedStyle(row);
        return {
          name: row.getAttribute("aria-label"),
          selected: row.getAttribute("data-state") === "selected",
          width: s.borderBottomWidth,
          colour: s.borderBottomColor,
          height: row.getBoundingClientRect().height,
        };
      }),
    );
    expect(rows.map((row) => row.selected)).toEqual([false, true, false]);
    // Lobby's divider shows; Cafe's, the selected row's, does not. Gate is
    // the last row, which draws none, as before.
    expect(rows[0].width).toBe("1px");
    expect(isClear(rows[0].colour), rows[0].colour).toBe(false);
    expect(rows[1].width).toBe("1px");
    expect(isClear(rows[1].colour), rows[1].colour).toBe(true);
    expect(rows[1].height).toBe(rows[0].height);
  });
}
