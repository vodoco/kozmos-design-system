import type { Meta, StoryObj } from "@storybook/vue3";
import { KozmosMetaStrip, KozmosMetaStripItem } from "../../index";
import { KozmosIcon } from "../../react-bridge";

/**
 * Vue's MetaStrip: the stories React's has, with the same names, each
 * inside the KozmosThemeProvider the Storybook's decorator gives every
 * story, drawn by its own render as React's is;
 * test/parity/meta-strip.parity.spec.ts draws each in both and holds Vue's
 * render to React's. Icon has no native port yet, so it comes from the
 * bridge, as an app would draw it today.
 */
const meta: Meta = {
  title: "Vue/Core/Data display/MetaStrip",
  component: KozmosMetaStrip,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    components: { KozmosIcon, KozmosMetaStrip, KozmosMetaStripItem },
    template: `
      <KozmosMetaStrip aria-label="About this place">
        <KozmosMetaStripItem label="Travel time">
          <template #icon><KozmosIcon name="clock" size="sm" /></template>
          12 min
        </KozmosMetaStripItem>
        <KozmosMetaStripItem label="Distance">210 m</KozmosMetaStripItem>
        <KozmosMetaStripItem label="Price band">$$$$</KozmosMetaStripItem>
      </KozmosMetaStrip>
    `,
  }),
};

export const WithVisibleLabels: Story = {
  render: () => ({
    components: { KozmosMetaStrip, KozmosMetaStripItem },
    template: `
      <KozmosMetaStrip aria-label="About this place">
        <KozmosMetaStripItem label="Travel time" show-label>12 min</KozmosMetaStripItem>
        <KozmosMetaStripItem label="Distance" show-label>210 m</KozmosMetaStripItem>
        <KozmosMetaStripItem label="Wait" show-label>25 min</KozmosMetaStripItem>
      </KozmosMetaStrip>
    `,
  }),
};

/** More facts than the strip is wide: it scrolls rather than wrapping. */
export const Overflowing: Story = {
  render: () => ({
    components: { KozmosMetaStrip, KozmosMetaStripItem },
    template: `
      <div class="max-w-sm">
        <KozmosMetaStrip aria-label="About this place">
          <KozmosMetaStripItem label="Travel time">12 min</KozmosMetaStripItem>
          <KozmosMetaStripItem label="Distance">210 m</KozmosMetaStripItem>
          <KozmosMetaStripItem label="Rating">4.5</KozmosMetaStripItem>
          <KozmosMetaStripItem label="Price band">$$$$</KozmosMetaStripItem>
          <KozmosMetaStripItem label="Crowd level">Busy</KozmosMetaStripItem>
          <KozmosMetaStripItem label="Occupancy">Occupied</KozmosMetaStripItem>
        </KozmosMetaStrip>
      </div>
    `,
  }),
};
