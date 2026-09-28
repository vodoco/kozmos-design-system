import { useState } from "react";
import { Box, RouteOptionCard, Text } from "@kozmos-ds/react";
import { routeOptions } from "../sample-data";
import type { DemoModule } from "../types";

function Options() {
  const [selected, setSelected] = useState("quickest");
  return (
    <Box className="site-demo-column">
      {routeOptions.map((option) => (
        <RouteOptionCard
          key={option.id}
          option={{ ...option, selected: option.id === selected }}
          onSelect={setSelected}
        />
      ))}
      <Text size="sm" color="muted" aria-live="polite">
        {routeOptions.find((option) => option.id === selected)?.label} is
        selected. The third option is unavailable and carries a warning.
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Quickest, step-free, custom",
    description:
      "A RouteOptionPresentation each; the icon follows the preference unless icon overrides it.",
    Component: Options,
  },
];
