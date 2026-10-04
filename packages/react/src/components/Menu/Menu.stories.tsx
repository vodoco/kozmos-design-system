import type { Meta, StoryObj } from "@storybook/react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "./Menu";
import { Button } from "../Button/Button";

const meta: Meta<typeof Menu> = {
  id: "navigation-menu",
  title: "Core/Layout/Menu",
  component: Menu,
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>My Account</MenuLabel>
        <MenuSeparator />
        <MenuItem>Profile</MenuItem>
        <MenuItem>Billing</MenuItem>
        <MenuItem>Team</MenuItem>
        <MenuItem>Subscription</MenuItem>
      </MenuContent>
    </Menu>
  ),
};
