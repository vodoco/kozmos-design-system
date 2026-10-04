import type { Meta, StoryObj } from "@storybook/react";
import { RouteProgressRail } from "./RouteProgressRail";

const meta = {
  id: "map-routeprogressrail",
  title: "SDK/Navigation/RouteProgressRail",
  component: RouteProgressRail,
  parameters: { layout: "padded" },
  args: { progress: 0.5, type: "left", label: "Step 2 of 4" },
  render: (args) => (
    <div className="max-w-[360px]">
      <RouteProgressRail {...args} />
    </div>
  ),
} satisfies Meta<typeof RouteProgressRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {
  args: { progress: 0, type: "straight", label: "Step 1 of 4" },
};
export const Midway: Story = {};
export const Arriving: Story = {
  args: { progress: 0.84, type: "destination", label: "Step 4 of 4" },
};

export const Unknown: Story = {
  args: { progress: null, valueText: "Position unavailable" },
};
export const RightToLeft: Story = {
  args: { progress: 0.25, dir: "rtl", type: "left", valueText: "ربع الرحلة" },
};

export const Waypoints: Story = {
  args: {
    progress: 0.2,
    showCompletedTrack: true,
    waypoints: [
      { id: "entrance", position: 0, type: "straight", label: "Entrance" },
      { id: "gallery", position: 0.5, type: "left", label: "Gallery entrance" },
      {
        id: "gallery-turn",
        position: 0.51,
        type: "right",
        label: "Turn right into gallery",
      },
      {
        id: "destination",
        position: 1,
        type: "destination",
        label: "Destination",
      },
    ],
  },
};

const route = {
  activeLeg: { start: 0, end: 0.4 },
  activeWaypointId: "lift",
  appearance: "gradient" as const,
  motion: "directional" as const,
  label: "Journey progress",
  waypoints: [
    { id: "start", position: 0, type: "walking" as const, label: "Entrance" },
    {
      id: "lift",
      position: 0.4,
      type: "lift-up" as const,
      label: "Elevator to Level 2",
    },
    { id: "end", position: 1, type: "destination" as const, label: "Gallery" },
  ],
};
export const ActiveLeg: Story = {
  args: {
    ...route,
    progress: null,
    positionMode: "static",
    valueText: "Entrance to elevator",
  },
};
export const WalkingWithinLeg: Story = { args: { ...route, progress: 0.2 } };
export const AtTransition: Story = { args: { ...route, progress: 0.4 } };
export const AfterTransition: Story = {
  args: { ...route, progress: 0.6, activeLeg: { start: 0.4, end: 1 } },
};
export const RoutePositionUnknown: Story = {
  args: { ...route, progress: null, valueText: "Position unavailable" },
};
export const RouteRightToLeft: Story = {
  args: { ...route, progress: 0.2, dir: "rtl" },
};
export const ThemeRoute: Story = {
  args: { ...route, progress: 0.2, appearance: "theme" },
};
export const StaticAfterTransition: Story = {
  args: {
    ...route,
    progress: null,
    positionMode: "static",
    activeLeg: { start: 0.4, end: 1 },
    valueText: "Elevator to gallery",
  },
};
export const GuidancePaused: Story = {
  args: { ...route, progress: 0.2, motion: "none" },
};
export const LiveStart: Story = { args: { ...route, progress: 0 } };
