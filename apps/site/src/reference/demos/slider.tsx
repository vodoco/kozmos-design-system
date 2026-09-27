import { useState } from "react";
import { Box, Slider, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Radius() {
  const [value, setValue] = useState([400]);
  return (
    <Box className="site-demo-column">
      <Slider
        label="Search radius"
        min={100}
        max={1000}
        step={50}
        value={value}
        onValueChange={setValue}
        formatValue={(v) => `${v} m`}
        showValueTooltip
      />
      <Text size="sm" color="muted" aria-live="polite">
        Within {value[0]} metres
      </Text>
    </Box>
  );
}

function ARange() {
  return (
    <Box className="site-demo-column">
      <Slider
        label="Opening hours"
        min={0}
        max={24}
        step={1}
        defaultValue={[9, 20]}
        thumbCount={2}
        thumbLabels={["Opens", "Closes"]}
        formatValue={(v) => `${v}:00`}
      />
      <Slider
        label="Volume"
        defaultValue={[30]}
        error="Too quiet to hear the announcements."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One thumb, with a value tooltip",
    description:
      "min, max and step; formatValue shapes the value for the tooltip and the screen reader.",
    Component: Radius,
  },
  { title: "Two thumbs, and an error", Component: ARange },
];
