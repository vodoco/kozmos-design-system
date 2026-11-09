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

/**
 * An item that opens a page in a new tab draws the new-tab icon at its end
 * and is read "Documentation opens in a new tab" (decision 152).
 */
export const ExternalItem: Story = {
  render: () => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Account</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem>Settings</MenuItem>
        <MenuItem external asChild>
          <a href="https://docs.pointr.tech">Documentation</a>
        </MenuItem>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/**
 * ExternalItem, open, so the visual review draws the item with its new-tab
 * icon.
 */
export const ExternalItemOpen: Story = {
  render: () => (
    <div style={{ height: 200 }}>
      <Menu defaultOpen modal={false}>
        <MenuTrigger asChild>
          <Button variant="outline">Account</Button>
        </MenuTrigger>
        <MenuContent align="start">
          <MenuItem>Settings</MenuItem>
          <MenuItem external asChild>
            <a href="https://docs.pointr.tech">Documentation</a>
          </MenuItem>
          <MenuSeparator />
          <MenuItem>Sign out</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  ),
};
