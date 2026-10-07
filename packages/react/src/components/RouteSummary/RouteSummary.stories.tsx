import type { Meta, StoryObj } from "@storybook/react";
import { NavigationPointer01 as Navigation } from "@kozmos-ds/icons";
import { Bus as Bike } from "@kozmos-ds/icons";
import { RouteSummary } from "./RouteSummary";
import { RouteProgressRail } from "../RouteProgressRail";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { Button } from "../Button";

const meta = {
  id: "map-routesummary",
  title: "SDK/Navigation/RouteSummary",
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

export const Hosted: Story = {
  args: {
    destination: "Northfield Artisan Bakery and Coffee Roastery",
    presentation: "hosted",
    onEndRoute: () => {},
  },
};

export const HostedWithImage: Story = {
  args: {
    ...Hosted.args,
    destinationImage: "/missing-destination-photo.png",
    durationText: "0 min",
    arrivalText: "Arrive 12:58",
  },
};

/**
 * Static wayfinding (GAP-110): Previous and Next in the summary's `actions`,
 * in equal columns after the rail. On the first step Previous is unavailable
 * through `aria-disabled`, so it keeps focus; the host guards its handler and
 * announces the new step.
 */
export const NavigationSteps: Story = {
  args: {
    ...Navigation_.args,
    actions: (
      <>
        <Button type="button" variant="outline" aria-disabled="true">
          Previous
        </Button>
        <Button type="button">Next</Button>
      </>
    ),
  },
  render: Active.render,
};

/**
 * The same steps hosted in the map shell's glass sheet: the panel's surface
 * is the one surface (decision 43), and the sheet fits the summary, the rail
 * and the actions.
 */
export const HostedSteps: Story = {
  args: {
    destination: "Airport Shuttles",
    durationText: "3 min",
    distanceText: "160 m",
    arrivalText: "Arrive 12:57",
    onEndRoute: () => {},
    progress: (
      <RouteProgressRail progress={0.42} type="left" label="Step 2 of 4" />
    ),
    actions: (
      <>
        <Button type="button" variant="outline">
          Previous
        </Button>
        <Button type="button">Next</Button>
      </>
    ),
  },
  render: (args) => (
    <AdaptiveMapShell
      className="h-[720px]"
      mapLabel="Example map"
      map={<div className="h-full w-full bg-muted" />}
      panelLabel="Directions"
      panelPresentation="bottom"
      panelSizing="content"
      panelSurface="glass"
      panel={
        <div className="flex flex-col gap-4 px-4 pb-4">
          <RouteSummary {...args} />
        </div>
      }
    />
  ),
};

/**
 * The route preview (GAP-111): without `onEndRoute` there is no End, and
 * `locationText` adds the place's line. Go and Details sit in the actions;
 * Details shows the route's directions in the same panel, as the host
 * composes them.
 */
export const RoutePreview: Story = {
  args: {
    destination: "Tessel Shoes",
    locationText: "Store · Level 1 · Harbour Point Mall",
    durationText: "3 min",
    distanceText: "205 m",
    surface: "glass",
    actions: (
      <>
        <Button type="button">Go</Button>
        <Button type="button" variant="outline">
          Details
        </Button>
      </>
    ),
  },
  render: Active.render,
};
