import { useState } from "react";
import { Box, FloorSelector, Text } from "@kozmos-ds/react";
import { floors } from "../sample-data";
import type { DemoModule } from "../types";

function Variants() {
  const [floor, setFloor] = useState("1");
  const label = floors.find((entry) => entry.id === floor)?.label;
  return (
    <Box className="site-demo-column">
      <Text size="sm" color="muted" aria-live="polite">
        Showing {label}.
      </Text>
      <Box className="site-demo-row">
        <FloorSelector
          label="Floor, vertical"
          floors={floors}
          selectedFloor={floor}
          onFloorSelect={setFloor}
        />
        <FloorSelector
          label="Floor, stepper"
          variant="compact-stepper"
          floors={floors}
          selectedFloor={floor}
          onFloorSelect={setFloor}
        />
      </Box>
      <FloorSelector
        label="Floor, horizontal"
        variant="horizontal-list"
        floors={floors}
        selectedFloor={floor}
        onFloorSelect={setFloor}
      />
    </Box>
  );
}

function Disabled() {
  const [floor, setFloor] = useState("g");
  return (
    <Box className="site-demo-row">
      <FloorSelector
        label="Floor"
        floors={floors.map((entry) =>
          entry.id === "-1" ? { ...entry, disabled: true } : entry,
        )}
        selectedFloor={floor}
        onFloorSelect={setFloor}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Three variants, one floor",
    description:
      "The same floors and the same selection, as a vertical list for a map’s edge, a compact stepper, and a horizontal list for a sheet.",
    Component: Variants,
  },
  {
    title: "A floor without a map",
    description:
      "A disabled FloorPresentation stays listed and cannot be chosen.",
    Component: Disabled,
  },
];
