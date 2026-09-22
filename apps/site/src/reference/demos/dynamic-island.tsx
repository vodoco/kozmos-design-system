import { useState } from "react";
import {
  Box,
  DirectionIcon,
  DynamicIsland,
  Icon,
  SegmentedControl,
  Stack,
  Text,
} from "@kozmos/react";
import { Screen } from "../Screen";
import type { DemoModule } from "../types";

type IslandState = "compact" | "expanded" | "minimal";
const states: readonly IslandState[] = ["minimal", "compact", "expanded"];

function Summon() {
  const [state, setState] = useState<IslandState>("compact");
  return (
    <Box className="site-demo-column">
      <Screen>
        <DynamicIsland
          islandState={state}
          compactLeading={<Icon name="navigation-pointer-01" size="sm" />}
          compactTrailing="3 min to the bookshop"
          minimalContent={<Icon name="navigation-pointer-01" size="sm" />}
          expandedContent={
            <Stack gap={1}>
              <DirectionIcon type="left" />
              Turn left at the pharmacy
              <Box>20 m · 3 min to the bookshop</Box>
            </Stack>
          }
        />
      </Screen>
      <Text size="sm" color="muted">
        The island pins itself to the top of the window and takes no placement
        from the page around it (GAP-24). The screen above is its window: it
        holds the island where a phone would, over the page it belongs to. The
        island carries its own dark theme, so on this site’s dark theme its
        capsule is black on a black page and only the letters show (GAP-59). On
        a phone the island is the camera’s housing, and each presentation is
        laid out around the camera: Apple keeps 54% of the island’s width for
        it, this one keeps 12%, so the trailing slot and the expanded content
        run over where the camera would be (GAP-60).
      </Text>
      <SegmentedControl
        label="Island state"
        size="sm"
        items={states.map((value) => ({ value, label: value }))}
        value={state}
        onValueChange={(next) => {
          if (states.includes(next as IslandState))
            setState(next as IslandState);
        }}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Summon the island",
    description:
      "Three states: minimal, compact with leading and trailing slots, expanded with its own content. Its colours are the foreground on the background, inverted, so the slots take plain text and icons.",
    Component: Summon,
    tall: true,
  },
];
