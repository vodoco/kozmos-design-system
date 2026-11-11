import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Tree, type TreeItem } from "../src/components/Tree/Tree";

const data: TreeItem[] = [
  {
    id: "level",
    name: "Level 1",
    children: [
      {
        id: "poi",
        name: "POI",
        section: true,
        count: 300,
        children: Array.from({ length: 300 }, (_, index) => ({
          id: `poi-${index + 1}`,
          name: `POI ${index + 1}`,
        })),
      },
    ],
  },
];

// Map Content's panel: 16 of inline padding, the tree's strokes reaching the
// panel's edges through `bleed`, and only the rows in view drawn.
export function TreeVirtualizedFixture({ divided }: { divided: boolean }) {
  return (
    <ThemeProvider theme="light">
      <div data-panel="" style={{ width: 300, paddingInline: 16 }}>
        <Tree
          ariaLabel="Map content"
          data={data}
          defaultExpandedIds={["level"]}
          virtualized
          divided={divided}
          bleed={divided ? 16 : undefined}
          style={{ height: 300 }}
        />
      </div>
    </ThemeProvider>
  );
}
