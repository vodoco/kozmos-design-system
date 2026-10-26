import type { Meta, StoryObj } from "@storybook/react";
import { Combobox } from "./Combobox";

const options = [
  {
    value: "overview",
    label: "Overview",
    description: "Summary and key signals",
  },
  {
    value: "details",
    label: "Details",
    description: "Full record information",
  },
  {
    value: "activity",
    label: "Activity",
    description: "Recent changes and updates",
  },
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
  id: "components-combobox",
  title: "Core/Inputs/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  args: { label: "View", options },
  render: (args) => (
    <div className="w-80">
      <Combobox {...args} />
    </div>
  ),
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValidation: Story = {
  args: { label: "Project", error: "Choose a project before continuing." },
};

/**
 * Options under their groups (GAP-192), filtered by what is typed, as
 * MAP-64's "Find and select office desk type" step shows them: "desk" keeps
 * Interior Asset's three desks and POI's Reception Desk, each under its
 * group's label. It opens focused, so the list shows.
 */
export const Grouped: Story = {
  // At the top of its frame, and on the docs page in a frame of its own, so
  // the open list drops below the field rather than over the page's text.
  parameters: {
    layout: "padded",
    docs: { story: { inline: false, iframeHeight: 380 } },
  },
  args: {
    label: "Content type",
    options: contentTypes,
    defaultInputValue: "desk",
    autoFocus: true,
  },
};
