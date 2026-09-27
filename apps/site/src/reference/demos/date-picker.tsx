import { Box, DatePicker } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function ADate() {
  return (
    <Box className="site-demo-column">
      <DatePicker
        label="Visit date"
        helperText="The venue is closed on public holidays."
      />
    </Box>
  );
}

function ValidationStates() {
  return (
    <Box className="site-demo-column">
      <DatePicker label="Arrival" status="success" helperText="Available." />
      <DatePicker
        label="Departure"
        status="warning"
        helperText="Later than the venue’s closing time."
      />
      <DatePicker label="Booking" error="Choose a date in the future." />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A date",
    description:
      "A native date field in the Input’s frame, with label and helper text.",
    Component: ADate,
  },
  {
    title: "Validation states",
    description:
      "status colours the frame; error replaces the helper text and marks the field invalid.",
    Component: ValidationStates,
  },
];
