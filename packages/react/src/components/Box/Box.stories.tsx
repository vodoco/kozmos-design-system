import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  id: "foundations-box",
  title: "Core/Layout/Box",
  component: Box,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: {
    children: "This is a Box",
    className: "p-4 bg-primary text-primary-foreground rounded-control",
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: (
      <span className="p-4 bg-secondary text-secondary-foreground rounded-control">
        This is a Span rendered via Box asChild
      </span>
    ),
  },
};
