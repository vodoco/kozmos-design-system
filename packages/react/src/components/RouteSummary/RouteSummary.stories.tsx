import type { Meta, StoryObj } from "@storybook/react";
import { NavigationPointer01 as Navigation } from "@kozmos-ds/icons";
import { Bus as Bike } from "@kozmos-ds/icons";
import { RouteSummary } from "./RouteSummary";
import { RouteProgressRail } from "../RouteProgressRail";

const meta = {
  title: "Map/RouteSummary",
  component: RouteSummary,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    etaText: "12 min",
    distanceText: "1.8 km remaining",
    state: "active",
    transportModeIcon: <Bike className="h-5 w-5" />,
    onEndRoute: () => console.log("end route"),
  },
  render: (args) => (
    <div className="relative min-h-[280px] bg-muted/40">
      <RouteSummary {...args} />
    </div>
  ),
};

export const Preview: Story = {
  args: {
    etaText: "18 min",
    distanceText: "2 stops",
    state: "preview",
    transportModeIcon: <Navigation className="h-5 w-5" />,
    onEndRoute: () => console.log("end route"),
    onStartNavigation: () => console.log("start navigation"),
  },
  render: Active.render,
};

/**
 * The navigation layout: the destination with End beside it, the time,
 * distance and arrival on one row, the rail below.
 */
export const Navigation_: Story = {
  name: "Navigation",
  args: {
    destination: "Airport Shuttles",
    durationText: "4 min",
    distanceText: "201 m",
    arrivalText: "Arrive 12:58",
    surface: "glass",
    onEndRoute: () => console.log("end route"),
    progress: (
      <RouteProgressRail progress={0.16} type="straight" label="Step 1 of 4" />
    ),
  },
  render: Active.render,
};
