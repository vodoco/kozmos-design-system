import type { Meta, StoryObj } from "@storybook/react";
import { Navbar } from "./Navbar";
import { Button } from "../Button/Button";
import { NavigationItem } from "../NavigationItem/NavigationItem";
import {
  Bell01 as Bell,
  ChevronDown,
  Globe01 as Globe,
  User01 as User,
} from "@kozmos-ds/icons";

const meta: Meta<typeof Navbar> = {
  title: "Navigation/Navbar",
  component: Navbar,
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: () => (
    <Navbar
      logo={<div className="font-bold text-xl">Kozmos</div>}
      account={
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <User className="h-5 w-5" />
        </Button>
      }
      navigation={
        <div className="flex items-center gap-2">
          <NavigationItem href="#" placement="top" selected>
            Overview
          </NavigationItem>
          <NavigationItem href="#" placement="top">
            Settings
          </NavigationItem>
        </div>
      }
    />
  ),
};

export const Contextual: Story = {
  render: () => (
    <Navbar
      account={
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <User className="h-5 w-5" />
        </Button>
      }
      logo={<Globe className="h-7 w-7" />}
      primaryAction={<Button>Publish</Button>}
      context={
        <button className="flex min-w-0 flex-col text-left" type="button">
          <span className="text-xs text-muted-foreground">Context</span>
          <span className="flex min-w-0 items-center gap-1 text-sm font-semibold text-primary">
            Workspace
            <ChevronDown className="h-4 w-4 shrink-0" />
          </span>
        </button>
      }
      utilities={
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
      }
      navigation={
        <div className="flex items-center gap-2">
          <NavigationItem href="#" placement="top" selected>
            Overview
          </NavigationItem>
          <NavigationItem href="#" placement="top">
            Explore
          </NavigationItem>
          <NavigationItem href="#" placement="top">
            Settings
          </NavigationItem>
        </div>
      }
    />
  ),
};

export const NarrowContainer: Story = {
  ...Contextual,
  decorators: [
    (Story) => (
      <div style={{ width: 280, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
};
