import { useState } from "react";
import { Box, Slider, Stack, Text, UserLocationMarker } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Heading() {
  const [heading, setHeading] = useState([45]);
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-row">
        <Stack gap={2} align="center">
          <UserLocationMarker
            aria-label={`You are here, facing ${heading[0]} degrees`}
            heading={heading[0]}
          />
          <Text size="xs" color="muted">
            heading {heading[0]}°
          </Text>
        </Stack>
        <Stack gap={2} align="center">
          <UserLocationMarker aria-label="You are here" showHeading={false} />
          <Text size="xs" color="muted">
            no heading
          </Text>
        </Stack>
      </Box>
      <Slider
        label="Heading"
        min={0}
        max={359}
        step={1}
        value={heading}
        onValueChange={setHeading}
        formatValue={(value) => `${value}°`}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Facing a heading",
    description:
      "The blue disc with a pulse and a heading cone; showHeading hides the cone. The pulse stops under reduced motion.",
    Component: Heading,
  },
];
