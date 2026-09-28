import { useState } from "react";
import { Box, POIResultList, Text } from "@kozmos-ds/react";
import { results } from "../sample-data";
import type { DemoModule } from "../types";

function Results() {
  const [selected, setSelected] = useState<string>("bookshop");
  return (
    <Box className="site-demo-column">
      <POIResultList
        label="Places"
        resultCountLabel="3 places"
        items={results}
        currentFloorId="1"
        selectedPoiId={selected}
        onSelect={setSelected}
        featuredLabel="Featured"
      />
    </Box>
  );
}

function Empty() {
  return (
    <Box className="site-demo-column">
      <POIResultList
        label="Results for “piano”"
        resultCountLabel="No places"
        items={[]}
        onSelect={() => {}}
        emptyState={
          <Text color="muted">
            No places match. Try another word, or browse by category.
          </Text>
        }
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Three results",
    description:
      "A list of POIResultCards; label names the list, resultCountLabel is announced, selectedPoiId marks one.",
    Component: Results,
  },
  { title: "Nothing found", Component: Empty },
];
