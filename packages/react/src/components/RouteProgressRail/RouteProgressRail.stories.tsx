import type { Meta, StoryObj } from "@storybook/react";
import { RouteProgressRail } from "./RouteProgressRail";

const meta = {
  title: "Map/RouteProgressRail",
  component: RouteProgressRail,
  parameters: { layout: "padded" },
  args: { progress: 0.5, type: "left", label: "Step 2 of 4" },
  render: (args) => (
    <div className="max-w-[360px]">
      <RouteProgressRail {...args} />
    </div>
  ),
} satisfies Meta<typeof RouteProgressRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  args: { progress: 0, type: "straight", label: "Step 1 of 4" },
};
export const Midway: Story = {};
export const Arriving: Story = {
  args: { progress: 0.84, type: "destination", label: "Step 4 of 4" },
};

export const Unknown: Story = {
  args: { progress: null, valueText: "Position unavailable" },
};
export const RightToLeft: Story = {
  args: { progress: 0.25, dir: "rtl", type: "left", valueText: "ربع الرحلة" },
};
