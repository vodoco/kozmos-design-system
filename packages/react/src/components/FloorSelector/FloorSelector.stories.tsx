import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FloorSelector } from "./FloorSelector";

// Top floor first, on every variant (Olcay, 2026-09-28): the highest level at
// the top, as on a lift panel and in the SDK's level switcher. The stepper's
// up chevron steps to the previous level in the list, so "Floor up" goes up.
const floors = [
  { id: "2", label: "Second floor", shortLabel: "2F" },
  { id: "1", label: "First floor", shortLabel: "1F" },
  { id: "g", label: "Ground floor", shortLabel: "GF" },
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

export const CompactStepper: Story = {
  args: { variant: "compact-stepper" },
};
