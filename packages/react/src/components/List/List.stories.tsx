import type { Meta, StoryObj } from "@storybook/react";
import { List, ListItem } from "./List";

const meta: Meta<typeof List> = {
  id: "data-display-list",
  title: "Core/Data display/List",
  component: List,
};

export default meta;
type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: () => (
    <List>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Compact: Story = {
  render: () => (
    <List density="compact">
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};
