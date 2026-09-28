import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FloorSelector } from "./FloorSelector";

const floors = [
  { id: "g", label: "Ground floor", shortLabel: "GF" },
  { id: "1", label: "First floor", shortLabel: "1F" },
  { id: "2", label: "Second floor", shortLabel: "2F" },
];

const meta: Meta<typeof FloorSelector> = {
  title: "Product SDK/FloorSelector",
  component: FloorSelector,
  args: {
    floors,
    selectedFloor: "1",
    onFloorSelect: fn(),
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FloorSelector>;

export const VerticalList: Story = {};

export const HorizontalList: Story = {
  args: { variant: "horizontal-list" },
};

// Listed top first: the up chevron steps to the previous level in the list,
// so "Floor up" goes up.
export const CompactStepper: Story = {
  args: { variant: "compact-stepper", floors: [...floors].reverse() },
};
