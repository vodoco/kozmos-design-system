import { useState } from "react";
import { Box, Icon, Text, Tree, type TreeItem } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const venue: TreeItem[] = [
  {
    id: "riverside",
    name: "Riverside Centre",
    children: [
      {
        id: "2",
        name: "Second floor",
        children: [
          { id: "hall", name: "Community hall" },
          { id: "offices", name: "Co-working offices" },
        ],
      },
      {
        id: "1",
        name: "First floor",
        children: [
          { id: "bookshop", name: "Bookshop" },
          { id: "lost", name: "Lost property" },
        ],
      },
      {
        id: "g",
        name: "Ground floor",
        children: [{ id: "info", name: "Information desk" }],
      },
    ],
  },
  {
    id: "harbour",
    name: "Harbour Terminal",
    children: [{ id: "gates", name: "Gates" }],
    disabled: true,
  },
];

function Floors() {
  const [selected, setSelected] = useState<string>();
  return (
    <Box className="site-demo-column">
      <Tree
        ariaLabel="Venues"
        data={venue}
        defaultExpandedIds={["riverside", "1"]}
        onSelectionChange={(item) =>
          setSelected(typeof item.name === "string" ? item.name : item.id)
        }
        renderIcon={({ hasChildren }) => (
          <Icon
            name={hasChildren ? "building-01" : "marker-pin-01"}
            size="sm"
          />
        )}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {selected
          ? `Selected: ${selected}`
          : "Select a row; arrow keys move and expand."}
      </Text>
    </Box>
  );
}

function Compact() {
  return (
    <Box className="site-demo-column">
      <Tree
        ariaLabel="Venues, compact"
        data={venue}
        density="compact"
        defaultExpandedIds={["riverside"]}
        activationMode="toggle"
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A venue’s floors and places",
    description:
      "data is nested items; expansion and selection can be controlled or left to the tree. renderIcon, renderMeta and renderActions decorate rows.",
    Component: Floors,
  },
  { title: "Compact, toggling on activation", Component: Compact },
];
