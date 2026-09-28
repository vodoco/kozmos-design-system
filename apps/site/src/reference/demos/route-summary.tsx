import { useState } from "react";
import {
  Box,
  Icon,
  RouteProgressRail,
  RouteSummary,
  Text,
} from "@kozmos-ds/react";
import { GlassBackdrop } from "../GlassBackdrop";
import type { DemoModule } from "../types";

function Estimate() {
  const [note, setNote] = useState("Preview the route, then start.");
  return (
    <Box className="site-demo-column">
      <RouteSummary
        state="preview"
        etaText="4 min"
        distanceText="280 m"
        transportModeIcon={<Icon name="user-01" size="sm" />}
        startNavigationLabel="Start"
        onStartNavigation={() => setNote("Started.")}
        onEndRoute={() => setNote("Cancelled.")}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

function Navigating() {
  return (
    <Box className="site-demo-column">
      <RouteSummary
        destination="Bookshop"
        durationText="3 min"
        distanceText="210 m"
        arrivalText="14:32"
        endLabel="End"
        onEndRoute={() => {}}
        progress={
          <RouteProgressRail
            progress={0.4}
            type="left"
            label="Route progress"
          />
        }
      />
    </Box>
  );
}

function OnGlass() {
  return (
    <GlassBackdrop colours={["blue", "green"]}>
      <RouteSummary
        surface="glass"
        destination="Gate B12"
        durationText="9 min"
        distanceText="620 m"
        arrivalText="14:41"
        onEndRoute={() => {}}
      />
    </GlassBackdrop>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "An estimate before setting off",
    description:
      "Without a destination the summary is the estimate: the ETA over the distance, start and end.",
    Component: Estimate,
  },
  {
    title: "Navigating, with progress",
    description:
      "With a destination it is the navigation layout: the name with End beside it, time, distance and arrival, and a RouteProgressRail in the progress slot.",
    Component: Navigating,
  },
  { title: "On glass", Component: OnGlass },
];
