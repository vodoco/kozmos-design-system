import { Box, Surface, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Solid() {
  return (
    <Box className="site-demo-column">
      <Surface className="site-theme-sample">
        <Text weight="semibold">Solid</Text>
        <Text size="sm" color="muted">
          The background colour with the subtle border. The shape and the
          elevation are the caller’s.
        </Text>
      </Surface>
    </Box>
  );
}

function Glass() {
  return (
    <Box className="site-glass-stage">
      {(["blue", "orange", "turquoise"] as const).map((colour, index) => (
        <Box
          key={colour}
          className="site-blob"
          aria-hidden="true"
          style={{
            "--blob": `var(--semantics-category-fill-${colour})`,
            "--x": `${25 + index * 25}%`,
            "--y": `${40 + (index % 2) * 25}%`,
          }}
        />
      ))}
      <Surface variant="glass" className="site-glass-card">
        <Text weight="semibold">Glass</Text>
        <Text size="sm">
          What is behind shows through, blurred and saturated by the effect
          tokens.
        </Text>
      </Surface>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "Solid", Component: Solid },
  {
    title: "Glass",
    description:
      'variant="glass"; with transparency reduced it is the plain colour.',
    Component: Glass,
  },
];
