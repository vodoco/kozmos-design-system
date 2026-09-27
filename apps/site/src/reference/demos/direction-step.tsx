import {
  Box,
  DirectionIcon,
  DirectionStep,
  Stack,
  Text,
  type DirectionType,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const types: readonly DirectionType[] = [
  "straight",
  "left",
  "right",
  "turn-back",
  "destination",
  "lift-up",
  "lift-down",
  "escalator-up",
  "escalator-down",
  "stairs-up",
  "stairs-down",
  "level-up",
  "level-down",
  "transition",
];

function Steps() {
  return (
    <Box className="site-demo-column">
      <Stack gap={2}>
        <DirectionStep
          type="straight"
          instruction="Head towards the atrium"
          distance="40 m"
          duration="1 min"
        />
        <DirectionStep
          type="left"
          instruction="Turn left at the pharmacy"
          distance="20 m"
        />
        <DirectionStep
          type="escalator-up"
          instruction="Take the escalator to the first floor"
          duration="1 min"
        />
        <DirectionStep
          type="destination"
          instruction="The bookshop is on your left"
        />
      </Stack>
    </Box>
  );
}

function Glyphs() {
  return (
    <Box className="site-demo-row">
      {types.map((type) => (
        <Stack key={type} gap={1} align="center">
          <DirectionIcon type={type} />
          <Text size="xs" color="muted">
            {type}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Four steps",
    description:
      "A manoeuvre glyph, the instruction, and a distance or duration when known.",
    Component: Steps,
  },
  {
    title: "The fourteen manoeuvres",
    description:
      "DirectionIcon on its own; the same glyphs drive ManoeuvreCard, Itinerary and RouteProgressRail.",
    Component: Glyphs,
  },
];
