/**
 * A stand-in for the Pointr Web SDK 10.13.0, holding to what the bundle does
 * where PointrMap depends on it (read from the bundle, and measured by the
 * spike): MapWidget is a singleton whose constructor throws while one exists;
 * destroy() clears it, leaves the MapLibre map alive and throws a second
 * time; every failure after start() reaches UiController.showError, a token
 * failure before showLoadingView and a data failure after it; setLevel takes
 * Level instances only; Options warns about a key it does not know.
 *
 * Also as the 10.13.0 bundle reads (its Options constructor, validate() and
 * MapWidget.start(), read from a local copy on 17 Oct):
 * - Options takes every option from the page's query string too, as
 *   `?<option>=` or `?ptr<Option>=` (the ptr form wins), then a token's
 *   `clientIdentifiers[0]` and `iss` over the client and the base URL.
 * - validate() writes each refused value into the console:
 *   `licenseKey(<the value>) is not valid - …`. StringHelper.isValid's own
 *   rule is not in what was read: the fake takes a non-empty string.
 * - start() makes the UiController itself (there is none before it), calls
 *   showError at once for options validate() refuses, and calls
 *   showLoadingView from a promise callback once the token is in hand: at
 *   once for a cloud token, after the token request for keys.
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

/** What `updateOptionsWithQueryString` does: `?ptr<Option>` over `?<option>` over the value given. */
function fromAddress(values: Record<string, unknown>) {
  const query = new URLSearchParams(window.location.search);
  for (const option of SDK_OPTION_KEYS) {
    const ptr = `ptr${option.charAt(0).toUpperCase()}${option.slice(1)}`;
    const value = query.get(ptr) ?? query.get(option);
    if (value !== null) values[option] = value;
  }
}

/** The claims of an unsigned test token, or undefined. */
function claimsOf(token: unknown): Record<string, unknown> | undefined {
  if (typeof token !== "string") return undefined;
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
  } catch {
    return undefined;
  }
}

/** Options.validate(): each refused value goes to console.error, as the bundle's does. */
function validate(values: Record<string, unknown>) {
  const valid = (value: unknown) =>
    typeof value === "string" && value.length > 0;
  const errors: string[] = [];
  const refuse = (message: string) => {
    console.error(message);
    errors.push(message);
  };
  if (!valid(values.clientIdentifier))
    refuse(
      `clientIdentifier(${String(values.clientIdentifier)}) is not valid - SDK cannot work without a valid client id`,
    );
  if (!valid(values.licenseKey) && !values.pointrCloudToken)
    refuse(
      `licenseKey(${String(values.licenseKey)}) is not valid - SDK cannot work without a valid client secret`,
    );
  if (!valid(values.baseUrl))
    refuse(
      `baseUrl(${String(values.baseUrl)}) is not valid - SDK cannot work without a valid endpoint URL`,
    );
  return { isValid: errors.length === 0, errorMsg: errors[0] };
}

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

/**
 * As 10.13.0's Level (read from the bundle on 28 Oct): its constructor copies
 * the index, the titles and the external identifier, and nothing else, so a
 * level's `properties`, where the venue's data marks the default level
 * (`isDefault`), do not survive it.
 */
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
  /**
   * The current site and building as the venue's data loaded them: 10.13.0's
   * MapViewController reads both from its Storage (BaseViewController's
   * getters), not as Site, Building and Level instances, so their levels keep
   * `properties`. Its building and site events carry the same objects.
   */
  currentSite?: FakeSiteData;
  currentBuilding?: FakeBuildingData;
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

/** A level as the venue's data gives it, before the SDK's Level drops its `properties`. */
export interface FakeLevelData {
  levelIndex: number;
  levelShortTitle: string;
  levelLongTitle: string;
  properties: { isDefault?: boolean };
}

export interface FakeBuildingData extends Omit<FakeBuilding, "levels"> {
  levels: FakeLevelData[];
}

export interface FakeSiteData extends Omit<FakeSite, "buildings"> {
  buildings: FakeBuildingData[];
}

/**
 * A site with one building of three levels. `defaultLevelIndex` marks that
 * level as the building's default in the venue's data, as
 * `properties.isDefault`, where 10.13.0's `PointrHelper.findDefaultLevelToSet`
 * reads it. `loaded` is the data as it loaded (the map view controller's, and
 * what the building and site events carry); `site`, `building` and `levels`
 * are the SDK's instances of it, as `getCurrentSite()`, `getCurrentBuilding()`
 * and the SiteBuildingManager return them, their levels without `properties`.
 */
export function fakeVenue({
  defaultLevelIndex,
}: { defaultLevelIndex?: number } = {}) {
  const data: FakeLevelData[] = [
    { levelIndex: 0, levelShortTitle: "G", levelLongTitle: "Ground floor" },
    { levelIndex: 2, levelShortTitle: "2", levelLongTitle: "Second floor" },
    { levelIndex: 1, levelShortTitle: "1", levelLongTitle: "First floor" },
  ].map((level) => ({
    ...level,
    properties:
      level.levelIndex === defaultLevelIndex ? { isDefault: true } : {},
  }));
  const levels = data.map((level) => new FakeLevel(level));
  const buildingData = {
    buildingInternalIdentifier: "b-1",
    buildingExternalIdentifier: "B1",
    siteInternalIdentifier: "s-1",
    buildingTitle: "Main building",
  };
  const building: FakeBuilding = { ...buildingData, levels };
  const site: FakeSite = {
    siteInternalIdentifier: "s-1",
    siteTitle: "Campus",
    buildings: [building],
  };
  const loadedBuilding: FakeBuildingData = { ...buildingData, levels: data };
  const loaded = {
    building: loadedBuilding,
    site: {
      siteInternalIdentifier: "s-1",
      siteTitle: "Campus",
      buildings: [loadedBuilding],
    } satisfies FakeSiteData,
  };
  return { site, building, levels, loaded };
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
  /** Makes start() throw before it reaches its own try, as `Storage.clear()` can. */
  static throwOnStart = false;
  isOptionsValid = true;
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
    this.options = options.effective;
  }
  start() {
    this.started += 1;
    this.sessionCountAtStart = localStorage.getItem("sessionCount");
    if (FakeWidget.throwOnStart) {
      FakeWidget.throwOnStart = false;
      throw new TypeError(
        `Cannot read properties of null (reading 'clear') for ${String(this.options?.licenseKey)}`,
      );
    }
    // A new UiController each start(), as the bundle's start() makes it.
    const ui = new FakeUiController();
    this.ui = ui;
    const checked = validate(this.options ?? {});
    if (!checked.isValid) {
      ui.showError(checked);
      this.isOptionsValid = false;
      console.warn("Invalid options given - please check the logs");
      return;
    }
    // setApiToken(token).then(() => showLoadingView()): a token needs no
    // request, so the loading view follows in a promise callback.
    if (this.options?.pointrCloudToken)
      void Promise.resolve().then(() => {
        if (this.ui === ui) ui.showLoadingView();
      });
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
    ui.mapViewController.currentSite = venue.loaded.site;
    ui.mapViewController.currentBuilding = venue.loaded.building;
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
  /** What PointrMap passed. */
  values: Record<string, unknown>;
  /** What the SDK goes on: the page's address and the token's claims over `values`. */
  effective: Record<string, unknown>;
  unknownKeys: string[];
  constructor(options: Record<string, unknown>) {
    this.values = { ...options };
    this.unknownKeys = Object.keys(options).filter(
      (k) => !SDK_OPTION_KEYS.has(k),
    );
    const effective = { ...options };
    fromAddress(effective);
    const claims = claimsOf(effective.pointrCloudToken);
    const clients = claims?.clientIdentifiers;
    if (Array.isArray(clients) && clients.length)
      effective.clientIdentifier = clients[0];
    if (claims?.iss) effective.baseUrl = claims.iss;
    this.effective = effective;
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
  FakeWidget.throwOnStart = false;
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

/** The SDK's stylesheet arrives, for a page whose script is already in (a global the host loaded). */
export async function serveSdkStylesheet() {
  const { waitFor } = await import("@testing-library/react");
  let link: HTMLElement | null = null;
  await waitFor(() => {
    link = document.head.querySelector<HTMLElement>(
      "link[data-kozmos-pointr-sdk]",
    );
    if (!link) throw new Error("the SDK's stylesheet is not requested yet");
  });
  link!.dispatchEvent(new Event("load"));
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
