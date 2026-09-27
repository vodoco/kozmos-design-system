import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
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

const meta: Meta<typeof Tree> = {
  title: "Data Display/Tree",
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
    className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        role="treeitem"
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
        role="treeitem"
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
