import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Tree, type TreeItem } from "../src/components/Tree/Tree";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../src/components/Table/Table";
import { Listbox } from "../src/components/Listbox/Listbox";
import {
  DescriptionList,
  DescriptionListItem,
} from "../src/components/DescriptionList/DescriptionList";
import { IconButton } from "../src/components/IconButton/IconButton";

const buildings: TreeItem[] = [
  { id: "a", name: "Building A" },
  { id: "b", name: "Building B" },
];

// GAP-217: a band tree in a panel with 16 of inline padding.
export function TreeBandFixture({
  rowFill,
  divided,
}: {
  rowFill?: "inset" | "band";
  divided?: boolean;
}) {
  return (
    <ThemeProvider theme="light">
      <div data-panel="" style={{ width: 320, paddingInline: 16 }}>
        <Tree
          ariaLabel="Buildings"
          data={buildings}
          rowFill={rowFill}
          divided={divided}
          bleed={16}
          defaultSelectedId="a"
        />
      </div>
    </ThemeProvider>
  );
}

// GAP-276: a row just added.
export function TableHighlightFixture({ motion }: { motion?: "reduced" }) {
  return (
    <ThemeProvider theme="light">
      <div data-kozmos-motion={motion}>
        <Table>
          <TableBody>
            <TableRow highlight="new" aria-label="Ada">
              <TableCell>Ada</TableCell>
            </TableRow>
            <TableRow aria-label="Grace">
              <TableCell>Grace</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ThemeProvider>
  );
}

// GAP-271: Switch client's list, in a box of the page's own.
export function ListboxEmbeddedFixture({ embedded }: { embedded?: boolean }) {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 320, padding: 24 }}>
        <Listbox
          aria-label="Clients"
          embedded={embedded}
          options={[
            { value: "acme", label: "Acme" },
            { value: "globex", label: "Globex" },
          ]}
        />
      </div>
    </ThemeProvider>
  );
}

// GAP-221: MAP-619's Read-Only unit.
export function DescriptionListFixture({
  layout,
}: {
  layout?: "stack" | "row";
}) {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 640 }}>
        <DescriptionList layout={layout} aria-label="Unit">
          <DescriptionListItem label="Name" value="Gate A12" />
          <DescriptionListItem label="Featured" value={true} />
          <DescriptionListItem
            label="FID"
            value="f-1209"
            action={<IconButton aria-label="Copy FID" size="sm" />}
          />
        </DescriptionList>
      </div>
    </ThemeProvider>
  );
}
