import { useState } from "react";
import { Backdrop, Box, Button, Text } from "@kozmos-ds/react";
import { Screen } from "../Screen";
import type { DemoModule } from "../types";

function OverTheScreen() {
  const [visible, setVisible] = useState(false);
  return (
    <Box className="site-demo-column">
      <Screen>
        <Backdrop visible={visible} aria-hidden="true" />
      </Screen>
      <Text size="sm" color="muted">
        The scrim covers the whole window and takes no placement from the page
        around it (GAP-34); it is what a dialog or a sheet sits on. The screen
        above is its window, so the scrim covers that page alone.
      </Text>
      <Box className="site-demo-row">
        <Button
          variant={visible ? "outline" : "default"}
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? "Clear the backdrop" : "Show the backdrop"}
        </Button>
      </Box>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Over the page",
    description: "visible mounts it; nothing renders otherwise.",
    Component: OverTheScreen,
    tall: true,
  },
];
