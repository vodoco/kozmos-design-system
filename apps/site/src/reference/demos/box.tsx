import { Box, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Plain() {
  return (
    <Box className="site-demo-column">
      <Text size="sm">
        A Box is a div with nothing of its own: the element every layout
        primitive starts from, and the one a site puts its own layout classes
        on.
      </Text>
    </Box>
  );
}

function AsChild() {
  return (
    <Stack gap={2}>
      <Box asChild>
        <section aria-label="A section rendered through Box">
          <Text size="sm">
            With asChild, Box renders its child element instead of a div and
            merges its props onto it: this paragraph sits in a section.
          </Text>
        </section>
      </Box>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "A plain box", Component: Plain },
  {
    title: "asChild",
    description: "Renders the child element in place of the div.",
    Component: AsChild,
  },
];
