import { Box, Skeleton, Stack } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function APlaceLoading() {
  return (
    <Box className="site-demo-column">
      <Stack direction="row" align="center" gap={3}>
        {/* Shape, and the space to hold, are the component's own: a circle
            takes its diameter, a line stands in for a row of text at the
            height it would have, and a block is told what it replaces. */}
        <Skeleton
          shape="circle"
          width="calc(var(--primitives-layout-sizing-600) * 1px)"
        />
        <Stack gap={2} className="site-skeleton-lines">
          <Skeleton shape="line" />
          <Skeleton shape="line" width="60%" />
        </Stack>
      </Stack>
      <Skeleton
        shape="block"
        height="calc(var(--primitives-layout-sizing-800) * 2px)"
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A place, loading",
    description:
      "A pulsing muted surface in the shape of what it stands in for: a circle for an avatar, a line for a row of text, a block for a card. A number is pixels, a string any CSS length, so a line can be 60% of its row.",
    Component: APlaceLoading,
  },
];
