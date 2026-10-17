import type {
  FloorPresentation,
  MapCollisionInsets,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import {
  checkConfig,
  configSecrets,
  sdkOptions,
  type PointrMapConfig,
} from "./config";
import {
  toBuilding,
  toFloor,
  toPoiItem,
  toSearchResponse,
  toSite,
  poiId,
  type PointrBuildingPresentation,
  type PointrPoiItem,
  type PointrSearchResponse,
  type PointrSitePresentation,
} from "./convert";
import { watchCsp, type PointrCspViolation } from "./csp";
import {
  hasStorage,
  hasWebGL,
  isOffline,
  skipFirstVisitCard,
} from "./environment";
import { PointrMapError, redact, sdkErrorText } from "./errors";
import {
  CONTAINER_ID,
  pointrSdkGlobal,
  type PointrMapLibreMap,
  type PointrWebSDKGlobal,
  type SdkError,
  type SdkMapView,
  type SdkBuilding,
  type SdkMapWidget,
  type SdkPoi,
  type SdkSite,
} from "./sdk";
import { loadPointrSdk, PointrSdkLoadError } from "./sdk-loader";
import { POINTR_SDK_VERSION } from "./sdk-versions";

/** What a session tells the component. */
export interface SessionEvents {
  status(status: MapReadiness, error?: PointrMapError): void;
  error(error: PointrMapError): void;
  ready(map: PointrMapLibreMap): void;
  poiSelect(item: PointrPoiItem): void;
  levelChange(
    floor: FloorPresentation,
    building?: PointrBuildingPresentation,
  ): void;
  buildingChange(building?: PointrBuildingPresentation): void;
  siteChange(site?: PointrSitePresentation): void;
}

export interface SearchOptions {
  /** `building` (the default) searches the open building when there is one; `site` searches the whole site. */
  scope?: "building" | "site";
}

export interface FlyToPoiOptions {
  /** The zoom to arrive at; 19.5 by default. */
  zoom?: number;
}

// The page's one map. MapWidget is a singleton and its views find their
// parts by fixed ids, so a second PointrMap is refused rather than allowed to
// throw inside the SDK or take the first one's map.
let owner: object | undefined;

const POLL_MS = 50;
const NO_PADDING: MapCollisionInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** The next task, after every event already queued (a CSP report, a script's error). */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * One start of the SDK, from loading its files to `destroyMap()`. The React
 * component makes one per mount and per config, and disposes of it on
 * unmount; StrictMode's extra mount and unmount are two sessions, the first
 * disposed before it creates a widget.
 */
export class PointrMapSession {
  /** This session's claim on the page's map. */
  private readonly claim = {};
  private disposed = false;
  private failed: PointrMapError | undefined;
  private widget: SdkMapWidget | undefined;
  private view: SdkMapView | undefined;
  private map: PointrMapLibreMap | undefined;
  private padding: MapCollisionInsets;
  private ownedContainer = false;
  private loadingShown = false;
  private timedOut = false;
  private cspSeen: PointrCspViolation | undefined;
  private stopCsp: (() => void) | undefined;
  private pollTimer: ReturnType<typeof setTimeout> | undefined;
  private readyTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly unsubscribe: (() => void)[] = [];
  private readonly pois = new Map<string, PointrPoiItem>();
  private building: PointrBuildingPresentation | undefined;
  private site: PointrSitePresentation | undefined;
  private levelIndex: number | undefined;
  private readonly secrets: unknown[];

  constructor(
    private readonly config: PointrMapConfig,
    private readonly container: HTMLElement,
    private readonly events: SessionEvents,
    private readonly readyTimeoutMs: number,
    padding: MapCollisionInsets | undefined,
  ) {
    this.padding = padding ?? NO_PADDING;
    this.secrets = configSecrets(config);
  }

  /** Starts the map; every failure is reported, none is thrown. */
  async start(): Promise<void> {
    if (owner && owner !== this.claim)
      return this.fail(
        new PointrMapError(
          "instance",
          "Another PointrMap holds this page's Pointr map: the SDK draws one map a page",
        ),
      );
    owner = this.claim;
    const problem = checkConfig(this.config);
    if (problem) return this.fail(problem);
    if (!hasStorage())
      return this.fail(
        new PointrMapError(
          "storage",
          "This page cannot read localStorage (a sandbox without allow-same-origin), which the Pointr SDK reads as it starts",
        ),
      );
    if (!hasWebGL())
      return this.fail(
        new PointrMapError(
          "webgl",
          "This browser gives no WebGL context for the map",
        ),
      );
    this.events.status("loading");
    this.stopCsp = watchCsp(this.config.baseUrl, (violation) =>
      this.onCsp(violation),
    );

    let sdk: PointrWebSDKGlobal;
    try {
      sdk = await loadPointrSdk(this.config.sdkVersion ?? POINTR_SDK_VERSION);
    } catch (error) {
      // A CSP report and the script's error arrive as separate tasks: wait
      // for the report, so a blocked script is named as one.
      await nextTask();
      if (this.disposed || this.failed) return;
      return this.fail(this.loadError(error));
    }
    if (this.disposed || this.failed) return;
    if (sdk.MapWidget.getInstance())
      return this.fail(
        new PointrMapError(
          "instance",
          "This page already has a Pointr MapWidget that PointrMap did not make",
        ),
      );

    this.container.id = CONTAINER_ID;
    this.ownedContainer = true;
    skipFirstVisitCard();
    let widget: SdkMapWidget;
    try {
      widget = new sdk.MapWidget(new sdk.Options(sdkOptions(this.config)));
    } catch (error) {
      return this.fail(
        new PointrMapError(
          "instance",
          `The Pointr SDK refused a new MapWidget: ${this.clean(sdkErrorText(error))}`,
        ),
      );
    }
    this.widget = widget;
    try {
      widget.start();
    } catch (error) {
      return this.fail(
        new PointrMapError(
          "data",
          `The Pointr SDK did not start: ${this.clean(sdkErrorText(error))}`,
          { offline: isOffline() },
        ),
      );
    }
    this.interceptErrors(widget);
    this.readyTimer = setTimeout(() => this.onTimeout(), this.readyTimeoutMs);
    this.attach();
  }

  /** Stops everything and removes the map, its WebGL context with it. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.pollTimer);
    clearTimeout(this.readyTimer);
    this.stopCsp?.();
    for (const off of this.unsubscribe.splice(0)) off();
    teardown(this.widget);
    this.widget = undefined;
    this.view = undefined;
    this.map = undefined;
    if (this.ownedContainer) this.container.removeAttribute("id");
    if (owner === this.claim) owner = undefined;
  }

  /** The shell's insets, kept as the camera's padding (re-applied when the camera rests). */
  setPadding(padding: MapCollisionInsets | undefined) {
    this.padding = padding ?? NO_PADDING;
    this.applyPadding();
  }

  getMap() {
    return this.map;
  }

  setLevel(level: number | string): boolean {
    const widget = this.widget;
    const wanted = Number(level);
    if (!widget || !this.map || !Number.isInteger(wanted)) return false;
    // setLevel takes the SDK's own Level instances: the levels in a
    // current-building-changed payload are plain objects, and refused.
    const building =
      widget.getCurrentBuilding() ??
      (this.building
        ? widget
            .getSiteBuildingManager?.()
            .getBuildingWithInternalIdentifier(this.building.id)
        : undefined);
    const live = building?.levels?.find((l) => l.levelIndex === wanted);
    if (!live) return false;
    widget.setLevel(live);
    return true;
  }

  flyToPoi(id: string, options: FlyToPoiOptions = {}): boolean {
    const item = this.pois.get(String(id));
    const map = this.map;
    if (!item || !map || !item.coordinates) return false;
    if (
      item.levelIndex !== undefined &&
      item.levelIndex !== this.currentLevel()
    )
      this.setLevel(item.levelIndex);
    // Kozmos draws the selection: the SDK's own highlight stays off.
    this.widget?.unhighlight();
    map.flyTo({
      center: [...item.coordinates],
      zoom: options.zoom ?? 19.5,
      padding: { ...this.padding },
    });
    return true;
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<PointrSearchResponse> {
    const widget = this.widget;
    if (!widget || !this.map)
      throw new PointrMapError("data", "The map is not ready to search yet", {
        fatal: false,
      });
    if (!query.trim()) return { results: [], items: [] };
    const site = widget.getCurrentSite();
    const building =
      options.scope === "site" || !site
        ? undefined
        : widget.getCurrentBuilding();
    const found = site
      ? await widget.search(query, site, building)
      : await widget.search(query);
    if (this.disposed) return { results: [], items: [] };
    const list = Array.isArray(found) ? found : Object.values(found ?? {});
    const scopeBuilding = toBuilding(building);
    const response = toSearchResponse(list, {
      language: this.config.language,
      building: scopeBuilding ?? this.building,
      ...(scopeBuilding
        ? {
            scope: {
              kind: "building" as const,
              id: scopeBuilding.id,
              label: scopeBuilding.label,
            },
          }
        : {}),
    });
    for (const item of response.items) this.pois.set(item.poi.id, item);
    return response;
  }

  // ---------------------------------------------------------------------

  private clean(text: string) {
    return redact(text, this.secrets);
  }

  private fail(error: PointrMapError) {
    if (this.disposed) return;
    if (!error.fatal) {
      this.events.error(error);
      return;
    }
    if (this.failed) return;
    this.failed = error;
    clearTimeout(this.readyTimer);
    // Refused before a widget existed, the page's map, and its element id,
    // are free for another.
    if (!this.widget) {
      if (owner === this.claim) owner = undefined;
      if (this.ownedContainer) this.container.removeAttribute("id");
      this.ownedContainer = false;
    }
    this.events.status(error.status, error);
    this.events.error(error);
  }

  private loadError(error: unknown): PointrMapError {
    if (this.cspSeen)
      return new PointrMapError(
        "csp",
        `A Content-Security-Policy ${this.cspSeen.directive} blocked ${this.cspSeen.blocked}, and the Pointr SDK did not load`,
      );
    const message =
      error instanceof PointrSdkLoadError
        ? error.message
        : `The Pointr SDK did not load: ${this.clean(sdkErrorText(error))}`;
    const version =
      error instanceof PointrSdkLoadError && error.resource === "version";
    return new PointrMapError(version ? "config" : "script", message, {
      offline: isOffline(),
    });
  }

  private onCsp(violation: PointrCspViolation) {
    this.cspSeen ??= violation;
    // Without blob: workers MapLibre never draws (measured): that one is
    // fatal at once. Another blocked host may cost only some tiles, so it is
    // reported, and named if the map then never becomes ready.
    const fatal = violation.blocked === "blob" && !this.map;
    this.fail(
      new PointrMapError(
        "csp",
        `A Content-Security-Policy ${violation.directive} blocked ${violation.blocked}`,
        { fatal },
      ),
    );
  }

  private onTimeout() {
    if (this.map) return;
    // The view is still watched: a map that arrives late is still ready.
    this.timedOut = true;
    this.fail(
      this.cspSeen
        ? new PointrMapError(
            "csp",
            `The map did not become ready in ${this.readyTimeoutMs} ms; a Content-Security-Policy ${this.cspSeen.directive} blocked ${this.cspSeen.blocked}`,
          )
        : new PointrMapError(
            "data",
            `The map did not become ready in ${this.readyTimeoutMs} ms`,
            { offline: isOffline() },
          ),
    );
  }

  /**
   * Every failure after start() reaches UiController.showError. The token is
   * asked for first and showLoadingView follows it, so an error before that
   * is the keys' or the token's, and one after it the data's. The SDK's own
   * error page is not drawn: the shell's status says it.
   */
  private interceptErrors(widget: SdkMapWidget) {
    const ui = widget.getUiController();
    if (!ui) return;
    const showLoadingView = ui.showLoadingView?.bind(ui);
    ui.showLoadingView = () => {
      this.loadingShown = true;
      showLoadingView?.();
    };
    ui.showError = (error: SdkError, isPopup?: boolean) => {
      if (this.disposed) return;
      const text = this.clean(sdkErrorText(error));
      const title =
        error && typeof error === "object" && !(error instanceof Error)
          ? (error as { errorTitle?: unknown }).errorTitle
          : undefined;
      if (isPopup) {
        this.fail(
          new PointrMapError(
            "data",
            `The Pointr SDK reported a problem: ${text}`,
            {
              fatal: false,
            },
          ),
        );
      } else if (/webgl/i.test(text)) {
        this.fail(
          new PointrMapError("webgl", `The map could not draw: ${text}`),
        );
      } else if (
        title === "Invalid settings" ||
        title === "Invalid configuration"
      ) {
        this.fail(
          new PointrMapError(
            "config",
            `The Pointr Cloud refused the config: ${text}`,
          ),
        );
      } else if (!this.loadingShown) {
        this.fail(
          new PointrMapError(
            "auth",
            `The Pointr Cloud refused the keys or the token: ${text}`,
            {
              offline: isOffline(),
            },
          ),
        );
      } else {
        this.fail(
          new PointrMapError("data", `The site's data did not load: ${text}`, {
            offline: isOffline(),
          }),
        );
      }
    };
  }

  /** Waits for the SDK's view, then follows its events. */
  private attach() {
    if (this.disposed || (this.failed && !this.timedOut)) return;
    const widget = this.widget;
    const view = widget?.getUiController()?.getMapViewController()?.getView();
    if (!widget || !view) {
      this.pollTimer = setTimeout(() => this.attach(), POLL_MS);
      return;
    }
    this.view = view;
    const names = view.events ?? {};
    const on = (name: string, listener: (...args: unknown[]) => void) => {
      view.on(name, listener);
      this.unsubscribe.push(() => view.off?.(name, listener));
    };
    on(names.mapReady ?? "map-ready", () => this.ready());
    on(names.poiClicked ?? "poi-clicked", (detail) => {
      const poi = (detail as { poi?: SdkPoi } | undefined)?.poi;
      if (poi) this.selectPoi(poi);
    });
    on(names.levelChanged ?? "level-changed", (levelIndex) =>
      this.onLevel(Number(levelIndex)),
    );
    on(names.currentBuildingChanged ?? "current-building-changed", (detail) =>
      this.onBuilding(
        toBuilding(
          (detail as { newCurrentBuilding?: SdkBuilding } | undefined)
            ?.newCurrentBuilding,
        ),
      ),
    );
    on(names.currentSiteChanged ?? "current-site-changed", (detail) =>
      this.onSite(
        toSite((detail as { newSite?: SdkSite } | undefined)?.newSite),
      ),
    );
    if (view.isMapReadyEmitted) this.ready();
  }

  private ready() {
    const map = this.view?.map;
    if (this.disposed || !map || this.map === map) return;
    clearTimeout(this.readyTimer);
    this.map = map;
    this.failed = undefined;
    const reapply = () => this.applyPadding();
    // The SDK sets its own padding as it goes (a POI click resets it to 0,
    // measured), so the shell's is put back each time the camera rests.
    map.on("idle", reapply);
    this.unsubscribe.push(() => map.off("idle", reapply));
    this.applyPadding();
    this.events.status("ready");
    this.events.ready(map);
    // Events emitted while the view was being found are read back here.
    const widget = this.widget;
    if (!widget) return;
    this.onSite(toSite(widget.getCurrentSite()));
    this.onBuilding(toBuilding(widget.getCurrentBuilding()));
    const level = widget.getCurrentLevel();
    if (level) this.onLevel(level.levelIndex);
  }

  private applyPadding() {
    const map = this.map;
    if (!map) return;
    const now = map.getPadding();
    const { top, right, bottom, left } = this.padding;
    if (
      now.top !== top ||
      now.right !== right ||
      now.bottom !== bottom ||
      now.left !== left
    )
      map.setPadding({ top, right, bottom, left });
  }

  private currentLevel() {
    return this.widget?.getCurrentLevel()?.levelIndex ?? this.levelIndex;
  }

  private selectPoi(poi: SdkPoi) {
    // The SDK highlights a clicked POI with its own pin: Kozmos draws the
    // selection, so it comes off.
    this.widget?.unhighlight();
    const item = toPoiItem(poi, {
      language: this.config.language,
      building: this.building,
      resultIndex: 1,
      selected: true,
    });
    if (!item) return;
    this.pois.set(poiId(poi) ?? item.poi.id, item);
    this.events.poiSelect(item);
  }

  private onLevel(levelIndex: number) {
    if (!Number.isInteger(levelIndex) || levelIndex === this.levelIndex) return;
    this.levelIndex = levelIndex;
    const floor =
      this.building?.floors.find((f) => f.id === String(levelIndex)) ??
      toFloor({ levelIndex });
    if (floor) this.events.levelChange(floor, this.building);
  }

  private onBuilding(building: PointrBuildingPresentation | undefined) {
    // The same building again is news only when its floors changed (they
    // may arrive after the building does).
    if (JSON.stringify(building) === JSON.stringify(this.building)) return;
    const moved = building?.id !== this.building?.id;
    this.building = building;
    if (moved) this.levelIndex = undefined;
    this.events.buildingChange(building);
  }

  private onSite(site: PointrSitePresentation | undefined) {
    if (site?.id === this.site?.id) return;
    this.site = site;
    this.events.siteChange(site);
  }
}

/**
 * MapWidget.destroy() empties the container and clears the singleton but
 * leaves the MapLibre map, its WebGL context and its listeners alive, so the
 * map is removed first, with the 3D buildings' flag off (see
 * SdkMapViewController.building3DModelsActive).
 */
function teardown(widget: SdkMapWidget | undefined) {
  // A destroyed widget has no options left and throws on a second destroy.
  if (!widget || pointrSdkGlobal()?.MapWidget.getInstance() !== widget) return;
  try {
    const controller = widget.getUiController()?.getMapViewController();
    if (controller) {
      controller.building3DModelsActive = false;
      controller.destroyMap();
    }
  } catch {
    /* no map yet */
  }
  try {
    widget.destroy();
  } catch {
    /* destroyed already */
  }
}

/** Tests only: whether a session holds the page's map. */
export function pageMapOwnedForTests() {
  return owner !== undefined;
}
