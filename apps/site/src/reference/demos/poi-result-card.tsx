import { useState } from "react";
import { Box, POIResultCard, Text } from "@kozmos-ds/react";
import { results } from "../sample-data";
import type { DemoModule } from "../types";

function Featured() {
  const [chosen, setChosen] = useState<string>();
  const first = results[0];
  return (
    <Box className="site-demo-column">
      <POIResultCard
        poi={first.poi}
        result={first.result}
        currentFloorId="1"
        featuredLabel="Featured"
        selectionLabel={`Open ${first.poi.name}`}
        onSelect={setChosen}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {chosen
          ? `Selected ${chosen}.`
          : "Featured, selected, with a travel estimate; the result’s index is the pin’s number."}
      </Text>
    </Box>
  );
}

function OnAnotherFloor() {
  const bus = results[2];
  return (
    <Box className="site-demo-column">
      <POIResultCard
        poi={bus.poi}
        result={{ ...bus.result, selected: false, featured: false }}
        currentFloorId="1"
        onSelect={() => {}}
      />
      <POIResultCard
        poi={bus.poi}
        result={{
          ...bus.result,
          selected: false,
          featured: false,
          available: false,
          unavailableReason: "Closed for maintenance",
        }}
        currentFloorId="g"
        onSelect={() => {}}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Featured and selected",
    description:
      "A POIPresentation and its POIResultPresentation from the contracts.",
    Component: Featured,
  },
  {
    title: "On another floor, and unavailable",
    description:
      "currentFloorId decides whether the floor prints; an unavailable result says why.",
    Component: OnAnotherFloor,
  },
];
