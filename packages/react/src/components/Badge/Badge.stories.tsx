import { Check } from "@kozmos-ds/icons";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  id: "components-badge",
  title: "Core/Data display/Badge",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const WithCounter: Story = {
  args: {
    children: "New",
    counter: 2,
    showCounter: true,
    variant: "secondary",
  },
};

/**
 * On the default Badge, itself the theme fill, the counter inverts: white with
 * its number in the fill, in both themes (Olcay, 2026-10-07), as FloorSelector's
 * count does on its selected level.
 */
export const DefaultWithCounter: Story = {
  args: {
    children: "Messages",
    counter: 3,
    showCounter: true,
    variant: "default",
  },
};

export const Icon: Story = {
  args: {
    "aria-label": "Verified",
    icon: <Check />,
    size: "icon",
    variant: "default",
  },
};
