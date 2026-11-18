import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Tree, type TreeItem } from "../src/components/Tree/Tree";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/Table/Table";

const places: TreeItem[] = [
  { id: "lobby", name: "Lobby" },
  { id: "cafe", name: "Cafe" },
  { id: "gate", name: "Gate" },
];

// Decision 207 (GAP-250): a divided Tree skips the divider under a selected
// row, Cafe here, in either fill, light or dark.
export function DividedTreeFixture({
  theme,
  rowFill,
}: {
  theme: "light" | "dark";
  rowFill?: "inset" | "band";
}) {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ width: 320, paddingInline: 16 }}>
        <Tree
          ariaLabel="Places"
          data={places}
          divided
          bleed={16}
          rowFill={rowFill}
          defaultSelectedId="cafe"
        />
      </div>
    </ThemeProvider>
  );
}

// And a Table: no divider under its selected row, Cafe.
export function SelectedTableFixture({ theme }: { theme: "light" | "dark" }) {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ width: 360 }}>
        <Table framed>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {["Lobby", "Cafe", "Gate"].map((name) => (
              <TableRow
                key={name}
                aria-label={name}
                data-state={name === "Cafe" ? "selected" : undefined}
              >
                <TableCell>{name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ThemeProvider>
  );
}
