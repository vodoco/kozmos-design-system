// Spike only. Loaded by Storybook only when KOZMOS_SPIKES=1 (see
// .storybook/main.ts), so the visual review and the catalogue never see a
// story that needs the network and Pointr identifiers.
//
// The identifiers come from window.__POINTR_SPIKE__ (the spike's Playwright
// driver sets it) or from the form the story shows, kept in this tab's
// sessionStorage only.
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  AdaptiveMapShell,
  Button,
  FloorSelector,
  Input,
  LocationPin,
  MapControlsGroup,
  POIResultList,
  SearchBar,
  type POIResultListItem,
} from "@kozmos-ds/react";
import {
  PointrMap,
  type MapInsets,
  type PointrMapConfig,
  type PointrMapReady,
} from "./PointrMap";
import type { PointrBuilding, PointrPoi, PointrSite } from "./pointr-sdk";

const storageKey = "kozmos-pointr-spike";

declare global {
  interface Window {
    __POINTR_SPIKE__?: Partial<PointrMapConfig> & Record<string, unknown>;
    __pointrStory?: {
      ready?: PointrMapReady;
      insets?: MapInsets;
      events: string[];
    };
  }
}

function readConfig(): PointrMapConfig | undefined {
  const given = window.__POINTR_SPIKE__;
  let stored: Partial<PointrMapConfig> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
  } catch {
    /* storage blocked */
  }
  const merged = { ...stored, ...given };
  if (!merged.baseUrl || !merged.clientIdentifier || !merged.licenseKey)
    return undefined;
  // Options refuses a building without its site: both or neither.
  const both =
    merged.siteInternalIdentifier && merged.buildingInternalIdentifier;
  return {
    baseUrl: String(merged.baseUrl),
    clientIdentifier: String(merged.clientIdentifier),
    licenseKey: String(merged.licenseKey),
    ...(both
      ? {
          siteInternalIdentifier: String(merged.siteInternalIdentifier),
          buildingInternalIdentifier: String(merged.buildingInternalIdentifier),
        }
      : {}),
  };
}

function KeysForm({ onSubmit }: { onSubmit: (c: PointrMapConfig) => void }) {
  const [baseUrl, setBaseUrl] = React.useState("");
  const [clientIdentifier, setClient] = React.useState("");
  const [licenseKey, setLicense] = React.useState("");
  return (
    <form
      className="flex max-w-md flex-col gap-3 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const config = { baseUrl, clientIdentifier, licenseKey };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(config));
        } catch {
          /* storage blocked: this render only */
        }
        onSubmit(config);
      }}
    >
      <p className="text-sm text-muted-foreground">
        The Pointr identifiers are read at run time and kept in this tab only.
      </p>
      <Input
        aria-label="Base URL"
        placeholder="Base URL"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
      />
      <Input
        aria-label="Client identifier"
        placeholder="Client identifier"
        value={clientIdentifier}
        onChange={(e) => setClient(e.target.value)}
      />
      <Input
        aria-label="License key"
        placeholder="License key"
        type="password"
        value={licenseKey}
        onChange={(e) => setLicense(e.target.value)}
      />
      <Button type="submit">Start the map</Button>
    </form>
  );
}

/** What the spike reads off a Pointr POI; the SDK ships no typings. */
function poiInfo(poi: PointrPoi) {
  const raw = poi as PointrPoi & Record<string, unknown>;
  const props = (raw._properties ?? raw.properties ?? {}) as Record<
    string,
    unknown
  >;
  const geometry = (raw._geometry ?? raw.geometry) as
    | { type: string; coordinates: unknown }
    | undefined;
  let point: [number, number] | undefined;
  if (geometry?.type === "Point")
    point = geometry.coordinates as [number, number];
  else if (geometry?.type === "Polygon") {
    const ring = (geometry.coordinates as [number, number][][])[0] ?? [];
    const sum = ring.reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
    point = ring.length
      ? [sum[0] / ring.length, sum[1] / ring.length]
      : undefined;
  }
  return {
    id: String(props.fid ?? raw.identifier ?? props.name ?? ""),
    name: String(props.name ?? "Unnamed place"),
    level: props.lvl !== undefined ? Number(props.lvl) : undefined,
    point,
  };
}

function PinOverlay({
  map,
  point,
  label,
}: {
  map?: PointrMapReady["map"];
  point?: [number, number];
  label: string;
}) {
  const [xy, setXy] = React.useState<{ x: number; y: number }>();
  React.useEffect(() => {
    if (!map || !point) {
      setXy(undefined);
      return;
    }
    const update = () => setXy(map.project(point));
    update();
    map.on("move", update);
    return () => map.off("move", update);
  }, [map, point]);
  if (!xy) return null;
  return (
    <div
      data-testid="kozmos-pin"
      style={{
        position: "absolute",
        left: xy.x,
        top: xy.y,
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <LocationPin label={label} selected variant="primary" />
    </div>
  );
}

function PointrInKozmos({
  panelPresentation,
}: {
  panelPresentation?: "bottom" | "side";
}) {
  const [config, setConfig] = React.useState(readConfig);
  const [ready, setReady] = React.useState<PointrMapReady>();
  const [insets, setInsets] = React.useState<MapInsets>();
  const [building, setBuilding] = React.useState<PointrBuilding>();
  const [site, setSite] = React.useState<PointrSite>();
  const [levelIndex, setLevelIndex] = React.useState<number>();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PointrPoi[]>([]);
  const [selected, setSelected] = React.useState<PointrPoi>();
  const log = React.useCallback((line: string) => {
    window.__pointrStory = window.__pointrStory ?? { events: [] };
    window.__pointrStory.events.push(line);
  }, []);

  React.useEffect(() => {
    window.__pointrStory = {
      ...(window.__pointrStory ?? { events: [] }),
      ready,
      insets,
    };
  }, [ready, insets]);

  // A building named without its site opens once the map is ready.
  React.useEffect(() => {
    if (!ready || config?.buildingInternalIdentifier) return;
    const sbm = ready.widget.getSiteBuildingManager();
    const wanted = window.__POINTR_SPIKE__?.buildingInternalIdentifier as
      | string
      | undefined;
    const target = wanted
      ? sbm.getBuildingWithInternalIdentifier(wanted)
      : undefined;
    if (target) ready.widget.focusMap(target);
  }, [ready, config]);

  React.useEffect(() => {
    // Search the building when one is open, else the site last shown.
    if (!ready || !(building || site) || !query.trim()) {
      setResults([]);
      return;
    }
    let stale = false;
    ready.widget
      .search(query, site, building)
      .then((found) => {
        if (stale) return;
        const list = Array.isArray(found) ? found : Object.values(found ?? {});
        setResults(list.slice(0, 20));
      })
      .catch((error: Error) => log(`search failed ${error.message}`));
    return () => {
      stale = true;
    };
  }, [ready, building, site, query, log]);

  if (!config) return <KeysForm onSubmit={(next) => setConfig(next)} />;

  const levels = [...(building?.levels ?? [])].sort(
    (a, b) => b.levelIndex - a.levelIndex,
  );
  const floors = levels.map((l) => ({
    id: String(l.levelIndex),
    label: l.levelLongTitle ?? l.title ?? `Level ${l.levelIndex}`,
    shortLabel: l.levelShortTitle ?? String(l.levelIndex),
  }));
  const items: POIResultListItem[] = results.map((poi, index) => {
    const info = poiInfo(poi);
    return {
      poi: {
        id: info.id || `poi-${index}`,
        name: info.name,
        floorId: info.level !== undefined ? String(info.level) : undefined,
        floorLabel:
          info.level !== undefined
            ? (floors.find((f) => f.id === String(info.level))?.label ??
              `Level ${info.level}`)
            : undefined,
        media: [],
        actions: [],
      },
      result: {
        poiId: info.id || `poi-${index}`,
        resultIndex: index + 1,
        selected: selected ? poiInfo(selected).id === info.id : false,
        featured: false,
        floorId: info.level !== undefined ? String(info.level) : undefined,
      },
    };
  });
  const selectedInfo = selected ? poiInfo(selected) : undefined;

  // setLevel takes the SDK's own Level instances: the levels in a
  // current-building-changed payload are plain objects, and refused.
  const levelFor = (index: number) => {
    if (!ready) return undefined;
    const id = building?.buildingInternalIdentifier;
    const live =
      ready.widget.getCurrentBuilding() ??
      (id
        ? ready.widget
            .getSiteBuildingManager()
            .getBuildingWithInternalIdentifier(id)
        : undefined);
    return live?.levels?.find((l) => l.levelIndex === index);
  };

  const select = (poi: PointrPoi) => {
    setSelected(poi);
    const info = poiInfo(poi);
    // Kozmos draws the pin: take the SDK's own highlight off.
    ready?.widget.unhighlight();
    if (info.level !== undefined && info.level !== levelIndex) {
      const level = levelFor(info.level);
      if (level) ready?.widget.setLevel(level);
    }
    if (info.point)
      ready?.map.flyTo({ center: info.point, zoom: 19.5, padding: insets });
  };

  return (
    <AdaptiveMapShell
      style={{ height: "100vh" }}
      mapLabel="Map"
      panelLabel="Places"
      panelPresentation={panelPresentation}
      onCollisionInsetsChange={setInsets}
      map={
        <>
          <PointrMap
            config={config}
            padding={insets}
            onReady={(next) => {
              log("ready");
              setReady(next);
            }}
            onPoiClick={(poi) => {
              log(`poi-clicked ${poiInfo(poi).name}`);
              select(poi);
            }}
            onLevelChange={(index) => {
              log(`level-changed ${index}`);
              setLevelIndex(index);
            }}
            onBuildingChange={(next) => {
              log(`building-changed ${next?.buildingTitle ?? "none"}`);
              setBuilding(next);
            }}
            onSiteChange={(next) => {
              log(`site-changed ${next?.siteTitle ?? "none"}`);
              if (next) setSite(next);
            }}
            onError={(error) => log(`error ${error.message}`)}
          />
          {selectedInfo && selectedInfo.level === levelIndex && (
            <PinOverlay
              map={ready?.map}
              point={selectedInfo.point}
              label={selectedInfo.name}
            />
          )}
        </>
      }
      panelHeader={
        <div className="px-4 pb-2">
          <SearchBar
            aria-label="Search places"
            placeholder={
              building
                ? `Search ${building.buildingTitle ?? "the building"}`
                : site
                  ? `Search ${site.siteTitle ?? "the site"}`
                  : "Search"
            }
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
        </div>
      }
      panel={
        <div className="px-4 pb-4" data-testid="kozmos-panel">
          {selectedInfo ? (
            <div className="flex flex-col gap-3 py-2">
              <h2 className="text-lg font-semibold" data-testid="selected-name">
                {selectedInfo.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedInfo.level !== undefined
                  ? (floors.find((f) => f.id === String(selectedInfo.level))
                      ?.label ?? `Level ${selectedInfo.level}`)
                  : "No level"}
              </p>
              <Button variant="outline" onClick={() => setSelected(undefined)}>
                Back to results
              </Button>
            </div>
          ) : items.length ? (
            <POIResultList
              items={items}
              resultCountLabel={`${items.length} results`}
              onSelect={(id) => {
                const poi = results.find((p) => poiInfo(p).id === id);
                if (poi) select(poi);
              }}
            />
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              {building || site
                ? "Type to search, or tap a place on the map."
                : "Loading Pointr's map…"}
            </p>
          )}
        </div>
      }
      controlsBottomEnd={
        <div className="flex flex-col items-end gap-4">
          {floors.length > 1 && levelIndex !== undefined && (
            <FloorSelector
              floors={floors}
              selectedFloor={String(levelIndex)}
              variant="compact-stepper"
              onFloorSelect={(id) => {
                const level = levelFor(Number(id));
                if (level) ready?.widget.setLevel(level);
              }}
            />
          )}
          <MapControlsGroup
            onZoomIn={() => ready?.map.zoomIn()}
            onZoomOut={() => ready?.map.zoomOut()}
          />
        </div>
      }
    />
  );
}

const meta = {
  title: "Spikes/Pointr map in AdaptiveMapShell",
  component: PointrInKozmos,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PointrInKozmos>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SidePanel: Story = { args: { panelPresentation: "side" } };
export const BottomSheet: Story = { args: { panelPresentation: "bottom" } };
/** Mounted, unmounted and mounted again at once, as React's StrictMode does. */
export const StrictMode: Story = {
  args: { panelPresentation: "side" },
  render: (args) => (
    <React.StrictMode>
      <PointrInKozmos {...args} />
    </React.StrictMode>
  ),
};
