import type { Meta, StoryObj } from "@storybook/react";
import { MapInfoPanel } from "./MapInfoPanel";

const meta = {
  title: "Product/SDK/MapInfoPanel",
  component: MapInfoPanel,
  parameters: { layout: "fullscreen" },
  args: {
    onClose: () => {},
    style: { width: 384, minHeight: 720 },
    content: {
      title: "About this map",
      introduction:
        "Explore the venue and find the places and services you need.",
      faqs: [
        {
          id: "floors",
          question: "How do I change floors?",
          answer: "Open the floor selector and choose a level.",
        },
      ],
      credits: [{ id: "owner", label: "Indoor map data © Example venue" }],
      links: [
        {
          id: "support",
          label: "Contact support",
          href: "mailto:support@example.com",
        },
      ],
      versions: [{ id: "app", label: "App version", value: "Example" }],
    },
  },
} satisfies Meta<typeof MapInfoPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ExpandedFAQ: Story = { args: { expandedFAQ: "floors" } };
export const Minimal: Story = {
  args: { content: { title: "About this map" } },
};
export const LongContent: Story = {
  args: {
    content: {
      ...meta.args.content,
      introduction: "Detailed venue information. ".repeat(60),
    },
  },
};
