import { useState } from "react";
import { Box, Rating, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Interactive() {
  const [value, setValue] = useState(3);
  return (
    <Box className="site-demo-column">
      <Rating value={value} onChange={setValue} aria-label="Your rating" />
      <Text size="sm" color="muted" aria-live="polite">
        {value} of 5
      </Text>
    </Box>
  );
}

function ReadOnly() {
  return (
    <Box className="site-demo-row">
      <Rating value={4} readOnly aria-label="Rated 4 of 5" />
      <Rating value={7} max={10} readOnly aria-label="Rated 7 of 10" />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Pick a rating",
    description: "Stars that are buttons; value and onChange control it.",
    Component: Interactive,
  },
  { title: "Read only, and out of ten", Component: ReadOnly },
];
