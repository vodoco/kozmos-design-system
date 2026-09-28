import { Box, DateRangePicker } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function ARange() {
  return (
    <Box className="site-demo-wide">
      <DateRangePicker
        label="Stay"
        helperText="Two fields that stack when there is no room for both."
        startLabel="Check in"
        endLabel="Check out"
      />
    </Box>
  );
}

function WithAnError() {
  return (
    <Box className="site-demo-wide">
      <DateRangePicker
        label="Report period"
        error="The end must come after the start."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A range",
    description: "Start and end dates under one label, each field named.",
    Component: ARange,
  },
  { title: "With an error", Component: WithAnError },
];
