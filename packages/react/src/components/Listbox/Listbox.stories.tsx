import type { Meta, StoryObj } from "@storybook/react";
import { Listbox } from "./Listbox";

const options = [
  { value: "nearby", label: "Nearby", description: "Closest locations first" },
  { value: "popular", label: "Popular", description: "Highest engagement" },
  { value: "recent", label: "Recent", description: "Newest activity" },
];

// GAP-192: MAP-64's Map Content type picker, its types under their families.
// Given in any order: the groups come in the order they first appear. Three,
// so the list shows them all at its 16rem.
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
];

const meta = {
  id: "components-listbox",
  title: "Core/Inputs/Listbox",
  component: Listbox,
  args: { "aria-label": "Sort locations" },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    defaultValue: "nearby",
    options,
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
    defaultValue: ["nearby", "recent"],
    options,
  },
};

/** Options under their groups (GAP-192); the arrow keys skip the labels. */
export const Grouped: Story = {
  args: {
    "aria-label": "Content type",
    defaultValue: "hot-desk",
    options: contentTypes,
  },
};

/**
 * An option with no group (Lift) comes first, unlabelled, before every
 * group, so it never reads as part of the group above it (GAP-192).
 */
export const GroupedAndUngrouped: Story = {
  args: {
    "aria-label": "Content type",
    options: [
      { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
      { value: "lift", label: "Lift" },
      { value: "reception-desk", label: "Reception Desk", group: "POI" },
    ],
  },
};
