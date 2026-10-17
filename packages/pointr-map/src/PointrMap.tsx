import * as React from "react";
import { MapView, type MapViewVariant } from "@kozmos-ds/react";
import type {
  FloorPresentation,
  MapCollisionInsets,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import type { PointrMapConfig } from "./config";
import type {
  PointrBuildingPresentation,
  PointrPoiItem,
  PointrSearchResponse,
  PointrSitePresentation,
} from "./convert";
import { PointrMapError } from "./errors";
import { RESIDUAL_CHROME_CSS, type PointrMapLibreMap } from "./sdk";
import { POINTR_SDK_VERSION } from "./sdk-versions";
import {
  PointrMapSession,
  type FlyToPoiOptions,
  type SearchOptions,
} from "./session";

export interface PointrMapProps {
  /** Read at run time; never in source. A change to any of it starts the map again. */
  config: PointrMapConfig;
  /**
   * The shell's collision insets (`AdaptiveMapShell`'s
   * `onCollisionInsetsChange`), kept as the camera's padding so what the
   * map centres stays clear of the panel and the controls.
   */
  padding?: MapCollisionInsets;
  /** The map surface's accessible name, already localized. */
  mapLabel?: string;
  /** `fill` (the default) inside AdaptiveMapShell's `map` slot; `framed` in page flow. */
  variant?: MapViewVariant;
  className?: string;
  style?: React.CSSProperties;
  /** How long the map may take to become ready before it is a `data` error; 60 s by default. */
  readyTimeoutMs?: number;
  /** The map is drawn: `map` is the MapLibre map, for `project` and the camera. */
  onReady?: (map: PointrMapLibreMap) => void;
  /** For AdaptiveMapShell's `mapStatus`: `loading`, `ready`, or what an error means. */
  onStatusChange?: (status: MapReadiness, error?: PointrMapError) => void;
  /** Every failure, fatal or not. */
  onError?: (error: PointrMapError) => void;
  /** A POI was clicked on the map. The SDK's own highlight is taken off: Kozmos draws the selection. */
  onPoiSelect?: (item: PointrPoiItem) => void;
  onLevelChange?: (
    floor: FloorPresentation,
    building?: PointrBuildingPresentation,
  ) => void;
  /** The building the map is in; undefined when it leaves every building. */
  onBuildingChange?: (building?: PointrBuildingPresentation) => void;
  onSiteChange?: (site?: PointrSitePresentation) => void;
}

/** What a ref to PointrMap offers. Each call is safe before the map is ready. */
export interface PointrMapHandle {
  /** The MapLibre map, once it is drawn. */
  map(): PointrMapLibreMap | undefined;
  /**
   * Flies to a POI the map has reported (a click or a search), changing level
   * first when it is on another, and keeping the shell's padding. False when
   * the POI is unknown or the map is not ready.
   */
  flyToPoi(id: string, options?: FlyToPoiOptions): boolean;
  /** Changes level by its index, or a FloorPresentation's id. False when the open building has no such level. */
  setLevel(level: number | string): boolean;
  /** Searches the open building (or the site), numbered from 1. Rejects with a PointrMapError before the map is ready. */
  search(query: string, options?: SearchOptions): Promise<PointrSearchResponse>;
}

// The latest props, kept before any effect reads them; a plain effect on the
// server, where there is no layout.
const useLatestEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Pointr's live map in Kozmos: the Pointr Web SDK, loaded from Pointr's CDN at
 * run time with subresource integrity, drawing into a Kozmos `MapView` with
 * every interface of its own switched off. Put it in `AdaptiveMapShell`'s
 * `map` slot, feed it the shell's insets, and draw the search, the floors and
 * the selection with Kozmos's parts. A page holds one: a second is refused
 * with an `instance` error.
 */
export const PointrMap = React.forwardRef<PointrMapHandle, PointrMapProps>(
  function PointrMap(
    {
      config,
      padding,
      mapLabel = "Map",
      variant = "fill",
      className,
      style,
      readyTimeoutMs = 60_000,
      onReady,
      onStatusChange,
      onError,
      onPoiSelect,
      onLevelChange,
      onBuildingChange,
      onSiteChange,
    },
    ref,
  ) {
    const callbacks = React.useRef({
      onReady,
      onStatusChange,
      onError,
      onPoiSelect,
      onLevelChange,
      onBuildingChange,
      onSiteChange,
    });
    const container = React.useRef<HTMLDivElement>(null);
    const session = React.useRef<PointrMapSession | undefined>(undefined);
    const latestPadding = React.useRef(padding);
    useLatestEffect(() => {
      latestPadding.current = padding;
      callbacks.current = {
        onReady,
        onStatusChange,
        onError,
        onPoiSelect,
        onLevelChange,
        onBuildingChange,
        onSiteChange,
      };
    });
    const [status, setStatus] = React.useState<MapReadiness>("loading");
    // Compared by value: a config written inline is a new object each render.
    const configKey = JSON.stringify(config ?? null);

    React.useEffect(() => {
      const host = container.current;
      if (!host) return;
      const current = new PointrMapSession(
        JSON.parse(configKey) as PointrMapConfig,
        host,
        {
          status: (next, error) => {
            setStatus(next);
            callbacks.current.onStatusChange?.(next, error);
          },
          error: (error) => callbacks.current.onError?.(error),
          ready: (map) => callbacks.current.onReady?.(map),
          poiSelect: (item) => callbacks.current.onPoiSelect?.(item),
          levelChange: (floor, building) =>
            callbacks.current.onLevelChange?.(floor, building),
          buildingChange: (building) =>
            callbacks.current.onBuildingChange?.(building),
          siteChange: (site) => callbacks.current.onSiteChange?.(site),
        },
        readyTimeoutMs,
        latestPadding.current,
      );
      session.current = current;
      void current.start();
      return () => {
        current.dispose();
        if (session.current === current) session.current = undefined;
      };
    }, [configKey, readyTimeoutMs]);

    const top = padding?.top ?? 0;
    const right = padding?.right ?? 0;
    const bottom = padding?.bottom ?? 0;
    const left = padding?.left ?? 0;
    React.useEffect(() => {
      session.current?.setPadding({ top, right, bottom, left });
    }, [top, right, bottom, left]);

    React.useImperativeHandle(
      ref,
      () => ({
        map: () => session.current?.getMap(),
        flyToPoi: (id, options) =>
          session.current?.flyToPoi(id, options) ?? false,
        setLevel: (level) => session.current?.setLevel(level) ?? false,
        search: (query, options) =>
          session.current
            ? session.current.search(query, options)
            : Promise.reject(
                new PointrMapError("data", "PointrMap is not mounted", {
                  fatal: false,
                }),
              ),
      }),
      [],
    );

    return (
      <MapView
        mapLabel={mapLabel}
        variant={variant}
        className={className}
        // The SDK's own layers stack at z-index 9999-10000: isolated, they
        // stay under the shell's panel and controls.
        style={{ isolation: "isolate", ...style }}
        data-pointr-map-status={status}
        data-pointr-sdk={config?.sdkVersion ?? POINTR_SDK_VERSION}
      >
        <style>{RESIDUAL_CHROME_CSS}</style>
        <div ref={container} style={{ position: "absolute", inset: 0 }} />
      </MapView>
    );
  },
);
PointrMap.displayName = "PointrMap";
