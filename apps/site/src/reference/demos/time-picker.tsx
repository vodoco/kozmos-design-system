import { Box, TimePicker } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function ATime() {
  return (
    <Box className="site-demo-column">
      <TimePicker
        label="Arrival"
        helperText="Check-in opens two hours before."
      />
      <TimePicker label="Departure" error="Choose a time after the arrival." />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A time",
    description:
      "A native time field in the Input’s frame, with the same label, helper and error props.",
    Component: ATime,
  },
];
