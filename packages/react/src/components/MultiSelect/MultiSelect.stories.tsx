import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect } from "./MultiSelect";

const options = [
  { value: "filters", label: "Filters", description: "Show saved filters" },
  { value: "layers", label: "Layers", description: "Map and data layers" },
  { value: "routes", label: "Routes", description: "Route overlays" },
  { value: "alerts", label: "Alerts", description: "Operational notices" },
];

// GAP-192: MAP-64's Map Content type picker, its types under their families.
// Given in any order: the groups come in the order they first appear.
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
  { value: "meeting-room", label: "Meeting Room", group: "POI" },
];

const meta = {
  id: "components-multiselect",
  title: "Core/Inputs/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
  args: { label: "Tools", options },
  render: (args) => (
    <div className="w-96">
      <MultiSelect {...args} />
    </div>
  ),
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelectedValues: Story = {
  args: {
    label: "Visible layers",
    defaultValue: ["filters", "routes"],
    helperText: "Choose up to three layers.",
    maxSelected: 3,
  },
};

/**
 * Options under their groups (GAP-192), the chosen ones as chips. It opens
 * with its field focused, so the list shows, except on the docs page, where
 * the open list would sit over its text.
 */
export const Grouped: Story = {
  parameters: { layout: "padded" },
  args: {
    label: "Content types",
    options: contentTypes,
    defaultValue: ["office-desk"],
  },
  render: function Grouped(args, { viewMode }) {
    const field = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (viewMode !== "docs") field.current?.querySelector("input")?.focus();
    }, [viewMode]);
    return (
      <div className="w-96">
        <MultiSelect ref={field} {...args} />
      </div>
    );
  },
};
