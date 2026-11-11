import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import {
  EyeOff,
  Folder as FolderOpen,
  Lock01 as Lock,
  MarkerPin01 as MapPin,
  Pencil01 as Pencil,
} from "@kozmos-ds/icons";
import {
  Tree,
  TreeChildItemRow,
  TreeParentItemRow,
  type TreeItem,
} from "./Tree";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ContextMenu/ContextMenu";

const meta: Meta<typeof Tree> = {
  id: "data-display-tree",
  title: "Core/Data display/Tree",
  component: Tree,
};

export default meta;
type Story = StoryObj<typeof Tree>;

const sampleData: TreeItem[] = [
  {
    id: "1",
    name: "src",
    children: [
      {
        id: "2",
        name: "components",
        children: [
          { id: "3", name: "Button.tsx" },
          { id: "4", name: "Input.tsx" },
        ],
      },
      { id: "5", name: "App.tsx" },
      { id: "6", name: "index.tsx" },
    ],
  },
  {
    id: "7",
    name: "package.json",
  },
];

export const Default: Story = {
  render: () => <Tree data={sampleData} />,
};

const ActionButton = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <button
    type="button"
    aria-label={label}
    className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-hover-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    {children}
  </button>
);

const dashboardTree: TreeItem[] = [
  {
    id: "outdoor",
    name: "Outdoor map content",
    icon: <FolderOpen aria-hidden="true" className="h-4 w-4" />,
    count: 23,
    actions: (
      <>
        <ActionButton label="Hide Outdoor map content">
          <EyeOff aria-hidden="true" className="h-4 w-4" />
        </ActionButton>
        <ActionButton label="Lock Outdoor map content">
          <Lock aria-hidden="true" className="h-4 w-4" />
        </ActionButton>
      </>
    ),
    children: [
      {
        id: "terminal-c",
        name: "Terminal C",
        count: 281,
        children: [
          {
            id: "ground-floor",
            name: "Ground Floor (GF)",
            count: 4,
            children: [
              {
                id: "fast-food",
                name: "Fast Food",
                count: 4,
                children: [
                  {
                    id: "burger-king",
                    name: "Burger King",
                    icon: <MapPin aria-hidden="true" className="h-4 w-4" />,
                    actions: (
                      <ActionButton label="Edit Burger King">
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </ActionButton>
                    ),
                  },
                  {
                    id: "mcdonalds",
                    name: "McDonald's",
                    icon: <MapPin aria-hidden="true" className="h-4 w-4" />,
                    actions: (
                      <ActionButton label="Edit McDonald's">
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </ActionButton>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const WithRowActions: Story = {
  render: () => (
    <Tree
      ariaLabel="Map content"
      data={dashboardTree}
      defaultExpandedIds={[
        "outdoor",
        "terminal-c",
        "ground-floor",
        "fast-food",
      ]}
      activationMode="select"
    />
  ),
};

/**
 * A tree composed from rows: Tree with children is the `role="tree"`
 * container, each row is a treeitem whose `depth`, `expanded`, `selected`
 * and `disabled` give its level and state, and a parent's children sit in a
 * `role="group"` after it.
 */
export const Composed: Story = {
  render: () => (
    <Tree ariaLabel="Map content" className="w-80 max-w-full">
      <TreeParentItemRow
        name="Outdoor map content"
        count={23}
        expanded
        icon={<FolderOpen aria-hidden="true" className="h-4 w-4" />}
      />
      <div role="group">
        <TreeParentItemRow
          name="Terminal C"
          count={2}
          depth={1}
          expanded
          icon={<FolderOpen aria-hidden="true" className="h-4 w-4" />}
        />
        <div role="group">
          <TreeChildItemRow
            name="Burger King"
            depth={2}
            selected
            icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
          />
          <TreeChildItemRow
            name="McDonald's"
            depth={2}
            icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
          />
        </div>
        <TreeParentItemRow
          name="Terminal D"
          count={14}
          depth={1}
          icon={<FolderOpen aria-hidden="true" className="h-4 w-4" />}
        />
      </div>
      <TreeChildItemRow
        name="Archived content"
        disabled
        icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
      />
    </Tree>
  ),
};

export const RowPrimitive: Story = {
  render: () => (
    <Tree
      ariaLabel="Composed row primitive example"
      className="w-80"
      density="default"
    >
      <TreeParentItemRow
        name="Content group"
        count={164}
        expanded
        icon={<FolderOpen aria-hidden="true" className="h-4 w-4" />}
        actions={
          <>
            <ActionButton label="Hide Content group">
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            </ActionButton>
            <ActionButton label="Lock Content group">
              <Lock aria-hidden="true" className="h-4 w-4" />
            </ActionButton>
          </>
        }
      />
      <TreeChildItemRow
        name="Place item"
        count={4}
        depth={2}
        selected
        icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
        actions={
          <ActionButton label="Edit Place item">
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </ActionButton>
        }
      />
    </Tree>
  ),
};

// GAP-201: a list of records, as Pointr Cloud's Map Content tree draws its
// buildings and levels: a stroke under every row, an open building on a
// surface of its own.
const venueTree: TreeItem[] = [
  {
    id: "terminal-a",
    name: "Terminal A",
    count: 3,
    children: [
      { id: "terminal-a-1", name: "Level 1", count: 128 },
      { id: "terminal-a-2", name: "Level 2", count: 96 },
      { id: "terminal-a-3", name: "Level 3", count: 41 },
    ],
  },
  {
    id: "terminal-b",
    name: "Terminal B",
    count: 2,
    children: [
      { id: "terminal-b-1", name: "Level 1", count: 87 },
      { id: "terminal-b-2", name: "Level 2", count: 53 },
    ],
  },
  { id: "car-park", name: "Car park", count: 12 },
];

// In a panel whose content is 16 in, as a Container inset="panel" puts it:
// the strokes and the open building's surface reach the panel's edges.
export const Divided: Story = {
  render: () => (
    <div
      className="border bg-background"
      style={{ width: 440, paddingInline: 16 }}
    >
      <Tree
        ariaLabel="Map content"
        data={venueTree}
        defaultExpandedIds={["terminal-a"]}
        defaultSelectedId="terminal-a-2"
        divided
        bleed={16}
      />
    </div>
  ),
};

// GAP-151 and GAP-107: Map Content's tree, a level's items in sections, each
// with its count; a set of selected rows, with Shift and Ctrl or Cmd ranges;
// a right-click menu on a row; a row's meta on a line under its name.
const mapContentSections: TreeItem[] = [
  {
    id: "level-1",
    name: "Level 1",
    count: 6,
    children: [
      {
        id: "poi",
        name: "POI",
        section: true,
        count: 3,
        children: [
          {
            id: "cafe",
            name: "Bean & Leaf Café",
            meta: "Changes Awaiting Publish",
          },
          { id: "gate", name: "Gate A12" },
          { id: "pharmacy", name: "Pharmacy" },
        ],
      },
      {
        id: "interior",
        name: "Interior asset",
        section: true,
        count: 2,
        children: [
          { id: "desk", name: "Information desk" },
          { id: "kiosk", name: "Kiosk", disabled: true },
        ],
      },
      {
        id: "structural",
        name: "Structural",
        section: true,
        count: 1,
        children: [{ id: "wall", name: "North wall" }],
      },
    ],
  },
  { id: "level-2", name: "Level 2", count: 0 },
];

const SectionsTree = () => {
  const [selected, setSelected] = useState<string[]>(["cafe", "gate"]);
  const [target, setTarget] = useState<string>();
  return (
    <div
      className="border bg-background"
      style={{ width: 400, paddingInline: 16 }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Tree
            ariaLabel="Map content"
            data={mapContentSections}
            defaultExpandedIds={["level-1"]}
            divided
            bleed={16}
            selectionMode="multiple"
            selectedIds={selected}
            onSelectedIdsChange={setSelected}
            metaPlacement="below"
            onItemContextMenu={(item) => setTarget(item.id)}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>
            {selected.length > 1 && selected.includes(target ?? "")
              ? `${selected.length} features`
              : "Feature"}
          </ContextMenuLabel>
          <ContextMenuItem>Edit geometry</ContextMenuItem>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export const SectionsAndRanges: Story = {
  render: () => <SectionsTree />,
};

// Map Content's real size: 13,031 items under one level, in four sections.
// Only the rows in view are drawn.
const MAP_CONTENT_SIZES: [string, number][] = [
  ["POI", 9000],
  ["Interior asset", 3000],
  ["Structural", 1000],
  ["Virtual", 31],
];
const mapContentLarge: TreeItem[] = [
  {
    id: "level-1",
    name: "Level 1",
    count: 13031,
    children: MAP_CONTENT_SIZES.map(([section, size]) => ({
      id: section,
      name: section,
      section: true,
      count: size,
      children: Array.from({ length: size }, (_, index) => ({
        id: `${section}-${index + 1}`,
        name: `${section} ${index + 1}`,
      })),
    })),
  },
];

export const Virtualized: Story = {
  render: () => (
    <div className="border bg-background" style={{ width: 400 }}>
      <Tree
        ariaLabel="Map content"
        data={mapContentLarge}
        defaultExpandedIds={["level-1"]}
        divided
        selectionMode="multiple"
        virtualized
        style={{ height: 480 }}
      />
    </div>
  ),
};

// Map Content's own setup: in a panel with 16 of inline padding, divided,
// the strokes bled to the panel's edges, and only the rows in view drawn.
// The tree scrolls itself, with no sideways scroll, and its focus ring is
// drawn inside the row.
export const VirtualizedInPanel: Story = {
  render: () => (
    <div
      className="border bg-background"
      style={{ width: 400, paddingInline: 16 }}
    >
      <Tree
        ariaLabel="Map content"
        data={mapContentLarge}
        defaultExpandedIds={["level-1"]}
        divided
        bleed={16}
        selectionMode="multiple"
        metaPlacement="below"
        virtualized
        style={{ height: 480 }}
      />
    </div>
  ),
};
