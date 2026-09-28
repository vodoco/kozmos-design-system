import { useState } from "react";
import { Box, SegmentedControl, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const views = [
  { value: "map", label: "Map" },
  { value: "list", label: "List" },
  { value: "floors", label: "Floors" },
];

function Views() {
  const [view, setView] = useState("map");
  return (
    <Box className="site-demo-column">
      <SegmentedControl
        label="View"
        items={views}
        value={view}
        onValueChange={(next) => next && setView(next)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        Showing the {view}.
      </Text>
    </Box>
  );
}

function SizesAndWidth() {
  return (
    <Box className="site-demo-column">
      <SegmentedControl
        label="Small"
        size="sm"
        items={views}
        defaultValue="map"
      />
      <SegmentedControl
        label="Large"
        size="lg"
        items={views}
        defaultValue="list"
      />
      <SegmentedControl
        label="Full width"
        fullWidth
        items={views}
        defaultValue="floors"
      />
      <SegmentedControl
        label="Disabled"
        disabled
        items={views}
        defaultValue="map"
      />
      <SegmentedControl
        label="With an error"
        error="Choose a view."
        items={views}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One of three",
    description:
      "A toggle group with a sliding pill. Pressing the chosen segment again reports undefined; a control that wants exactly one keeps its value.",
    Component: Views,
  },
  { title: "Sizes, full width, disabled, error", Component: SizesAndWidth },
];
