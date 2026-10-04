import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  id: "navigation-link",
  title: "Core/Actions/Link",
  component: Link,
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    children: "Default Link",
    href: "#",
    variant: "default",
  },
};

export const Subtle: Story = {
  args: {
    children: "Subtle Link",
    href: "#",
    variant: "subtle",
  },
};
