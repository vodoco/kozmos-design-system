import { Box, FloatingActionButton, Icon, Text } from "@kozmos/react";
import { Screen } from "../Screen";
import type { DemoModule } from "../types";

function Inline() {
  return (
    <Box className="site-demo-row">
      <FloatingActionButton aria-label="Add a place">
        <Icon name="plus" />
      </FloatingActionButton>
      <FloatingActionButton aria-label="Report a problem" emotion="alert">
        <Icon name="alert-triangle" />
      </FloatingActionButton>
      <FloatingActionButton aria-label="Show my location" variant="outline">
        <Icon name="navigation-pointer-01" />
      </FloatingActionButton>
      <Text size="sm" color="muted">
        {'placement="inline"'} (the default) keeps it in the flow, beside
        whatever it belongs to.
      </Text>
    </Box>
  );
}

function Pinned() {
  return (
    <Box className="site-demo-column">
      <Screen>
        <FloatingActionButton aria-label="Add a place" placement="fixed">
          <Icon name="plus" />
        </FloatingActionButton>
      </Screen>
      <Text size="sm" color="muted">
        {'placement="fixed"'} pins it to the bottom right of the window, which
        is what a product wants and what the page around it cannot undo. The
        screen above is its window, so the button sits in the app’s corner
        rather than the browser’s.
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Inline",
    description:
      "A round Button with an icon; emotion and variant as on Button.",
    Component: Inline,
  },
  {
    title: "Pinned to the screen",
    description:
      'The same button with placement="fixed", in a screen that holds it: the placement FloatingActionButton offers and DynamicIsland, BottomNavigation, Backdrop and the toast viewport do not (GAP-24, 29, 34, 36).',
    Component: Pinned,
    tall: true,
  },
];
