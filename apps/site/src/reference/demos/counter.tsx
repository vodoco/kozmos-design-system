import { Box, Counter, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const emotions = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

function Tones() {
  return (
    <Box className="site-demo-row">
      <Counter>3</Counter>
      <Counter tone="brand">12</Counter>
      <Counter tone="destructive">99</Counter>
      <Counter tone="neutral">7</Counter>
      <Counter size="sm">3</Counter>
    </Box>
  );
}

function Emotions() {
  return (
    <Box className="site-demo-row">
      {emotions.map((emotion) => (
        <Stack key={emotion} align="center" gap={1}>
          <Counter emotion={emotion}>{emotion.length}</Counter>
          <Text as="span" size="xs" color="muted">
            {emotion}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Tones and sizes",
    description:
      "A count on a pill: brand, destructive, neutral, and a small size.",
    Component: Tones,
  },
  {
    title: "Emotions",
    description:
      "The same six meanings as Button and Tag, from the semantic emotion tokens.",
    Component: Emotions,
  },
];
