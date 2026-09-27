import { useState } from "react";
import { Box, Icon, Text, ToggleButton } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Favourite() {
  const [pressed, setPressed] = useState(false);
  return (
    <Box className="site-demo-row">
      <ToggleButton
        aria-label="Favourite"
        pressed={pressed}
        onPressedChange={setPressed}
      >
        <Icon name="heart" size="sm" />
      </ToggleButton>
      <ToggleButton variant="outline" defaultPressed>
        <Icon name="check" size="sm" />
        Step-free
      </ToggleButton>
      <ToggleButton variant="outline" size="sm">
        Small
      </ToggleButton>
      <ToggleButton variant="outline" size="lg">
        Large
      </ToggleButton>
      <Text size="sm" color="muted" aria-live="polite">
        {pressed ? "Favourited." : "Not a favourite."}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Pressed or not",
    description:
      "A button with aria-pressed: pressed and onPressedChange control it, defaultPressed starts it.",
    Component: Favourite,
  },
];
