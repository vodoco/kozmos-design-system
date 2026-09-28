import { useState } from "react";
import { Box, MapOverlay, MapView, SearchBar, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Inline() {
  const [query, setQuery] = useState("");
  return (
    <Box className="site-demo-column">
      <SearchBar
        variant="inline"
        aria-label="Search places"
        placeholder="Search places"
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {query
          ? `Searching for “${query}”`
          : "Type to see the clear button appear."}
      </Text>
    </Box>
  );
}

function FloatingOverAMap() {
  const [query, setQuery] = useState("Gate B12");
  return (
    <Box className="site-demo-map">
      <MapView mapLabel="Illustrative map">
        <MapOverlay position="top-left" width="md">
          <SearchBar
            variant="floating"
            aria-label="Search the terminal"
            placeholder="Search the terminal"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
        </MapOverlay>
      </MapView>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Inline",
    description:
      "The map product’s search field: a search glyph, a clear button in a 44px target once there is text. In WebKit the field is unstyled (GAP-20).",
    Component: Inline,
  },
  {
    title: "Floating over a map",
    description:
      'variant="floating" for a MapOverlay: full width, on the floating elevation.',
    Component: FloatingOverAMap,
    tall: true,
  },
];
