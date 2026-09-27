import { Box, Separator, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Horizontal() {
  return (
    <Box className="site-demo-column">
      <Text size="sm">Above the line.</Text>
      <Separator />
      <Text size="sm">Below the line.</Text>
    </Box>
  );
}

function Vertical() {
  return (
    <Stack
      direction="row"
      align="center"
      gap={3}
      className="site-demo-scroll-row"
    >
      <Text size="sm">First floor</Text>
      <Separator orientation="vertical" />
      <Text size="sm">3 min</Text>
      <Separator orientation="vertical" />
      <Text size="sm">Open</Text>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Horizontal",
    description:
      "A 1px line in the subtle border colour, decorative by default.",
    Component: Horizontal,
  },
  {
    title: "Vertical",
    description: 'orientation="vertical" fills the row’s height.',
    Component: Vertical,
  },
];
