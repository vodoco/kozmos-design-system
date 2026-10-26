/**
 * The part of the Pointr Web SDK 10.13.0 this package reads, as read from the
 * bundle (classes Options, MapWidget, UiController, MapView, Poi, Level,
 * Building, Site) and confirmed in the browser by the spike. These are not
 * Pointr's typings: the SDK ships none. Nothing here is exported to a product
 * apart from the MapLibre map, which the handle's `map()` returns.
 */

/** A MapLibre GL map, as far as this package and its hosts use one. */
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
  project(lngLat: readonly [number, number]): { x: number; y: number };
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLElement;
  on(type: string, listener: (event: unknown) => void): void;
  off(type: string, listener: (event: unknown) => void): void;
  remove(): void;
}

/** The SDK's IEventEmitter: `on`, `off`, `emit` by name. */
export interface SdkEmitter {
  on(name: string, listener: (...args: unknown[]) => void): void;
  off?(name: string, listener: (...args: unknown[]) => void): void;
}

/** MapView, the SDK's view around the MapLibre map; `map` exists once its data has loaded. */
export interface SdkMapView extends SdkEmitter {
  map?: PointrMapLibreMap;
  isMapReadyEmitted?: boolean;
  events?: Record<string, string>;
}

export interface SdkMapViewController {
  getView(): SdkMapView | undefined;
  /** Removes the MapLibre map: `MapWidget.destroy()` does not. */
  destroyMap(): void;
  /**
   * While true, removing the map makes the SDK fall back to building
   * outlines through a view `destroy()` has cleared, an uncaught TypeError on
   * every unmount (measured). Set false before `destroyMap()`.
   */
  building3DModelsActive?: boolean;
}

/** An SDK error as `UiController.showError` receives it. */
export type SdkError =
  | string
  | Error
  | { errorMsg?: unknown; errorTitle?: unknown; message?: unknown };

export interface SdkUiController {
  getMapViewController(): SdkMapViewController | undefined;
  /**
   * Every failure after `start()` reaches this: a token request refused, the
   * site's data not loading, a non-blocking problem (`isPopup`). The SDK then
   * draws its own error page; this package draws the shell's status instead.
   */
  showError(error: SdkError, isPopup?: boolean): void;
  /** Called once the token is in hand, before the site's data loads. */
  showLoadingView(): void;
}

export interface SdkLevel {
  levelIndex: number;
  levelShortTitle?: string;
  levelLongTitle?: string;
  externalIdentifier?: string;
}

export interface SdkBuilding {
  buildingInternalIdentifier: string;
  buildingExternalIdentifier?: string;
  siteInternalIdentifier: string;
  buildingTitle?: string;
  levels?: SdkLevel[];
}

export interface SdkSite {
  siteInternalIdentifier: string;
  siteExternalIdentifier?: string;
  siteTitle?: string;
  buildings?: SdkBuilding[];
}

/**
 * A Pointr POI: a GeoJSON feature. `properties` carries `fid` (its id), `name`
 * and `name_<language>`, `description`, `lvl` (its level), `bid` and `sid`,
 * `mainType` and `subType` (taxonomy codes) and `isFeatured`.
 */
export interface SdkPoi {
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates: unknown };
}

export interface SdkMapWidget extends SdkEmitter {
  start(): void;
  destroy(): void;
  getUiController(): SdkUiController | undefined;
  getSiteBuildingManager?(): {
    getBuildingWithInternalIdentifier(id: string): SdkBuilding | undefined;
  };
  getCurrentSite(): SdkSite | undefined;
  getCurrentBuilding(): SdkBuilding | undefined;
  getCurrentLevel(): SdkLevel | undefined;
  /** Takes the SDK's own Level instances only; plain level objects are refused. */
  setLevel(level: SdkLevel): void;
  search(
    query: string,
    site?: SdkSite,
    building?: SdkBuilding,
  ): Promise<SdkPoi[] | Record<string, SdkPoi>>;
  unhighlight(): void;
}

/** `window.PointrWebSDK`, the UMD bundle's one global. */
export interface PointrWebSDKGlobal {
  Options: new (options: Record<string, unknown>) => object;
  MapWidget: {
    new (options: object): SdkMapWidget;
    getInstance(): SdkMapWidget | undefined;
  };
}

/**
 * `window.PointrWebSDK`. Read through this rather than a global declaration,
 * which would reach every product's own `Window` type.
 */
export function pointrSdkGlobal(): PointrWebSDKGlobal | undefined {
  return (window as Window & { PointrWebSDK?: PointrWebSDKGlobal })
    .PointrWebSDK;
}

/** The element id the SDK draws into. Its views find their parts by fixed ids, so a page holds one map. */
export const CONTAINER_ID = "pointr-map";

/**
 * Every interface switch `Options` accepts, off: Kozmos draws the interface.
 * What these leave is decided by the Pointr Cloud, not by `Options`: the
 * watermark and its credits, the info button, the onboarding card, the level
 * selector and the building's Exit button (see RESIDUAL_CHROME_CSS).
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

/**
 * The SDK chrome no `Options` switch turns off and Kozmos draws itself: the
 * level selector, the building's Exit button and the info button. Scoped to
 * the map's own element. Never the watermark: the SDK watches it and removes
 * the map when it is hidden.
 */
export const RESIDUAL_CHROME_CSS = [
  `#${CONTAINER_ID} #pointr-levels`,
  `#${CONTAINER_ID} #pointr-exit-button`,
  `#${CONTAINER_ID} #pointr-info-button`,
]
  .join(",\n")
  .concat(" { display: none !important; }");

/**
 * Adds RESIDUAL_CHROME_CSS to the document until the returned function takes
 * it away. It goes in a constructed stylesheet (`document.adoptedStyleSheets`),
 * which is CSSOM and needs no `style-src 'unsafe-inline'`. A browser without
 * constructed stylesheets (Safari before 16.4) gets a `<style>` element
 * instead, carrying `nonce`: there the policy needs that nonce, or
 * `'unsafe-inline'`, in `style-src`.
 */
export function hideResidualChrome(nonce?: string): () => void {
  const doc = document as Document & { adoptedStyleSheets?: CSSStyleSheet[] };
  if (
    typeof CSSStyleSheet === "function" &&
    "replaceSync" in CSSStyleSheet.prototype &&
    "adoptedStyleSheets" in Document.prototype
  ) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(RESIDUAL_CHROME_CSS);
    doc.adoptedStyleSheets = [...(doc.adoptedStyleSheets ?? []), sheet];
    return () => {
      doc.adoptedStyleSheets = (doc.adoptedStyleSheets ?? []).filter(
        (adopted) => adopted !== sheet,
      );
    };
  }
  const node = document.createElement("style");
  if (nonce) node.setAttribute("nonce", nonce);
  node.setAttribute("data-kozmos-pointr-chrome", "");
  node.textContent = RESIDUAL_CHROME_CSS;
  document.head.append(node);
  return () => node.remove();
}
