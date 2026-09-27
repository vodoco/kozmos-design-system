import { Check } from "@kozmos-ds/icons";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "Components/Badge",
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

export const Icon: Story = {
  args: {
    "aria-label": "Verified",
    icon: <Check />,
    size: "icon",
    variant: "default",
  },
};
