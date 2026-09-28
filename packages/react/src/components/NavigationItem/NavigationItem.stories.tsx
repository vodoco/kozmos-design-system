import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertCircle,
  Bell01 as Bell,
  ChevronRight,
  Globe01 as Globe,
  Home01 as Home,
  Map01 as MapIcon,
  MarkerPin01 as MarkerPin,
  NavigationPointer01 as NavigationPointer,
  SearchMd as Search,
  Settings01 as Settings,
  Users01 as Users,
  Wifi,
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
      {/* Two words that each fit the tile but not together: the label takes
          its second line and the tile stays 72px tall. */}
      <NavigationItem
        content="icon-label"
        icon={<MarkerPin className="h-6 w-6" />}
        placement="rail"
      >
        Nearby places
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

// A web dashboard's rail is wider than an app's: its tiles are 96px, given
// with `className="w-24"`, as BottomNavigation widens its own. At 72px no
// legible size fits "Configuration" in the tile's 56px; at 96px every one of
// these nine labels fits two 11px lines, in every engine and font measured.
const dashboardRail = [
  { icon: MapIcon, label: "Map Content" },
  { icon: MarkerPin, label: "Geofences" },
  { icon: NavigationPointer, label: "Wayfinding Network" },
  { icon: Wifi, label: "IoT Devices" },
  { icon: AlertCircle, label: "Metadata" },
  { icon: Settings, label: "SDK Configuration" },
  { icon: Users, label: "User Management" },
  { icon: Globe, label: "UI Translation Manager" },
  { icon: Settings, label: "System Settings", selected: true },
];

export const DashboardRail: Story = {
  name: "Dashboard rail",
  render: () => (
    <nav className="flex w-28 flex-col items-center gap-2 rounded-control border bg-background p-2">
      {dashboardRail.map((item) => (
        <NavigationItem
          key={item.label}
          className="w-24"
          content="icon-label"
          icon={<item.icon className="h-6 w-6" />}
          placement="rail"
          selected={item.selected}
        >
          {item.label}
        </NavigationItem>
      ))}
    </nav>
  ),
};
