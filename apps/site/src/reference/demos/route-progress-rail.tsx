import { useState } from "react";
import { Box, RouteProgressRail, Slider } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function AlongTheRoute() {
  const [progress, setProgress] = useState([42]);
  return (
    <Box className="site-demo-column">
      <RouteProgressRail
        progress={progress[0] / 100}
        type="left"
        label="Route progress"
      />
      <Slider
        label="How far along"
        min={0}
        max={100}
        step={1}
        value={progress}
        onValueChange={setProgress}
        formatValue={(value) => `${value}%`}
      />
    </Box>
  );
}

function Arriving() {
  return (
    <Box className="site-demo-column">
      <RouteProgressRail progress={0} type="straight" label="Setting off" />
      <RouteProgressRail
        progress={0.5}
        type="escalator-up"
        label="Halfway, taking the escalator"
      />
      <RouteProgressRail progress={1} type="destination" label="Arrived" />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Along the route",
    description:
      "A dot where it starts, a disc carrying the current manoeuvre that travels the track, a dot where it ends. progress is 0 to 1.",
    Component: AlongTheRoute,
  },
  { title: "Start, halfway, arrived", Component: Arriving },
];
