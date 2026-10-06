import figma from "@figma/code-connect";
import {
  RouteProgressRail,
  type RouteProgressRailProps,
} from "./RouteProgressRail";

const routeProgressRailUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787";

// One mapping per Content variant: each is a story, and the step disc and the
// route mode take different props, so no one example can show them all. The
// markers along the route come from the product's routing. Typed from the
// component's own props so each example type-checks against it.
declare const waypoints: RouteProgressRailProps["waypoints"];
declare const transitions: RouteProgressRailProps["waypoints"];

// The step disc.

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "Start" },
  example: () => (
    <RouteProgressRail progress={0} type="straight" label="Step 1 of 4" />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "Midway" },
  example: () => (
    <RouteProgressRail progress={0.5} type="left" label="Step 2 of 4" />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "Arriving" },
  example: () => (
    <RouteProgressRail progress={0.84} type="destination" label="Step 4 of 4" />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "Unknown" },
  example: () => (
    <RouteProgressRail
      progress={null}
      type="left"
      label="Step 2 of 4"
      valueText="Position unavailable"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "Waypoints" },
  example: () => (
    <RouteProgressRail
      progress={0.2}
      type="left"
      label="Step 2 of 4"
      waypoints={waypoints}
      showCompletedTrack
    />
  ),
});

// The route mode: the active leg, its transitions and the position.

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "ActiveLeg" },
  example: () => (
    <RouteProgressRail
      progress={null}
      type="left"
      label="Journey progress"
      valueText="Entrance to elevator"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      positionMode="static"
      appearance="gradient"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "WalkingWithinLeg" },
  example: () => (
    <RouteProgressRail
      progress={0.2}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="gradient"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "AtTransition" },
  example: () => (
    <RouteProgressRail
      progress={0.4}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="gradient"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "AfterTransition" },
  example: () => (
    <RouteProgressRail
      progress={0.6}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0.4, end: 1 }}
      appearance="gradient"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "RoutePositionUnknown" },
  example: () => (
    <RouteProgressRail
      progress={null}
      type="left"
      label="Journey progress"
      valueText="Position unavailable"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="gradient"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "ThemeRoute" },
  example: () => (
    <RouteProgressRail
      progress={0.2}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="theme"
      motion="directional"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "GuidancePaused" },
  example: () => (
    <RouteProgressRail
      progress={0.2}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="gradient"
      motion="none"
    />
  ),
});

figma.connect(RouteProgressRail, routeProgressRailUrl, {
  variant: { Content: "LiveStart" },
  example: () => (
    <RouteProgressRail
      progress={0}
      type="left"
      label="Journey progress"
      waypoints={transitions}
      activeLeg={{ start: 0, end: 0.4 }}
      appearance="gradient"
      motion="directional"
    />
  ),
});
