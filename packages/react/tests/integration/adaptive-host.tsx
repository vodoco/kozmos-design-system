import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  Button,
  Input,
  POIDetailPanel,
  POIResultList,
  Stack,
} from "@kozmos-ds/react";
import type {
  AdaptiveMapShellProps,
  AdaptiveMapLayoutSnapshot,
  POIResultListItem,
} from "@kozmos-ds/react";

declare global {
  interface Window {
    adaptiveOptions?: Partial<AdaptiveMapShellProps>;
    setAdaptiveOptions: (options: Partial<AdaptiveMapShellProps>) => void;
    adaptiveSnapshot: AdaptiveMapLayoutSnapshot;
    adaptiveNotifications: number;
    mapMounts: number;
    panelMounts: number;
    /** Swap the panel for a list of results, with this one selected. */
    showResults: (selectedPoiId?: string) => void;
  }
}

// An instrumented renderer slot, NOT a substitute map or a camera integration.
function MapSlot() {
  useEffect(() => {
    window.mapMounts = (window.mapMounts ?? 0) + 1;
  }, []);
  return <div>Map renderer slot</div>;
}

function Panel() {
  const [value, setValue] = useState("");
  const [favourite, setFavourite] = useState(false);
  useEffect(() => {
    window.panelMounts = (window.panelMounts ?? 0) + 1;
  }, []);
  return (
    <Stack gap={2}>
      <Input
        aria-label="Search places"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <POIDetailPanel
        poi={{
          id: "museum",
          name: "Museum",
          floorId: "1",
          floorLabel: "Level one",
          media: [],
          services: [],
          actions: ["favourite"],
          description: "A longer description of this place. ".repeat(80),
        }}
        actionLabels={{
          navigate: "Go",
          favourite: "Favourite",
          bookmark: "Save",
          share: "Share",
          order: "Order",
        }}
        actionStates={{ favourite: { pressed: favourite } }}
        onAction={() => setFavourite((value) => !value)}
      />
    </Stack>
  );
}

// Twelve results: far taller than the sheet at any detent but its largest.
const results: POIResultListItem[] = Array.from({ length: 12 }, (_, index) => ({
  poi: {
    id: `result-${index}`,
    name: `Result ${index + 1}`,
    floorId: "1",
    floorLabel: "Level one",
    media: [],
    actions: ["navigate"],
  },
  result: {
    poiId: `result-${index}`,
    resultIndex: index,
    selected: false,
    featured: false,
    floorId: "1",
    actions: [{ action: "navigate", label: "Go" }],
  },
}));

function Host() {
  const [options, setOptions] = useState(window.adaptiveOptions ?? {});
  const [shownResults, setShownResults] = useState<{
    selectedPoiId?: string;
  } | null>(null);
  window.setAdaptiveOptions = setOptions;
  window.showResults = (selectedPoiId) => setShownResults({ selectedPoiId });
  return (
    <AdaptiveMapShell
      style={{ height: "100%" }}
      map={<MapSlot />}
      panel={
        shownResults ? (
          <POIResultList
            items={results}
            onSelect={(poiId) => setShownResults({ selectedPoiId: poiId })}
            resultCountLabel="12 results"
            selectedPoiId={shownResults.selectedPoiId}
          />
        ) : (
          <Panel />
        )
      }
      panelPlacement="end"
      topBar={<Button style={{ width: "100%" }}>Search this floor</Button>}
      controls={<Button>Focus map</Button>}
      {...options}
      onLayoutChange={(layout) => {
        window.adaptiveSnapshot = layout;
        window.adaptiveNotifications = (window.adaptiveNotifications ?? 0) + 1;
        options.onLayoutChange?.(layout);
      }}
    />
  );
}
createRoot(document.getElementById("fixture")!).render(<Host />);
