import { useState } from "react";
import { Box, SplitButton, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Directions() {
  const [last, setLast] = useState("Nothing yet.");
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-row">
        <SplitButton
          onMainClick={() => setLast("Directions, the quickest way.")}
          menuItems={[
            {
              label: "Step-free route",
              onClick: () => setLast("Directions, step-free."),
            },
            {
              label: "Via the terrace",
              onClick: () => setLast("Directions via the terrace."),
            },
          ]}
        >
          Directions
        </SplitButton>
        <SplitButton
          variant="outline"
          size="sm"
          onMainClick={() => setLast("Saved.")}
          menuItems={[
            {
              label: "Save to a list",
              onClick: () => setLast("Saved to a list."),
            },
          ]}
        >
          Save
        </SplitButton>
      </Box>
      <Text size="sm" color="muted" aria-live="polite">
        {last}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A main action with alternatives",
    description:
      "The main part is a Button; the chevron opens a Menu of menuItems.",
    Component: Directions,
  },
];
