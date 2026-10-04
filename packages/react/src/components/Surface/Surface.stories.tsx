import type { Meta, StoryObj } from "@storybook/react";
import { Surface } from "./Surface";
import { Text } from "../Text";

const meta = {
  id: "foundations-surface",
  title: "Core/Layout/Surface",
  component: Surface,
  parameters: { layout: "padded" },
  render: (args) => (
    <div
      className="relative min-h-[280px] rounded-panel p-6"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--primitives-colors-theme-500) 0%, var(--primitives-colors-theme-200) 45%, var(--primitives-colors-background-300) 100%)",
      }}
    >
      <Text className="mb-24 text-sm">
        Solid covers what is behind it; glass lets it show through, blurred and
        saturated by the token.
      </Text>
      <Surface {...args} />
    </div>
  ),
  args: {
    className: "rounded-container p-4 text-foreground shadow-floating",
    children: "A card over the map.",
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

export const Glass: Story = {
  args: {
    variant: "glass",
    children: "A card over the map, on the glass surface role.",
  },
};

export const GlassPanel: Story = {
  args: {
    variant: "glass",
    className: "rounded-panel p-6 text-foreground shadow-overlay",
    children: "A panel, radius Panel, elevation Overlay.",
  },
};
