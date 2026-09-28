import { useState } from "react";
import {
  AdaptiveMapShell,
  Box,
  FloorSelector,
  LocationPin,
  MapControlsGroup,
  MapView,
  POIResultList,
  SearchBar,
  Text,
} from "@kozmos-ds/react";
import { categoryTints, floors, results, tint } from "../sample-data";
import type { DemoModule } from "../types";

const positions: Record<string, { x: number; y: number }> = {
  bookshop: { x: 38, y: 42 },
  "info-desk": { x: 58, y: 60 },
  bus: { x: 72, y: 32 },
};

/**
 * One venue per demo. Three shells share the page, so every landmark each one
 * names (the map region, the panel) carries the demo's name to stay unique.
 */
function useVenue(variant: string) {
  const [floorId, setFloorId] = useState("1");
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState("");
  const floorLabel = floors.find((floor) => floor.id === floorId)?.label;
  const map = (
    <MapView
      mapLabel={`Riverside Centre, ${floorLabel}. Illustrative map, ${variant}`}
    >
      <Box className="site-demo-layer">
        {results
          .filter(({ poi }) => poi.floorId === floorId)
          .map(({ poi, result }) => (
            <Box
              key={poi.id}
              className="site-demo-pin"
              style={{
                "--pin-x": `${positions[poi.id].x}%`,
                "--pin-y": `${positions[poi.id].y}%`,
              }}
            >
              <LocationPin
                label={`${poi.name}, ${poi.floorLabel}`}
                number={result.resultIndex}
                selected={poi.id === selectedId}
                tint={tint(categoryTints[poi.categoryId ?? ""])}
                onClick={() => setSelectedId(poi.id)}
              />
            </Box>
          ))}
      </Box>
    </MapView>
  );
  const topBar = (
    <SearchBar
      variant="floating"
      aria-label={`Search Riverside Centre, ${variant}`}
      placeholder="Search Riverside Centre"
      value={query}
      onChange={setQuery}
      onClear={() => setQuery("")}
    />
  );
  const controls = (
    <Box className="site-demo-controls">
      <FloorSelector
        label={`Floor, ${variant}`}
        floors={floors}
        selectedFloor={floorId}
        onFloorSelect={setFloorId}
      />
      <MapControlsGroup
        label={`Map controls, ${variant}`}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onMyLocation={() => {}}
        locationLabel="Show my location"
      />
    </Box>
  );
  const panel = (
    <Box className="site-demo-panel">
      <POIResultList
        label={`Places, ${variant}`}
        resultCountLabel="3 places"
        items={results}
        currentFloorId={floorId}
        selectedPoiId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          const place = results.find(({ poi }) => poi.id === id);
          // A place need not be on a floor (contracts: no levels, no floor).
          if (place?.poi.floorId) setFloorId(place.poi.floorId);
        }}
      />
    </Box>
  );
  return {
    map,
    topBar,
    controls,
    panel,
    mapLabel: `Map area, ${variant}`,
    panelLabel: `Places, ${variant}`,
  };
}

function Auto() {
  const venue = useVenue("auto layout");
  return (
    <Box className="site-demo-shell">
      <AdaptiveMapShell
        mapLabel={venue.mapLabel}
        map={venue.map}
        topBar={venue.topBar}
        controls={venue.controls}
        panel={venue.panel}
        panelLabel={venue.panelLabel}
      />
    </Box>
  );
}

function SideOnGlass() {
  const venue = useVenue("side panel");
  return (
    <Box className="site-demo-shell">
      <AdaptiveMapShell
        mapLabel={venue.mapLabel}
        map={venue.map}
        topBar={venue.topBar}
        controls={venue.controls}
        panel={venue.panel}
        panelLabel={venue.panelLabel}
        panelPresentation="side"
        panelPlacement="start"
        panelSurface="glass"
      />
    </Box>
  );
}

function Offline() {
  const venue = useVenue("offline");
  return (
    <Box className="site-demo-shell">
      <AdaptiveMapShell
        mapLabel={venue.mapLabel}
        map={venue.map}
        topBar={venue.topBar}
        controls={venue.controls}
        mapStatus="offline"
        mapStatusContent={
          <Text>
            The map needs a connection. Search and the list still work.
          </Text>
        }
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Map, top bar, controls, panel",
    description:
      "The shell places four slots and keeps them clear of one another. Narrow, the panel is a bottom sheet with detents; wide, a side panel. Resize the window to watch it switch.",
    Component: Auto,
    tall: true,
  },
  {
    title: "A side panel at the start, on glass",
    Component: SideOnGlass,
    tall: true,
  },
  {
    title: "Offline",
    description:
      "mapStatus swaps the map for mapStatusContent; the other slots stay.",
    Component: Offline,
    tall: true,
  },
];
