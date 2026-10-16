// Spike only, not part of @kozmos-ds/react: the Pointr Web SDK's map as a
// React component for AdaptiveMapShell's `map` slot, with the SDK's own UI
// switched off so Kozmos's parts carry the interface.
import * as React from "react";
import {
  POINTR_SDK_VERSION,
  POINTR_UI_OFF,
  loadPointrSdk,
  type PointrBuilding,
  type PointrMapLibreMap,
  type PointrMapView,
  type PointrMapWidget,
  type PointrPoi,
  type PointrSite,
} from "./pointr-sdk";

/** AdaptiveMapShell's onCollisionInsetsChange value. */
export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** What the SDK needs to start; supplied at run time, never in source. */
export interface PointrMapConfig {
  baseUrl: string;
  clientIdentifier: string;
  licenseKey: string;
  siteInternalIdentifier?: string;
  buildingInternalIdentifier?: string;
  levelIndex?: number;
  language?: string;
}

export interface PointrMapReady {
  widget: PointrMapWidget;
  view: PointrMapView;
  map: PointrMapLibreMap;
}

export interface PointrMapProps {
  config: PointrMapConfig;
  sdkVersion?: string;
  /** The shell's insets, given to MapLibre as camera padding. */
  padding?: MapInsets;
  /**
   * Hides the SDK chrome no Options switch turns off and Kozmos draws
   * itself: the level selector, the building's Exit button and the info
   * button. Never the watermark: the SDK watches it and removes the map when
   * it is hidden.
   */
  hideResidualChrome?: boolean;
  /**
   * Counts one SDK session in localStorage so the Cloud's onboarding card,
   * shown in a first session only, stays closed.
   */
  skipOnboarding?: boolean;
  onReady?: (ready: PointrMapReady) => void;
  onPoiClick?: (poi: PointrPoi) => void;
  onLevelChange?: (levelIndex: number) => void;
  onBuildingChange?: (building: PointrBuilding | undefined) => void;
  onSiteChange?: (site: PointrSite | undefined) => void;
  onError?: (error: Error) => void;
}

// MapWidget empties and fills an element by id, and its views find their
// own parts by fixed ids (#pointr-levels, #pointr-search…): one map a page.
const CONTAINER_ID = "pointr-map";

const residualChromeCss = `
#${CONTAINER_ID} #pointr-levels,
#${CONTAINER_ID} #pointr-exit-button,
#${CONTAINER_ID} #pointr-info-button { display: none !important; }
`;

function teardown(widget: PointrMapWidget | undefined) {
  // A destroyed widget has no options left and throws on a second destroy.
  if (!widget || window.PointrWebSDK?.MapWidget.getInstance() !== widget)
    return;
  // destroy() empties the container and clears the singleton but leaves the
  // MapLibre map, its WebGL context and its listeners alive: remove it first.
  try {
    const controller = widget.getUiController()?.getMapViewController() as
      | ({ destroyMap(): void; building3DModelsActive?: boolean } & object)
      | undefined;
    // Removing the map loses the 3D buildings' WebGL context, and the SDK's
    // fallback then reaches for a view destroy() has cleared: an uncaught
    // TypeError on every unmount (measured). Its guard is this flag.
    if (controller) controller.building3DModelsActive = false;
    controller?.destroyMap();
  } catch {
    /* the map may not exist yet */
  }
  widget.destroy();
}

export function PointrMap({
  config,
  sdkVersion = POINTR_SDK_VERSION,
  padding,
  hideResidualChrome = true,
  skipOnboarding = true,
  onReady,
  onPoiClick,
  onLevelChange,
  onBuildingChange,
  onSiteChange,
  onError,
}: PointrMapProps) {
  const callbacks = React.useRef({
    onReady,
    onPoiClick,
    onLevelChange,
    onBuildingChange,
    onSiteChange,
    onError,
  });
  callbacks.current = {
    onReady,
    onPoiClick,
    onLevelChange,
    onBuildingChange,
    onSiteChange,
    onError,
  };
  const [map, setMap] = React.useState<PointrMapLibreMap>();
  const configKey = JSON.stringify(config);

  React.useEffect(() => {
    let cancelled = false;
    let widget: PointrMapWidget | undefined;
    let poll: number | undefined;
    loadPointrSdk(sdkVersion)
      .then((sdk) => {
        if (cancelled) return;
        // A widget left by another mount (StrictMode, a story switch) holds
        // the singleton: the constructor throws while one exists.
        teardown(sdk.MapWidget.getInstance());
        if (skipOnboarding) {
          try {
            if (!Number(localStorage.getItem("sessionCount")))
              localStorage.setItem("sessionCount", "1");
          } catch {
            /* storage blocked: the card shows once */
          }
        }
        const parsed = JSON.parse(configKey) as PointrMapConfig;
        const options = new sdk.Options({
          container: CONTAINER_ID,
          mapMaxZoom: 21,
          ...POINTR_UI_OFF,
          ...parsed,
        });
        widget = new sdk.MapWidget(options);
        widget.start();
        const current = widget;
        const attach = () => {
          if (cancelled) return;
          const view = current
            .getUiController()
            ?.getMapViewController()
            ?.getView();
          if (!view) {
            poll = window.setTimeout(attach, 50);
            return;
          }
          const ready = () => {
            if (cancelled || !view.map) return;
            setMap(view.map);
            callbacks.current.onReady?.({
              widget: current,
              view,
              map: view.map,
            });
          };
          view.on(view.events.mapReady ?? "map-ready", ready);
          if (view.isMapReadyEmitted) ready();
          view.on(view.events.poiClicked ?? "poi-clicked", (detail) => {
            const poi = (detail as { poi?: PointrPoi } | undefined)?.poi;
            if (poi) callbacks.current.onPoiClick?.(poi);
          });
          view.on(view.events.levelChanged ?? "level-changed", (index) =>
            callbacks.current.onLevelChange?.(index as number),
          );
          view.on(
            view.events.currentBuildingChanged ?? "current-building-changed",
            (detail) =>
              callbacks.current.onBuildingChange?.(
                (detail as { newCurrentBuilding?: PointrBuilding })
                  ?.newCurrentBuilding,
              ),
          );
          view.on(
            view.events.currentSiteChanged ?? "current-site-changed",
            (detail) =>
              callbacks.current.onSiteChange?.(
                (detail as { newSite?: PointrSite })?.newSite,
              ),
          );
        };
        attach();
      })
      .catch((error: Error) => {
        if (!cancelled) callbacks.current.onError?.(error);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(poll);
      setMap(undefined);
      teardown(widget);
    };
  }, [configKey, sdkVersion, skipOnboarding]);

  const top = padding?.top ?? 0;
  const right = padding?.right ?? 0;
  const bottom = padding?.bottom ?? 0;
  const left = padding?.left ?? 0;
  React.useEffect(() => {
    if (!map) return;
    const wanted = { top, right, bottom, left };
    const apply = () => {
      const now = map.getPadding();
      if (
        now.top !== top ||
        now.right !== right ||
        now.bottom !== bottom ||
        now.left !== left
      )
        map.setPadding(wanted);
    };
    apply();
    // The SDK sets its own padding as it goes — a POI click resets it to 0
    // (measured) — so the shell's insets are put back once the camera rests.
    map.on("idle", apply);
    return () => map.off("idle", apply);
  }, [map, top, right, bottom, left]);

  return (
    // The SDK's own layers stack at z-index 9999–10000: isolate them so
    // they stay under the shell's panel and controls.
    <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>
      {hideResidualChrome && <style>{residualChromeCss}</style>}
      <div
        id={CONTAINER_ID}
        style={{ position: "absolute", inset: 0 }}
        data-pointr-sdk={sdkVersion}
      />
    </div>
  );
}
