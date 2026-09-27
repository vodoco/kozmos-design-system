import type { Meta, StoryObj } from "@storybook/react";
import {
  Bell01 as Bell,
  ChevronRight,
  Home01 as Home,
  SearchMd as Search,
  Settings01 as Settings,
} from "@kozmos-ds/icons";
import { NavigationItem } from "./NavigationItem";

const meta: Meta<typeof NavigationItem> = {
  title: "Navigation/NavigationItem",
  component: NavigationItem,
};

export default meta;
type Story = StoryObj<typeof NavigationItem>;

export const Side: Story = {
  render: () => (
    <nav className="flex w-64 flex-col gap-1 rounded-control border bg-background p-3">
      <NavigationItem icon={<Home className="h-5 w-5" />} selected>
        Overview
      </NavigationItem>
      <NavigationItem icon={<Search className="h-5 w-5" />}>
        Explore
      </NavigationItem>
      <NavigationItem
        badge="3"
        content="badge"
        icon={<Bell className="h-5 w-5" />}
      >
        Notifications
      </NavigationItem>
      <NavigationItem
        content="trailing"
        icon={<Settings className="h-5 w-5" />}
        trailing={<ChevronRight className="h-4 w-4" />}
      >
        Settings
      </NavigationItem>
    </nav>
  ),
};

export const Top: Story = {
  render: () => (
    <nav className="flex items-center gap-1 rounded-control border bg-background p-2">
      <NavigationItem placement="top" selected>
        Overview
      </NavigationItem>
      <NavigationItem placement="top">Explore</NavigationItem>
      <NavigationItem placement="top">Settings</NavigationItem>
    </nav>
  ),
};

export const Rail: Story = {
  render: () => (
    <nav className="flex w-20 flex-col items-center gap-2 rounded-control border bg-background p-2">
      <NavigationItem
        content="icon-label"
        icon={<Home className="h-6 w-6" />}
        placement="rail"
      >
        Home
      </NavigationItem>
      <NavigationItem
        content="icon-label"
        icon={<Search className="h-6 w-6" />}
        placement="rail"
        selected
      >
        Search
      </NavigationItem>
      <NavigationItem
        content="icon-label"
        icon={<Settings className="h-6 w-6" />}
        placement="rail"
      >
        Settings
      </NavigationItem>
    </nav>
  ),
};
