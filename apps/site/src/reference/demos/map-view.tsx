import { Box, MapView, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Slot() {
  return (
    <Box className="site-demo-map">
      <MapView mapLabel="Map engine slot, illustrative">
        <Box className="site-demo-layer site-demo-centred">
          <Stack gap={1} align="center">
            <Text weight="semibold">The map engine renders here</Text>
            <Text size="sm" color="muted" align="center">
              Kozmos hosts a map and does not draw one. MapView is the labelled
              region the engine paints into; overlays and pins sit on top.
            </Text>
          </Stack>
        </Box>
      </MapView>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The slot",
    description:
      "A region named by mapLabel, on the muted surface, with a minimum height of 400px (GAP-25).",
    Component: Slot,
    tall: true,
  },
];
