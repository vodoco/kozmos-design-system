import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./Stack";
import { Box } from "../Box/Box";

const meta: Meta<typeof Stack> = {
  id: "foundations-stack",
  title: "Core/Layout/Stack",
  component: Stack,
  argTypes: {
    direction: { control: "radio", options: ["row", "column"] },
    gap: { control: "select", options: [0, 1, 2, 4, 8] },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

// The theme fill under the theme foreground, white in both themes
// (decision 59); `bg-primary` is theme 600, for text and edges.
const foregrounds = {
  "bg-theme-fill": "text-theme-fill-foreground",
  "bg-secondary": "text-secondary-foreground",
  "bg-accent": "text-accent-foreground",
};
const BoxItem = ({
  children,
  color = "bg-theme-fill",
}: {
  children: React.ReactNode;
  color?: keyof typeof foregrounds;
}) => (
  <Box className={`p-4 rounded ${foregrounds[color]} ${color}`}>{children}</Box>
);

export const Default: Story = {
  args: {
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem color="bg-secondary">Item 2</BoxItem>
        <BoxItem color="bg-accent">Item 3</BoxItem>
      </>
    ),
  },
};

export const Horizontal: Story = {
  args: {
    direction: "row",
    gap: 4,
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem color="bg-secondary">Item 2</BoxItem>
        <BoxItem color="bg-accent">Item 3</BoxItem>
      </>
    ),
  },
};
