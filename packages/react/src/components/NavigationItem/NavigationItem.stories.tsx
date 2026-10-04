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
import { ThemeProvider } from "../ThemeProvider";
import { NavigationItem } from "./NavigationItem";

const meta: Meta<typeof NavigationItem> = {
  id: "navigation-navigationitem",
  title: "Core/Layout/NavigationItem",
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

// A rail is 96px wide, on the surface, with a 1px edge at its inline end, and
// its items fill it (decision 42). Kozmos's own rail is Sidebar's `rail`
// variant; these stories draw a plain one so the items are all there is.
const railClassName = "flex w-24 flex-col border-e bg-surface-0";

function AppRail() {
  return (
    <nav aria-label="Main" className={railClassName}>
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
        icon={<MarkerPin className="h-6 w-6" />}
        placement="rail"
      >
        Nearby places
      </NavigationItem>
      {/* Two words that do not fit one line: the label takes its second line
          and the item grows to hold it. */}
      <NavigationItem
        content="icon-label"
        icon={<NavigationPointer className="h-6 w-6" />}
        placement="rail"
      >
        Accessible routes
      </NavigationItem>
      <NavigationItem
        content="icon-label"
        icon={<Settings className="h-6 w-6" />}
        placement="rail"
      >
        Settings
      </NavigationItem>
    </nav>
  );
}

export const Rail: Story = {
  render: () => <AppRail />,
};

// The selected item's bar is on the inline end, so it moves to the left.
export const RailRightToLeft: Story = {
  name: "Rail, right to left",
  render: function RailRightToLeftStory(_args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <AppRail />
      </ThemeProvider>
    );
  },
};

// The Cloud Dashboard's nine labels, the longest a rail has been asked to
// hold: in the 96px rail each takes at most two lines and no word splits, in
// every engine and font measured.
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
    <nav aria-label="Settings" className={railClassName}>
      {dashboardRail.map((item) => (
        <NavigationItem
          key={item.label}
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
