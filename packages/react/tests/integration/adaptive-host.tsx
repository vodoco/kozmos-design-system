import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  Button,
  Input,
  POIDetailPanel,
  Stack,
} from "@kozmos-ds/react";
import type {
  AdaptiveMapShellProps,
  AdaptiveMapLayoutSnapshot,
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

function Host() {
  const [options, setOptions] = useState(window.adaptiveOptions ?? {});
  const [header, setHeader] = useState(false);
  window.setAdaptiveOptions = setOptions;
  window.showPanelHeader = () => setHeader(true);
  return (
    <AdaptiveMapShell
      style={{ height: "100%" }}
      map={<MapSlot />}
      panel={<Panel />}
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
