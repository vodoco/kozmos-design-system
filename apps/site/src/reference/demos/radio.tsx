import { useState } from "react";
import { Box, RadioGroup, RadioGroupItem, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Digest() {
  const [value, setValue] = useState("daily");
  return (
    <Box className="site-demo-column">
      <RadioGroup label="Email digest" value={value} onValueChange={setValue}>
        <RadioGroupItem value="immediately" label="As it happens" />
        <RadioGroupItem value="daily" label="Once a day" />
        <RadioGroupItem value="weekly" label="Once a week" />
        <RadioGroupItem value="never" label="Never" />
      </RadioGroup>
      <Text size="sm" color="muted" aria-live="polite">
        Chosen: {value}
      </Text>
    </Box>
  );
}

function DisabledAndError() {
  return (
    <Box className="site-demo-column">
      <RadioGroup label="Route preference" defaultValue="quickest" disabled>
        <RadioGroupItem value="quickest" label="Quickest" />
        <RadioGroupItem value="step-free" label="Step-free" />
      </RadioGroup>
      <RadioGroup label="Payment" error="Choose how to pay.">
        <RadioGroupItem value="card" label="Card" error />
        <RadioGroupItem value="cash" label="Cash" error />
      </RadioGroup>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One of four",
    description: "A labelled group of items; arrow keys move between them.",
    Component: Digest,
  },
  { title: "Disabled, and an error", Component: DisabledAndError },
];
