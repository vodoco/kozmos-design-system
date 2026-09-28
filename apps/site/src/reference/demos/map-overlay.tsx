import { useState } from "react";
import {
  Box,
  FloorSelector,
  MapControlsGroup,
  MapOverlay,
  MapView,
  SaveLocationCard,
  SearchBar,
} from "@kozmos-ds/react";
import { floors } from "../sample-data";
import type { DemoModule } from "../types";

function Corners() {
  const [query, setQuery] = useState("");
  const [floorId, setFloorId] = useState("1");
  return (
    <Box className="site-demo-map">
      <MapView mapLabel="Illustrative map">
        <MapOverlay position="top-left" width="md">
          <SearchBar
            variant="floating"
            aria-label="Search the centre"
            placeholder="Search the centre"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
        </MapOverlay>
        <MapOverlay position="top-right">
          <FloorSelector
            label="Floor"
            floors={floors}
            selectedFloor={floorId}
            onFloorSelect={setFloorId}
          />
        </MapOverlay>
        <MapOverlay position="bottom-right">
          <MapControlsGroup
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onMyLocation={() => {}}
            locationLabel="Show my location"
          />
        </MapOverlay>
        <MapOverlay position="bottom-left" width="sm">
          <SaveLocationCard
            onSaveToggle={() => {}}
            onRouteToLocation={() => {}}
          />
        </MapOverlay>
      </MapView>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Four corners of a map",
    description:
      "Each overlay is pinned to a position over the map and lets pointer events through around its content; width sizes it. AdaptiveMapShell places these for you.",
    Component: Corners,
    tall: true,
  },
];
