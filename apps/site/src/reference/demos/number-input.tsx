import { useState } from "react";
import { Box, NumberInput, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Guests() {
  const [value, setValue] = useState<number | null>(2);
  return (
    <Box className="site-demo-column">
      <NumberInput
        label="Guests"
        min={1}
        max={12}
        step={1}
        defaultValue={2}
        onValueChange={setValue}
        helperText="Between 1 and 12."
      />
      <Text size="sm" color="muted" aria-live="polite">
        {value === null
          ? "No number yet."
          : `${value} guest${value === 1 ? "" : "s"}`}
      </Text>
    </Box>
  );
}

function WithoutSteppers() {
  return (
    <Box className="site-demo-column">
      <NumberInput
        label="Floor area, m²"
        showSteppers={false}
        defaultValue={1200}
      />
      <NumberInput
        label="Capacity"
        defaultValue={0}
        error="Capacity must be above zero."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "With steppers",
    description:
      "A numeric field with increment and decrement buttons honouring min, max and step; onValueChange reports a number or null.",
    Component: Guests,
  },
  { title: "Without steppers, and an error", Component: WithoutSteppers },
];
