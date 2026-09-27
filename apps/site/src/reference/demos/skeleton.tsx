import { Box, Skeleton, Stack } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function APlaceLoading() {
  return (
    <Box className="site-demo-column">
      <Stack direction="row" align="center" gap={3}>
        {/* Skeleton keeps its own corners (GAPS.md, GAP-04): a round Box
            clips it into a disc. */}
        <Box className="site-skeleton-disc">
          <Skeleton className="site-skeleton-fill" />
        </Box>
        <Stack gap={2} className="site-skeleton-lines">
          <Skeleton className="site-skeleton-line" />
          <Skeleton className="site-skeleton-line site-skeleton-line-short" />
        </Stack>
      </Stack>
      <Skeleton className="site-skeleton-block" />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A place, loading",
    description:
      "A pulsing muted surface at the size the caller gives it. Its corners are its own: a class cannot round them further, so the disc is a round Box that clips it.",
    Component: APlaceLoading,
  },
];
