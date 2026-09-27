import { Box, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const sizes = ["4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"] as const;

function Sizes() {
  return (
    <Stack gap={1}>
      {sizes.map((size) => (
        <Text key={size} size={size}>
          {size} · Find your way
        </Text>
      ))}
    </Stack>
  );
}

function WeightsAndColours() {
  return (
    <Box className="site-demo-column">
      <Text weight="normal">Normal weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
      <Text color="muted">Muted colour</Text>
      <Text color="primary">Primary colour</Text>
      <Text color="destructive">Destructive colour</Text>
      <Text align="center">Centred</Text>
      <Text truncate>
        Truncated after one line: New and second-hand books, with a reading
        corner by the window, and events on Thursdays.
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Eight sizes",
    description: "A paragraph by default; as picks the element.",
    Component: Sizes,
  },
  {
    title: "Weights, colours, alignment, truncation",
    Component: WeightsAndColours,
  },
];
