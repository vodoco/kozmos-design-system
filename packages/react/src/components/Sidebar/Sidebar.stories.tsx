import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import { NavigationItem } from "../NavigationItem/NavigationItem";
import {
  Bell01 as Bell,
  Home01 as Home,
  SearchMd as Search,
  Settings01 as Settings,
  User01 as User,
} from "@kozmos-ds/icons";

const meta: Meta<typeof Sidebar> = {
  title: "Navigation/Sidebar",
  component: Sidebar,
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div className="flex h-96 border">
      <Sidebar
        footer={
          <NavigationItem icon={<User className="h-5 w-5" />}>
            Account
          </NavigationItem>
        }
        header={<div className="font-bold text-xl">Workspace</div>}
        navigation={
          <div className="flex flex-col gap-2">
            <NavigationItem icon={<Home className="h-5 w-5" />} selected>
              Overview
            </NavigationItem>
            <NavigationItem icon={<Search className="h-5 w-5" />}>
              Explore
            </NavigationItem>
            <NavigationItem icon={<Settings className="h-5 w-5" />}>
              Settings
            </NavigationItem>
          </div>
        }
      />
      <div className="flex-1 p-4 bg-muted/20">Content Area</div>
    </div>
  ),
};

export const Rail: Story = {
  render: () => (
    <div className="flex h-[520px] border">
      <Sidebar
        className="w-20 items-center px-1 py-6"
        navigation={
          <div className="flex w-full flex-col items-center gap-2">
            {[
              { icon: Home, label: "Home" },
              { icon: Search, label: "Search", active: true },
              { icon: Bell, label: "Updates" },
              { icon: Settings, label: "Settings" },
              { icon: User, label: "Account" },
            ].map((item) => (
              <NavigationItem
                key={item.label}
                content="icon-label"
                icon={<item.icon className="h-6 w-6" />}
                placement="rail"
                selected={item.active}
              >
                {item.label}
              </NavigationItem>
            ))}
          </div>
        }
      />
      <div className="flex-1 p-4 bg-muted/20">Content Area</div>
    </div>
  ),
};
