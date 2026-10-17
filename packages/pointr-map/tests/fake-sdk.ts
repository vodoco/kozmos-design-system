/**
 * A stand-in for the Pointr Web SDK 10.13.0, holding to what the bundle does
 * where PointrMap depends on it (read from the bundle, and measured by the
 * spike): MapWidget is a singleton whose constructor throws while one exists;
 * destroy() clears it, leaves the MapLibre map alive and throws a second
 * time; every failure after start() reaches UiController.showError, a token
 * failure before showLoadingView and a data failure after it; setLevel takes
 * Level instances only; Options warns about a key it does not know.
 *
 * No network and no keys: the identifiers the tests pass are made up.
 */
import { vi } from "vitest";

/** Options' keys in 10.13.0 (its defaultOptions). */
export const SDK_OPTION_KEYS = new Set([
  "isSearchEnabled",
  "isPoiDetailsEnabled",
  "isZoomControlEnabled",
  "isLanguageSelectorEnabled",
  "isNavigationEnabled",
  "isAccessibilityEnabled",
  "isQuickAccessEnabled",
  "baseUrl",
  "clientIdentifier",
  "licenseKey",
  "siteInternalIdentifier",
  "buildingInternalIdentifier",
  "siteExternalIdentifier",
  "buildingExternalIdentifier",
  "levelIndex",
  "levelExternalIdentifier",
  "mapMinZoom",
  "mapMaxZoom",
  "initialZoomLevel",
  "latitude",
  "longitude",
  "bearing",
  "pitch",
  "navigationStartPoi",
  "startLevelIndex",
  "startPointLat",
  "startPointLng",
  "navigationDestinationPoi",
  "destinationLevelIndex",
  "destinationPointLat",
  "destinationPointLng",
  "highlightPoiIdentifier",
  "highlightPointLat",
  "highlightPointLng",
  "language",
  "languageList",
  "container",
  "mode",
  "deviceIdentifierForAnalytics",
  "personaIdentifier",
  "analyticsCustomLaunchParams",
  "quickAccessSelectionZoomLevel",
  "isAppBannerEnabled",
  "pointrCloudToken",
]);

type Listener = (...args: unknown[]) => void;

class Emitter {
  handlers: Record<string, Listener[]> = {};
  on(name: string, listener: Listener) {
    (this.handlers[name] ??= []).push(listener);
  }
  off(name: string, listener: Listener) {
    this.handlers[name] = (this.handlers[name] ?? []).filter(
      (l) => l !== listener,
    );
  }
  emit(name: string, ...args: unknown[]) {
    for (const listener of [...(this.handlers[name] ?? [])]) listener(...args);
  }
  count(name: string) {
    return (this.handlers[name] ?? []).length;
  }
}

export class FakeMap extends Emitter {
  padding = { top: 0, right: 0, bottom: 0, left: 0 };
  setPaddingCalls: (typeof this.padding)[] = [];
  flights: Record<string, unknown>[] = [];
  removed = false;
  getCenter() {
    return { lng: 0, lat: 0 };
  }
  getZoom() {
    return 18;
  }
  getPadding() {
    return { ...this.padding };
  }
  setPadding(padding: typeof this.padding) {
    this.padding = { ...padding };
    this.setPaddingCalls.push({ ...padding });
  }
  flyTo(options: Record<string, unknown>) {
    this.flights.push(options);
  }
  easeTo() {}
  zoomIn() {}
  zoomOut() {}
  resize() {}
  project([x, y]: readonly [number, number]) {
    return { x, y };
  }
  getCanvas() {
    return document.createElement("canvas");
  }
  getContainer() {
    return document.createElement("div");
  }
  remove() {
    this.removed = true;
  }
}

export class FakeLevel {
  levelIndex: number;
  levelShortTitle: string;
  levelLongTitle: string;
  constructor(dict: {
    levelIndex: number;
    levelShortTitle?: string;
    levelLongTitle?: string;
  }) {
    this.levelIndex = dict.levelIndex;
    this.levelShortTitle = dict.levelShortTitle ?? "";
    this.levelLongTitle = dict.levelLongTitle ?? "";
  }
}

export class FakeView extends Emitter {
  map?: FakeMap;
  isMapReadyEmitted = false;
  events = {
    levelChanged: "level-changed",
    zoom: "zoom",
    zoomChanged: "zoom-changed",
    mapIdle: "idle",
    mapClicked: "map-clicked",
    mapLongClicked: "map-long-clicked",
    locationMarked: "location-marked",
    poiClicked: "poi-clicked",
    poiUnhighlighted: "poi-unhighlighted",
    poiHighlighted: "poi-highlighted",
    mapReady: "map-ready",
    mapMoveStart: "map-move-start",
    mapMoveEnd: "map-move-end",
    currentSiteChanged: "current-site-changed",
    currentBuildingChanged: "current-building-changed",
    routesShown: "routes-shown",
    exitClicked: "exit-clicked",
    infoClicked: "info-clicked",
  };
}

export class FakeMapViewController {
  view?: FakeView;
  building3DModelsActive = true;
  /** The 3D flag's value at each destroyMap call. */
  destroyMapCalls: boolean[] = [];
  getView() {
    return this.view;
  }
  destroyMap() {
    this.destroyMapCalls.push(this.building3DModelsActive);
    this.view?.map?.remove();
  }
}

export class FakeUiController {
  mapViewController = new FakeMapViewController();
  /** What reached the SDK's own error page; PointrMap draws the shell's status instead. */
  sdkErrorPages: unknown[] = [];
  loadingViewShown = false;
  getMapViewController() {
    return this.mapViewController;
  }
  showError(error: unknown, isPopup?: boolean) {
    this.sdkErrorPages.push({ error, isPopup });
  }
  showLoadingView() {
    this.loadingViewShown = true;
  }
}

export interface FakePoiData {
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

/** A Poi instance keeps its properties behind a getter, as the real one does. */
export class FakePoi {
  private readonly _properties: Record<string, unknown>;
  private readonly _geometry: FakePoiData["geometry"];
  constructor(data: FakePoiData) {
    this._properties = data.properties;
    this._geometry = data.geometry;
  }
  get properties() {
    return this._properties;
  }
  get geometry() {
    return this._geometry;
  }
}

export interface FakeBuilding {
  buildingInternalIdentifier: string;
  buildingExternalIdentifier: string;
  siteInternalIdentifier: string;
  buildingTitle: string;
  levels: FakeLevel[];
}

export interface FakeSite {
  siteInternalIdentifier: string;
  siteTitle: string;
  buildings: FakeBuilding[];
}

export function fakeVenue() {
  const levels = [
    new FakeLevel({
      levelIndex: 0,
      levelShortTitle: "G",
      levelLongTitle: "Ground floor",
    }),
    new FakeLevel({
      levelIndex: 2,
      levelShortTitle: "2",
      levelLongTitle: "Second floor",
    }),
    new FakeLevel({
      levelIndex: 1,
      levelShortTitle: "1",
      levelLongTitle: "First floor",
    }),
  ];
  const building: FakeBuilding = {
    buildingInternalIdentifier: "b-1",
    buildingExternalIdentifier: "B1",
    siteInternalIdentifier: "s-1",
    buildingTitle: "Main building",
    levels,
  };
  const site: FakeSite = {
    siteInternalIdentifier: "s-1",
    siteTitle: "Campus",
    buildings: [building],
  };
  return { site, building, levels };
}

export class FakeWidget extends Emitter {
  static instance: FakeWidget | undefined;
  static constructed = 0;
  static getInstance() {
    return FakeWidget.instance;
  }
  options: Record<string, unknown> | undefined;
  ui: FakeUiController | undefined;
  started = 0;
  destroyed = false;
  unhighlights = 0;
  setLevelCalls: unknown[] = [];
  searches: { query: string; site?: unknown; building?: unknown }[] = [];
  searchResults: FakePoi[] = [];
  currentSite: FakeSite | undefined;
  currentBuilding: FakeBuilding | undefined;
  currentLevel: FakeLevel | undefined;
  events = { dataLoaded: "data-loaded" };
  /** What `localStorage.sessionCount` was when start() ran. */
  sessionCountAtStart: string | null = null;

  /** Makes the next constructor throw, as one racing another page script's would. */
  static refuseNext = false;
  constructor(options: FakeOptions) {
    super();
    if (FakeWidget.refuseNext) {
      FakeWidget.refuseNext = false;
      throw new Error("Cannot construct another instance of MapWidget.");
    }
    if (FakeWidget.instance)
      throw new Error(
        "Cannot construct another instance of MapWidget. Use MapWidget.getInstance() to get the single instance instead.",
      );
    FakeWidget.instance = this;
    FakeWidget.constructed += 1;
    this.options = options.values;
  }
  start() {
    this.started += 1;
    this.sessionCountAtStart = localStorage.getItem("sessionCount");
    this.ui = new FakeUiController();
  }
  destroy() {
    if (!this.options)
      throw new TypeError(
        "Cannot read properties of undefined (reading 'container')",
      );
    this.options = undefined;
    this.ui = undefined;
    this.destroyed = true;
    FakeWidget.instance = undefined;
  }
  getUiController() {
    return this.ui;
  }
  getSiteBuildingManager() {
    return {
      getBuildingWithInternalIdentifier: (id: string) =>
        this.currentSite?.buildings.find(
          (b) => b.buildingInternalIdentifier === id,
        ),
    };
  }
  getCurrentSite() {
    return this.currentSite;
  }
  getCurrentBuilding() {
    return this.currentBuilding;
  }
  getCurrentLevel() {
    return this.currentLevel;
  }
  setLevel(level: unknown) {
    this.setLevelCalls.push(level);
    if (!(level instanceof FakeLevel)) return; // "level is not an instance of Pointr.Level"
    this.currentLevel = level;
    this.view()?.emit("level-changed", level.levelIndex);
  }
  async search(query: string, site?: unknown, building?: unknown) {
    this.searches.push({ query, site, building });
    return this.searchResults;
  }
  unhighlight() {
    this.unhighlights += 1;
  }

  // Drivers: what the SDK does on its own, as a test needs it.

  view() {
    return this.ui?.mapViewController.view;
  }
  /** The token request was refused: the error arrives before the loading view. */
  failAuth(message = "Invalid client credentials") {
    this.ui!.showError({ errorMsg: message, errorTitle: "Error..." });
  }
  /** The token is in hand, then the site's data fails. */
  failData(
    error: unknown = {
      errorMsg: "Could not load the site",
      errorTitle: "Error...",
    },
    isPopup?: boolean,
  ) {
    this.ui!.showLoadingView();
    this.ui!.showError(error, isPopup);
  }
  /** The view exists, its data loads and the map is drawn. */
  loadData(venue = fakeVenue(), levelIndex = 0) {
    const ui = this.ui!;
    ui.showLoadingView();
    const view = new FakeView();
    ui.mapViewController.view = view;
    view.map = new FakeMap();
    this.currentSite = venue.site;
    this.currentBuilding = venue.building;
    this.currentLevel = venue.levels.find((l) => l.levelIndex === levelIndex);
    this.emit("data-loaded");
    view.isMapReadyEmitted = true;
    view.emit("map-ready");
    return view;
  }
  /** A POI click: the SDK emits it, and resets the camera's padding (measured). */
  clickPoi(poi: FakePoi) {
    const view = this.view()!;
    view.map!.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    view.emit("poi-clicked", { poi });
  }
}

export class FakeOptions {
  values: Record<string, unknown>;
  unknownKeys: string[];
  constructor(options: Record<string, unknown>) {
    this.values = { ...options };
    this.unknownKeys = Object.keys(options).filter(
      (k) => !SDK_OPTION_KEYS.has(k),
    );
    FakeOptions.made.push(this);
  }
  static made: FakeOptions[] = [];
}

/** Puts the fake on `window.PointrWebSDK`, as the CDN's script does when it runs. */
export function installFakeSdk() {
  (window as unknown as { PointrWebSDK: unknown }).PointrWebSDK = {
    Options: FakeOptions,
    MapWidget: FakeWidget,
  };
}

export function resetFakeSdk() {
  delete (window as unknown as { PointrWebSDK?: unknown }).PointrWebSDK;
  FakeWidget.instance = undefined;
  FakeWidget.constructed = 0;
  FakeWidget.refuseNext = false;
  FakeOptions.made = [];
}

/**
 * The SDK's two files arrive: the script sets the global, then both elements
 * fire load. Returns the elements PointrMap added.
 */
export async function serveSdkFiles() {
  const { waitFor } = await import("@testing-library/react");
  let files: HTMLElement[] = [];
  await waitFor(() => {
    files = [
      ...document.head.querySelectorAll<HTMLElement>(
        "[data-kozmos-pointr-sdk]",
      ),
    ];
    if (files.length < 2)
      throw new Error("the SDK's files are not requested yet");
  });
  installFakeSdk();
  for (const file of files) file.dispatchEvent(new Event("load"));
  return files;
}

/** One of the SDK's files fails to arrive. */
export async function failSdkFile(which: "script" | "style") {
  const { waitFor } = await import("@testing-library/react");
  let file: HTMLElement | null = null;
  await waitFor(() => {
    file = document.head.querySelector<HTMLElement>(
      which === "script"
        ? "script[data-kozmos-pointr-sdk]"
        : "link[data-kozmos-pointr-sdk]",
    );
    if (!file) throw new Error("not requested yet");
  });
  file!.dispatchEvent(new Event("error"));
}

/** A WebGL context the probe can take and give back. */
export function giveWebGL(available = true) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation((() =>
      available
        ? { getExtension: () => ({ loseContext() {} }) }
        : null) as never);
}
