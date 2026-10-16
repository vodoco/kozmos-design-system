// Spike only: loads the Pointr Web SDK from its CDN, once per page, and
// describes the small part of its API the spike reads. Nothing here is
// vendored: the browser fetches the script and the stylesheet itself.
//
// The types are the spike's reading of the 10.13.0 bundle (class Options,
// class MapWidget, MapView.events), confirmed in the browser; they are not
// Pointr's published typings, which the bundle does not ship.

export const POINTR_SDK_VERSION = "10.13.0";
const cdn = (version: string) =>
  `https://pointr-websdk.azureedge.net/${version}`;

/** A MapLibre GL map, as far as the spike uses one. */
export interface PointrMapLibreMap {
  getCenter(): { lng: number; lat: number };
  getZoom(): number;
  getPadding(): { top: number; right: number; bottom: number; left: number };
  setPadding(padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }): void;
  flyTo(options: Record<string, unknown>): void;
  easeTo(options: Record<string, unknown>): void;
  zoomIn(): void;
  zoomOut(): void;
  resize(): void;
  project(lngLat: [number, number]): { x: number; y: number };
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLElement;
  on(type: string, listener: (event: unknown) => void): void;
  off(type: string, listener: (event: unknown) => void): void;
  remove(): void;
}

export interface PointrEventEmitter {
  on(name: string, listener: (...args: unknown[]) => void): void;
  off?(name: string, listener: (...args: unknown[]) => void): void;
}

/** MapView: the SDK's own view around the MapLibre map. */
export interface PointrMapView extends PointrEventEmitter {
  map?: PointrMapLibreMap;
  isMapReadyEmitted?: boolean;
  events: Record<string, string>;
}

export interface PointrLevel {
  levelIndex: number;
  levelShortTitle?: string;
  levelLongTitle?: string;
  title?: string;
}

export interface PointrBuilding {
  buildingInternalIdentifier: string;
  siteInternalIdentifier: string;
  buildingTitle?: string;
  levels?: PointrLevel[];
}

export interface PointrSite {
  siteInternalIdentifier: string;
  siteTitle?: string;
  buildings?: PointrBuilding[];
}

/** A Pointr POI: a GeoJSON feature in a class; the spike reads these. */
export interface PointrPoi {
  properties?: Record<string, unknown>;
  geometry?: { type: string; coordinates: unknown };
}

export interface PointrMapWidget extends PointrEventEmitter {
  start(): void;
  destroy(): void;
  getUiController():
    | {
        getMapViewController():
          | { getView(): PointrMapView | undefined; destroyMap(): void }
          | undefined;
      }
    | undefined;
  getSiteBuildingManager(): {
    getAllSites(): PointrSite[];
    getSiteWithInternalIdentifier(id: string): PointrSite | undefined;
    getBuildingWithInternalIdentifier(id: string): PointrBuilding | undefined;
  };
  getCurrentSite(): PointrSite | undefined;
  getCurrentBuilding(): PointrBuilding | undefined;
  getCurrentLevel(): PointrLevel | undefined;
  setLevel(level: PointrLevel): void;
  focusMap(object?: PointrSite | PointrBuilding | PointrLevel): void;
  search(
    query: string,
    site?: PointrSite,
    building?: PointrBuilding,
  ): Promise<PointrPoi[] | Record<string, PointrPoi>>;
  highlightPoi(poi: PointrPoi): void;
  unhighlight(): void;
}

export interface PointrWebSDKGlobal {
  Options: new (options: Record<string, unknown>) => object;
  MapWidget: {
    new (options: object): PointrMapWidget;
    getInstance(): PointrMapWidget | undefined;
  };
}

declare global {
  interface Window {
    PointrWebSDK?: PointrWebSDKGlobal;
  }
}

const loads = new Map<string, Promise<PointrWebSDKGlobal>>();

/**
 * Adds the SDK's stylesheet and script to the document once per version and
 * resolves with `window.PointrWebSDK`. A page can hold one version only: the
 * bundle is a UMD that assigns one global, and MapWidget is a singleton.
 */
export function loadPointrSdk(
  version = POINTR_SDK_VERSION,
): Promise<PointrWebSDKGlobal> {
  const existing = loads.get(version);
  if (existing) return existing;
  const load = new Promise<PointrWebSDKGlobal>((resolve, reject) => {
    if (window.PointrWebSDK) {
      resolve(window.PointrWebSDK);
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${cdn(version)}/css/pointr.css`;
    document.head.append(css);
    const script = document.createElement("script");
    script.src = `${cdn(version)}/pointrwebsdk.js`;
    script.async = true;
    script.onload = () =>
      window.PointrWebSDK
        ? resolve(window.PointrWebSDK)
        : reject(new Error("pointrwebsdk.js ran but set no PointrWebSDK"));
    script.onerror = () =>
      reject(new Error(`Could not load ${script.src} (network or CSP)`));
    document.head.append(script);
  });
  loads.set(version, load);
  load.catch(() => loads.delete(version));
  return load;
}

/**
 * Every UI switch PointrWebSDK.Options accepts, off. What stays is decided
 * by the Pointr Cloud, not by Options: the watermark and its credits (white
 * label, `sdk.isWhiteLabel`), the info button (`isInfoButtonEnabled`), the
 * onboarding card (`isOnboardingEnabledForSdk`, first session only), the
 * level selector and the building's Exit button.
 */
export const POINTR_UI_OFF = {
  isSearchEnabled: false,
  isPoiDetailsEnabled: false,
  isZoomControlEnabled: false,
  isLanguageSelectorEnabled: false,
  isNavigationEnabled: false,
  isAccessibilityEnabled: false,
  isQuickAccessEnabled: false,
  isAppBannerEnabled: false,
} as const;
