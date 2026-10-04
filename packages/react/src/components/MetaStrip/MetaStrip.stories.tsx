import type { Meta, StoryObj } from "@storybook/react";
import { MetaStrip, MetaStripItem } from "./MetaStrip";
import { Icon } from "../Icon/Icon";

const meta: Meta<typeof MetaStrip> = {
  id: "data-display-metastrip",
  title: "Core/Data display/MetaStrip",
  component: MetaStrip,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof MetaStrip>;

export const Default: Story = {
  render: () => (
    <MetaStrip aria-label="About this place">
      <MetaStripItem icon={<Icon name="clock" size="sm" />} label="Travel time">
        12 min
      </MetaStripItem>
      <MetaStripItem label="Distance">210 m</MetaStripItem>
      <MetaStripItem label="Price band">$$$$</MetaStripItem>
    </MetaStrip>
  ),
};

export const WithVisibleLabels: Story = {
  render: () => (
    <MetaStrip aria-label="About this place">
      <MetaStripItem label="Travel time" showLabel>
        12 min
      </MetaStripItem>
      <MetaStripItem label="Distance" showLabel>
        210 m
      </MetaStripItem>
      <MetaStripItem label="Wait" showLabel>
        25 min
      </MetaStripItem>
    </MetaStrip>
  ),
};

/** More facts than the strip is wide: it scrolls rather than wrapping. */
export const Overflowing: Story = {
  render: () => (
    <div className="max-w-sm">
      <MetaStrip aria-label="About this place">
        <MetaStripItem label="Travel time">12 min</MetaStripItem>
        <MetaStripItem label="Distance">210 m</MetaStripItem>
        <MetaStripItem label="Rating">4.5</MetaStripItem>
        <MetaStripItem label="Price band">$$$$</MetaStripItem>
        <MetaStripItem label="Crowd level">Busy</MetaStripItem>
        <MetaStripItem label="Occupancy">Occupied</MetaStripItem>
      </MetaStrip>
    </div>
  ),
};
