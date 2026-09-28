import { Box, Spinner, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const sizes = ["sm", "md", "lg", "xl"] as const;

function Sizes() {
  return (
    <Box className="site-demo-row">
      {sizes.map((size) => (
        <Stack key={size} align="center" gap={1}>
          <Spinner size={size} aria-label={`Loading, ${size}`} />
          <Text as="span" size="xs" color="muted">
            {size}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Four sizes",
    description:
      "An indeterminate wait. Give it a label. It rests under the reduced-motion preference, and under the design config’s motion: reduced.",
    Component: Sizes,
  },
];
