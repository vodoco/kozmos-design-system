import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  BrowseCategoriesPanel,
  Button,
  Input,
  POIDetailPanel,
  POIResultList,
  SearchBar,
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
    /** Give the sheet a panel header: a search field and two buttons. */
    showPanelHeader: () => void;
    /** Swap the panel for a list of results, with this one selected. */
    showResults: (selectedPoiId?: string) => void;
    /**
     * Swap the panel for a place's details, hosted as a product hosts them:
     * the card alone, with its close button, in this presentation.
     */
    showDetails: (presentation: "sheet" | "panel") => void;
    /**
     * Swap the panel for the category browser, hosted as a product hosts it:
     * the whole of the panel's content, with its own search row — a field
     * and a button — or, with `search: false`, the tiles alone.
     */
    showBrowse: (options?: { search?: boolean }) => void;
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

// Taller than the collapsed detent's fifth of the shell, so a sheet that
// ignored it would cut it off.
function PanelHeader() {
  return (
    <Stack gap={2}>
      <Input aria-label="Search this sheet" />
      <Button>Filters</Button>
      <Button>Sort</Button>
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

// Eight tiles: two rows of four, as a venue's quick access has them.
const categories = [
  "Gates",
  "Check-in",
  "Security",
  "Dining",
  "Shopping",
  "Toilets",
  "Parking",
  "Help",
].map((label) => ({
  id: label.toLowerCase(),
  label,
  selected: false,
}));

function Host() {
  const [options, setOptions] = useState(window.adaptiveOptions ?? {});
  const [header, setHeader] = useState(false);
  const [shownResults, setShownResults] = useState<{
    selectedPoiId?: string;
  } | null>(null);
  const [details, setDetails] = useState<"sheet" | "panel" | null>(null);
  const [browse, setBrowse] = useState<{ search: boolean } | null>(null);
  window.setAdaptiveOptions = setOptions;
  window.showPanelHeader = () => setHeader(true);
  window.showResults = (selectedPoiId) => setShownResults({ selectedPoiId });
  window.showDetails = (presentation) => setDetails(presentation);
  window.showBrowse = (browseOptions) =>
    setBrowse({ search: browseOptions?.search ?? true });
  return (
    <AdaptiveMapShell
      style={{ height: "100%" }}
      map={<MapSlot />}
      panel={
        browse ? (
          <BrowseCategoriesPanel
            categories={categories}
            onSelect={() => undefined}
            renderIcon={() => (
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="currentColor" />
              </svg>
            )}
            search={
              browse.search ? (
                <SearchBar aria-label="Search places" placeholder="Search" />
              ) : undefined
            }
            actions={
              browse.search ? (
                <Button variant="outline">Saved</Button>
              ) : undefined
            }
          />
        ) : details ? (
          <POIDetailPanel
            poi={{
              id: "harbour-coffee",
              name: "Harbour Coffee Co.",
              floorId: "2",
              floorLabel: "Level 2",
              media: [],
              services: [],
              actions: ["favourite", "bookmark"],
            }}
            actionLabels={{ favourite: "Favourite", bookmark: "Save" }}
            presentation={details}
            onClose={() => setDetails(null)}
          />
        ) : shownResults ? (
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
      panelHeader={header ? <PanelHeader /> : undefined}
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
