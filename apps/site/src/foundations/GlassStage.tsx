import { useState } from "react";
import {
  Box,
  DesignConfigProvider,
  Stack,
  Surface,
  Switch,
  Text,
} from "@kozmos-ds/react";

const blobs = [
  { colour: "blue", x: "22%", y: "35%" },
  { colour: "orange", x: "70%", y: "30%" },
  { colour: "turquoise", x: "45%", y: "75%" },
  { colour: "pink", x: "85%", y: "70%" },
];

/** Glass over the category colours, with the transparency preference to hand. */
export function GlassStage() {
  const [reduce, setReduce] = useState(false);
  return (
    <Stack gap={3}>
      <Switch
        label="Reduce transparency"
        checked={reduce}
        onCheckedChange={setReduce}
      />
      <DesignConfigProvider
        config={{ accessibility: { reduceTransparency: reduce } }}
      >
        <Box className="site-glass-stage">
          {blobs.map((blob) => (
            <Box
              key={blob.colour}
              className="site-blob"
              aria-hidden="true"
              style={{
                "--blob": `var(--semantics-category-fill-${blob.colour})`,
                "--x": blob.x,
                "--y": blob.y,
              }}
            />
          ))}
          <Surface variant="glass" className="site-glass-card">
            <Text weight="semibold">Glass</Text>
            <Text size="sm">
              The theme’s glass colour at the token’s opacity, what shows
              through blurred and saturated by the token’s numbers, and an edge.
            </Text>
          </Surface>
        </Box>
      </DesignConfigProvider>
    </Stack>
  );
}
