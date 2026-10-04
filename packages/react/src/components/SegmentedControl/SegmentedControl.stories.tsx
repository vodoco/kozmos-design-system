import type { Meta, StoryObj } from "@storybook/react";
import { SegmentedControl } from "./SegmentedControl";

const items = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];

const meta: Meta<typeof SegmentedControl> = {
  id: "selection-segmentedcontrol",
  title: "Core/Inputs/SegmentedControl",
  component: SegmentedControl,
  args: {
    defaultValue: "overview",
    items,
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

export const Error: Story = {
  args: {
    error: "Choose a section before continuing.",
    value: "details",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "overview",
  },
};
