import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Tree, type TreeItem } from "../src/components/Tree/Tree";

const data: TreeItem[] = [
  {
    id: "building",
    name: "Terminal 2, a building whose name runs long enough to wrap",
    children: [
      {
        id: "level",
        name: "Level 1",
        children: Array.from({ length: 12 }, (_, index) => ({
          id: `poi-${index + 1}`,
          name: `Gate ${index + 1}`,
        })),
      },
    ],
  },
  { id: "parking", name: "Parking" },
];

/**
 * GAP-201's suspected overflow: a divided tree with a bleed, not
 * virtualized, in Map Content's panel (16 of inline padding, the bleed's
 * 16), in each place a product puts it: a panel that scrolls, a panel that
 * does not, and a tree made to scroll by the product's own class.
 */
export function TreeBleedFixture({
  panelScrolls = false,
  treeScrolls = false,
  dir = "ltr",
}: {
  panelScrolls?: boolean;
  treeScrolls?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <ThemeProvider theme="light">
      <div dir={dir}>
        <div
          data-panel=""
          style={{
            width: 300,
            paddingInline: 16,
            height: panelScrolls ? 240 : undefined,
            overflowY: panelScrolls ? "auto" : undefined,
          }}
        >
          <Tree
            ariaLabel="Map content"
            data={data}
            defaultExpandedIds={["building", "level"]}
            divided
            bleed={16}
            style={treeScrolls ? { height: 240, overflowY: "auto" } : undefined}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
