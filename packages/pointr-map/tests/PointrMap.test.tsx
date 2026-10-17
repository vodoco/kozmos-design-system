import * as React from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MapCollisionInsets,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import {
  PointrMap,
  POINTR_SDK_VERSIONS,
  type PointrMapConfig,
  type PointrMapError,
  type PointrMapHandle,
  type PointrMapProps,
} from "../src";
import { resetPointrSdkLoaderForTests } from "../src/sdk-loader";
import { pageMapOwnedForTests } from "../src/session";
import {
  FakeLevel,
  FakeOptions,
  FakePoi,
  FakeWidget,
  failSdkFile,
  giveWebGL,
  installFakeSdk,
  resetFakeSdk,
  serveSdkFiles,
} from "./fake-sdk";

// Made up for these tests; no real identifier is in this package.
const CLIENT = "test-client-0000";
const LICENSE = "test-license-1111";
const config: PointrMapConfig = {
  baseUrl: "https://pointr-map-test.invalid",
  auth: { clientIdentifier: CLIENT, licenseKey: LICENSE },
  site: "s-1",
  building: "b-1",
  level: 0,
  language: "en",
  persona: "visitor",
};

/** A JSON Web Token's shape, with the claims given; unsigned. */
function token(claims: Record<string, unknown>) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${encode({ alg: "none" })}.${encode(claims)}.signature`;
}

let consoleCalls: unknown[][];

beforeEach(() => {
  resetFakeSdk();
  resetPointrSdkLoaderForTests();
  document.head
    .querySelectorAll("[data-kozmos-pointr-sdk]")
    .forEach((n) => n.remove());
  localStorage.clear();
  giveWebGL(true);
  consoleCalls = [];
  for (const method of ["log", "info", "warn", "error", "debug"] as const)
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      consoleCalls.push(args);
    });
});

afterEach(() => {
  cleanup();
  // Nothing PointrMap does writes a key anywhere it can be read.
  const written = JSON.stringify(consoleCalls.map((args) => args.map(String)));
  expect(written).not.toContain(CLIENT);
  expect(written).not.toContain(LICENSE);
  vi.restoreAllMocks();
  expect(pageMapOwnedForTests()).toBe(false);
});

interface Recorded {
  statuses: [MapReadiness, PointrMapError | undefined][];
  errors: PointrMapError[];
  props: Partial<PointrMapProps>;
}

function recorder(): Recorded {
  const recorded: Recorded = { statuses: [], errors: [], props: {} };
  recorded.props = {
    onStatusChange: (status, error) => recorded.statuses.push([status, error]),
    onError: (error) => recorded.errors.push(error),
    onReady: vi.fn(),
    onPoiSelect: vi.fn(),
    onLevelChange: vi.fn(),
    onBuildingChange: vi.fn(),
    onSiteChange: vi.fn(),
  };
  return recorded;
}

const lastStatus = (r: Recorded) => r.statuses.at(-1)?.[0];

async function mountReady(
  props: Partial<PointrMapProps> = {},
  options: { strict?: boolean } = {},
) {
  const recorded = recorder();
  const ref = React.createRef<PointrMapHandle>();
  const element = (
    <div style={{ width: 800, height: 600 }}>
      <PointrMap ref={ref} config={config} {...recorded.props} {...props} />
    </div>
  );
  const view = render(
    options.strict ? <React.StrictMode>{element}</React.StrictMode> : element,
  );
  await serveSdkFiles();
  await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
  const widget = FakeWidget.instance!;
  await act(async () => {
    widget.loadData();
  });
  await waitFor(() => expect(lastStatus(recorded)).toBe("ready"));
  return { ...view, recorded, ref, widget, map: widget.view()!.map! };
}

describe("loading the SDK", () => {
  it("adds the pinned script and stylesheet once, with their integrity", async () => {
    render(<PointrMap config={config} />);
    const files = await serveSdkFiles();
    const script = files.find(
      (f) => f.tagName === "SCRIPT",
    ) as HTMLScriptElement;
    const style = files.find((f) => f.tagName === "LINK") as HTMLLinkElement;
    // Attributes, as the browser reads them (jsdom reflects no `integrity`).
    expect(script.src).toBe(
      "https://pointr-websdk.azureedge.net/10.13.0/pointrwebsdk.js",
    );
    expect(script.getAttribute("integrity")).toBe(
      POINTR_SDK_VERSIONS["10.13.0"].script,
    );
    expect(script.getAttribute("crossorigin")).toBe("anonymous");
    expect(style.rel).toBe("stylesheet");
    expect(style.href).toBe(
      "https://pointr-websdk.azureedge.net/10.13.0/css/pointr.css",
    );
    expect(style.getAttribute("integrity")).toBe(
      POINTR_SDK_VERSIONS["10.13.0"].style,
    );
    expect(style.getAttribute("crossorigin")).toBe("anonymous");
    await waitFor(() => expect(FakeWidget.constructed).toBe(1));
  });
});

describe("lifecycle", () => {
  it("starts one widget with every SDK interface off and only options the SDK knows", async () => {
    const { container, widget } = await mountReady();
    expect(FakeWidget.constructed).toBe(1);
    const options = FakeOptions.made[0];
    expect(options.unknownKeys).toEqual([]);
    expect(options.values).toEqual({
      container: "pointr-map",
      baseUrl: "https://pointr-map-test.invalid",
      clientIdentifier: CLIENT,
      licenseKey: LICENSE,
      siteInternalIdentifier: "s-1",
      buildingInternalIdentifier: "b-1",
      levelIndex: 0,
      language: "en",
      personaIdentifier: "visitor",
      mapMaxZoom: 21,
      isSearchEnabled: false,
      isPoiDetailsEnabled: false,
      isZoomControlEnabled: false,
      isLanguageSelectorEnabled: false,
      isNavigationEnabled: false,
      isAccessibilityEnabled: false,
      isQuickAccessEnabled: false,
      isAppBannerEnabled: false,
    });
    expect(widget.started).toBe(1);
    expect(container.querySelectorAll("#pointr-map")).toHaveLength(1);
  });

  it("draws into a Kozmos MapView, hides the chrome Kozmos draws, and never the watermark", async () => {
    const { container } = await mountReady({ mapLabel: "Campus map" });
    const surface = container.querySelector(
      "[data-pointr-map-status]",
    ) as HTMLElement;
    expect(surface.getAttribute("aria-label")).toBe("Campus map");
    expect(surface.getAttribute("role")).toBe("group"); // MapView's fill variant
    expect(surface.style.isolation).toBe("isolate");
    expect(surface.dataset.pointrMapStatus).toBe("ready");
    const css = surface.querySelector("style")!.textContent!;
    for (const id of [
      "pointr-levels",
      "pointr-exit-button",
      "pointr-info-button",
    ])
      expect(css).toContain(`#pointr-map #${id}`);
    expect(css).not.toMatch(/watermark/i);
  });

  it("counts a session before start so the first-visit card stays closed", async () => {
    const { widget } = await mountReady();
    expect(widget.sessionCountAtStart).toBe("1");
  });

  it("leaves a session count the SDK already keeps", async () => {
    localStorage.setItem("sessionCount", "7");
    const { widget } = await mountReady();
    expect(widget.sessionCountAtStart).toBe("7");
  });

  it("removes the map on unmount: 3D models off, destroyMap, then destroy", async () => {
    const { unmount, widget, map, container } = await mountReady();
    const controller = widget.ui!.mapViewController;
    unmount();
    expect(controller.destroyMapCalls).toEqual([false]);
    expect(map.removed).toBe(true);
    expect(widget.destroyed).toBe(true);
    expect(FakeWidget.instance).toBeUndefined();
    expect(container.querySelector("#pointr-map")).toBeNull();
    expect(map.count("idle")).toBe(0);
  });

  it("mounts again after an unmount, with one live map", async () => {
    const first = await mountReady();
    first.unmount();
    const second = await mountReady();
    expect(FakeWidget.constructed).toBe(2);
    expect(first.map.removed).toBe(true);
    expect(second.map.removed).toBe(false);
    expect(FakeWidget.instance).toBe(second.widget);
  });

  it("is StrictMode safe: one widget, no error, nothing left after unmount", async () => {
    const { unmount, recorded, widget, map } = await mountReady(
      {},
      { strict: true },
    );
    expect(FakeWidget.constructed).toBe(1);
    expect(recorded.errors).toEqual([]);
    unmount();
    expect(widget.destroyed).toBe(true);
    expect(map.removed).toBe(true);
  });

  it("starts again when the config changes", async () => {
    const { rerender, widget, recorded } = await mountReady();
    rerender(
      <div>
        <PointrMap config={{ ...config, level: 2 }} {...recorded.props} />
      </div>,
    );
    await waitFor(() => expect(FakeWidget.constructed).toBe(2));
    expect(widget.destroyed).toBe(true);
    expect(FakeOptions.made[1].values.levelIndex).toBe(2);
  });

  it("does not start again for a config that is equal but a new object", async () => {
    const { rerender, recorded } = await mountReady();
    rerender(
      <div>
        <PointrMap config={{ ...config }} {...recorded.props} />
      </div>,
    );
    await act(async () => {});
    expect(FakeWidget.constructed).toBe(1);
  });

  it("refuses a second PointrMap with an instance error, leaving the first", async () => {
    const first = await mountReady();
    const second = recorder();
    const { container } = render(
      <PointrMap config={config} {...second.props} />,
    );
    await waitFor(() => expect(second.errors).toHaveLength(1));
    expect(second.errors[0].code).toBe("instance");
    expect(second.errors[0].fatal).toBe(true);
    expect(lastStatus(second)).toBe("error");
    expect(container.querySelector("#pointr-map")).toBeNull();
    expect(FakeWidget.constructed).toBe(1);
    expect(first.widget.destroyed).toBe(false);
    expect(first.container.querySelectorAll("#pointr-map")).toHaveLength(1);
  });

  it("refuses a second PointrMap at once, before the SDK has even loaded", async () => {
    render(<PointrMap config={config} />);
    const second = recorder();
    render(<PointrMap config={config} {...second.props} />);
    await waitFor(() => expect(second.errors).toHaveLength(1));
    expect(second.errors[0].code).toBe("instance");
    expect(
      document.head.querySelectorAll("[data-kozmos-pointr-sdk]"),
    ).toHaveLength(2);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.constructed).toBe(1));
    expect(second.errors).toHaveLength(1);
  });

  it("frees the page's map and its element id when the SDK refuses the widget", async () => {
    FakeWidget.refuseNext = true;
    const recorded = recorder();
    const { container } = render(
      <PointrMap config={config} {...recorded.props} />,
    );
    await serveSdkFiles();
    await waitFor(() => expect(recorded.errors).toHaveLength(1));
    expect(recorded.errors[0].code).toBe("instance");
    expect(container.querySelector("#pointr-map")).toBeNull();
    expect(pageMapOwnedForTests()).toBe(false);
  });

  it("refuses to take over a MapWidget something else made, and leaves it alone", async () => {
    installFakeSdk();
    const theirs = new FakeWidget(new FakeOptions({ container: "elsewhere" }));
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await waitFor(() => expect(recorded.errors).toHaveLength(1));
    expect(recorded.errors[0].code).toBe("instance");
    expect(theirs.destroyed).toBe(false);
    theirs.destroy();
  });
});

describe("padding", () => {
  const insets: MapCollisionInsets = {
    top: 12,
    right: 432,
    bottom: 0,
    left: 0,
  };

  it("gives the shell's insets to the map as soon as it is drawn", async () => {
    const { map } = await mountReady({ padding: insets });
    expect(map.padding).toEqual(insets);
  });

  it("puts them back when the camera rests after the SDK resets them on a POI click", async () => {
    const { map, widget } = await mountReady({ padding: insets });
    widget.clickPoi(new FakePoi(poiData()));
    expect(map.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    map.emit("idle");
    expect(map.padding).toEqual(insets);
  });

  it("follows a change of the insets, and does not set equal ones again", async () => {
    const { map, rerender, recorded } = await mountReady({ padding: insets });
    const calls = map.setPaddingCalls.length;
    map.emit("idle");
    expect(map.setPaddingCalls).toHaveLength(calls);
    const sheet = { top: 0, right: 0, bottom: 456, left: 0 };
    rerender(
      <div>
        <PointrMap config={config} padding={sheet} {...recorded.props} />
      </div>,
    );
    expect(map.padding).toEqual(sheet);
  });
});

function poiData(overrides: Record<string, unknown> = {}) {
  return {
    properties: {
      fid: "poi-7",
      name: "Cafe",
      name_tr: "Kafe",
      description: "Coffee and cake",
      lvl: 2,
      bid: "b-1",
      sid: "s-1",
      mainType: "food-drink",
      subType: "cafe",
      isFeatured: true,
      ...overrides,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [10, 50],
          [12, 50],
          [12, 54],
          [10, 54],
          [10, 50],
        ],
      ],
    },
  };
}

describe("events, as contract shapes", () => {
  it("a POI click is a selected result, and the SDK's own highlight comes off", async () => {
    const { widget, recorded } = await mountReady();
    widget.clickPoi(new FakePoi(poiData()));
    expect(widget.unhighlights).toBe(1);
    expect(recorded.props.onPoiSelect).toHaveBeenCalledWith({
      poi: {
        id: "poi-7",
        name: "Cafe",
        categoryId: "cafe",
        floorId: "2",
        floorLabel: "Second floor",
        buildingId: "b-1",
        buildingLabel: "Main building",
        description: "Coffee and cake",
        media: [],
        actions: [],
      },
      result: {
        poiId: "poi-7",
        resultIndex: 1,
        selected: true,
        featured: true,
        floorId: "2",
      },
      coordinates: [11, 52],
      levelIndex: 2,
    });
  });

  it("names a POI in the SDK's language when the POI has the translation", async () => {
    const { widget, recorded } = await mountReady({
      config: { ...config, language: "tr" },
    });
    widget.clickPoi(new FakePoi(poiData()));
    const item = vi.mocked(recorded.props.onPoiSelect!).mock.calls[0][0];
    expect(item.poi.name).toBe("Kafe");
  });

  it("reports the site, the building with its floors top first, and the level", async () => {
    const { recorded } = await mountReady();
    expect(recorded.props.onSiteChange).toHaveBeenLastCalledWith({
      id: "s-1",
      label: "Campus",
      buildings: [expect.objectContaining({ id: "b-1" })],
    });
    const building = {
      id: "b-1",
      label: "Main building",
      siteId: "s-1",
      floors: [
        { id: "2", label: "Second floor", shortLabel: "2" },
        { id: "1", label: "First floor", shortLabel: "1" },
        { id: "0", label: "Ground floor", shortLabel: "G" },
      ],
    };
    expect(recorded.props.onBuildingChange).toHaveBeenLastCalledWith(building);
    expect(recorded.props.onLevelChange).toHaveBeenLastCalledWith(
      { id: "0", label: "Ground floor", shortLabel: "G" },
      building,
    );
  });

  it("converts the view's level, building and site events", async () => {
    const { widget, recorded } = await mountReady();
    const view = widget.view()!;
    view.emit("level-changed", 1);
    expect(recorded.props.onLevelChange).toHaveBeenLastCalledWith(
      { id: "1", label: "First floor", shortLabel: "1" },
      expect.objectContaining({ id: "b-1" }),
    );
    // The payload's levels are plain objects, not Level instances.
    view.emit("current-building-changed", {
      newCurrentBuilding: {
        buildingInternalIdentifier: "b-2",
        siteInternalIdentifier: "s-1",
        buildingTitle: "Annex",
        levels: [{ levelIndex: 0, levelShortTitle: "", levelLongTitle: "" }],
      },
    });
    expect(recorded.props.onBuildingChange).toHaveBeenLastCalledWith({
      id: "b-2",
      label: "Annex",
      siteId: "s-1",
      floors: [{ id: "0", label: "0", shortLabel: "0" }],
    });
    view.emit("current-building-changed", { newCurrentBuilding: undefined });
    expect(recorded.props.onBuildingChange).toHaveBeenLastCalledWith(undefined);
    view.emit("current-site-changed", {
      newSite: {
        siteInternalIdentifier: "s-2",
        siteTitle: "Airport",
        buildings: [],
      },
    });
    expect(recorded.props.onSiteChange).toHaveBeenLastCalledWith({
      id: "s-2",
      label: "Airport",
      buildings: [],
    });
  });
});

describe("the handle", () => {
  it("map() is the MapLibre map once drawn", async () => {
    const { ref, map, recorded } = await mountReady();
    expect(ref.current!.map()).toBe(map);
    expect(recorded.props.onReady).toHaveBeenCalledWith(map);
  });

  it("search() answers in contract shapes, numbered from 1, scoped to the open building", async () => {
    const { ref, widget } = await mountReady();
    widget.searchResults = [
      new FakePoi(poiData()),
      new FakePoi(
        poiData({ fid: "poi-8", name: "Bakery", isFeatured: false, lvl: 0 }),
      ),
      new FakePoi(poiData()), // the same POI twice is one result
    ];
    const response = await ref.current!.search("caf");
    expect(widget.searches[0]).toEqual({
      query: "caf",
      site: widget.currentSite,
      building: widget.currentBuilding,
    });
    expect(
      response.results.map((r) => [r.poiId, r.resultIndex, r.selected]),
    ).toEqual([
      ["poi-7", 1, false],
      ["poi-8", 2, false],
    ]);
    expect(response.items[1].poi).toMatchObject({
      id: "poi-8",
      name: "Bakery",
      floorLabel: "Ground floor",
    });
    expect(response.appliedScope).toEqual({
      kind: "building",
      id: "b-1",
      label: "Main building",
    });
    expect(response.emptyKind).toBeUndefined();
  });

  it("search() over the site passes no building, and says when nothing matched", async () => {
    const { ref, widget } = await mountReady();
    const response = await ref.current!.search("zzz", { scope: "site" });
    expect(widget.searches[0].building).toBeUndefined();
    expect(response).toEqual({ results: [], items: [], emptyKind: "noMatch" });
  });

  it("search() before the map is ready rejects with a PointrMapError", async () => {
    const ref = React.createRef<PointrMapHandle>();
    render(<PointrMap ref={ref} config={config} />);
    await expect(ref.current!.search("caf")).rejects.toMatchObject({
      name: "PointrMapError",
      code: "data",
      fatal: false,
    });
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
  });

  it("setLevel() hands the SDK its own Level instance, by index or a floor's id", async () => {
    const { ref, widget } = await mountReady();
    expect(ref.current!.setLevel("2")).toBe(true);
    expect(widget.setLevelCalls.at(-1)).toBeInstanceOf(FakeLevel);
    expect(widget.currentLevel?.levelIndex).toBe(2);
    expect(ref.current!.setLevel(1)).toBe(true);
    expect(widget.currentLevel?.levelIndex).toBe(1);
    expect(ref.current!.setLevel(9)).toBe(false);
  });

  it("flyToPoi() changes level, keeps the SDK's highlight off and flies with the padding", async () => {
    const insets = { top: 0, right: 432, bottom: 0, left: 0 };
    const { ref, widget, map } = await mountReady({ padding: insets });
    widget.searchResults = [new FakePoi(poiData())];
    await ref.current!.search("caf");
    expect(ref.current!.flyToPoi("poi-7")).toBe(true);
    expect(widget.currentLevel?.levelIndex).toBe(2);
    expect(widget.unhighlights).toBeGreaterThan(0);
    expect(map.flights.at(-1)).toEqual({
      center: [11, 52],
      zoom: 19.5,
      padding: insets,
    });
    expect(ref.current!.flyToPoi("unknown")).toBe(false);
  });

  it("is safe before the map is ready", () => {
    const ref = React.createRef<PointrMapHandle>();
    render(<PointrMap ref={ref} config={config} />);
    expect(ref.current!.map()).toBeUndefined();
    expect(ref.current!.flyToPoi("poi-7")).toBe(false);
    expect(ref.current!.setLevel(1)).toBe(false);
  });
});

describe("errors, mapped to a code and the shell's status", () => {
  async function failsWith(props: Partial<PointrMapProps>) {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} {...props} />);
    await waitFor(() => expect(recorded.errors.length).toBeGreaterThan(0));
    return recorded;
  }

  it.each([
    ["no base URL", { ...config, baseUrl: "" }],
    ["a base URL that is not one", { ...config, baseUrl: "pointr" }],
    ["no keys", { ...config, auth: {} as never }],
    [
      "a licence key without its client",
      { ...config, auth: { licenseKey: LICENSE } as never },
    ],
    ["a building without its site", { ...config, site: undefined }],
    ["a level that is not an index", { ...config, level: 1.5 }],
    [
      "an SDK version with no integrity",
      { ...config, sdkVersion: "9.0.0" as never },
    ],
  ])("config: %s, before anything loads", async (_, bad) => {
    const recorded = await failsWith({ config: bad as PointrMapConfig });
    expect(recorded.errors[0].code).toBe("config");
    expect(lastStatus(recorded)).toBe("error");
    expect(document.head.querySelector("[data-kozmos-pointr-sdk]")).toBeNull();
    expect(FakeWidget.constructed).toBe(0);
  });

  it("auth: an expired cloud token, before anything loads", async () => {
    const recorded = await failsWith({
      config: {
        ...config,
        auth: { cloudToken: token({ exp: 1, clientIdentifiers: ["x"] }) },
      },
    });
    expect(recorded.errors[0].code).toBe("auth");
    expect(recorded.errors[0].message).not.toContain("eyJ");
    expect(FakeWidget.constructed).toBe(0);
  });

  it("config: a cloud token that names no client needs clientIdentifier", async () => {
    const recorded = await failsWith({
      config: {
        ...config,
        auth: { cloudToken: token({ exp: 4_102_444_800 }) },
      },
    });
    expect(recorded.errors[0].code).toBe("config");
  });

  it("a cloud token goes to the SDK in place of the keys", async () => {
    const cloudToken = token({
      exp: 4_102_444_800,
      clientIdentifiers: ["from-token"],
    });
    await mountReady({ config: { ...config, auth: { cloudToken } } });
    const values = FakeOptions.made[0].values;
    expect(values.pointrCloudToken).toBe(cloudToken);
    expect(values).not.toHaveProperty("licenseKey");
    expect(values).not.toHaveProperty("clientIdentifier");
  });

  it("storage: a sandbox without localStorage is unsupported", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    const recorded = await failsWith({});
    expect(recorded.errors[0].code).toBe("storage");
    expect(lastStatus(recorded)).toBe("unsupported");
  });

  it("webgl: no WebGL context is unsupported", async () => {
    giveWebGL(false);
    const recorded = await failsWith({});
    expect(recorded.errors[0].code).toBe("webgl");
    expect(lastStatus(recorded)).toBe("unsupported");
    expect(document.head.querySelector("[data-kozmos-pointr-sdk]")).toBeNull();
  });

  it("script: the SDK's script does not arrive, and its elements are taken away", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await failSdkFile("script");
    await waitFor(() => expect(recorded.errors).toHaveLength(1));
    expect(recorded.errors[0].code).toBe("script");
    expect(lastStatus(recorded)).toBe("error");
    expect(document.head.querySelector("[data-kozmos-pointr-sdk]")).toBeNull();
  });

  it("script: offline, the status says so", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await failSdkFile("style");
    await waitFor(() => expect(recorded.errors).toHaveLength(1));
    expect(recorded.errors[0].code).toBe("script");
    expect(lastStatus(recorded)).toBe("offline");
  });

  function violation(blockedURI: string, effectiveDirective: string) {
    const event = new Event("securitypolicyviolation");
    Object.assign(event, {
      blockedURI,
      effectiveDirective,
      violatedDirective: effectiveDirective,
    });
    document.dispatchEvent(event);
  }

  it("csp: a policy that blocks the SDK's script is named as one", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await waitFor(() =>
      expect(
        document.head.querySelector("script[data-kozmos-pointr-sdk]"),
      ).not.toBeNull(),
    );
    violation(
      "https://pointr-websdk.azureedge.net/10.13.0/pointrwebsdk.js",
      "script-src-elem",
    );
    await failSdkFile("script");
    await waitFor(() =>
      expect(recorded.statuses.some(([s]) => s === "error")).toBe(true),
    );
    const fatal = recorded.errors.find((e) => e.fatal)!;
    expect(fatal.code).toBe("csp");
    expect(fatal.message).toContain("https://pointr-websdk.azureedge.net");
    expect(fatal.message).not.toContain("pointrwebsdk.js");
  });

  it("csp: blocked blob: workers stop the map at once; a blocked tile host is reported only", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    violation(
      "https://fake-account.blob.core.windows.net/x/y.pbf?sv=2020&sig=secret",
      "connect-src",
    );
    violation("https://unrelated.example.com/a.js", "script-src");
    expect(recorded.errors).toHaveLength(1);
    expect(recorded.errors[0]).toMatchObject({ code: "csp", fatal: false });
    expect(recorded.errors[0].message).toContain(
      "https://fake-account.blob.core.windows.net",
    );
    expect(recorded.errors[0].message).not.toContain("sig=");
    expect(lastStatus(recorded)).toBe("loading");
    violation("blob", "worker-src");
    expect(recorded.errors.at(-1)).toMatchObject({ code: "csp", fatal: true });
    expect(lastStatus(recorded)).toBe("error");
  });

  it("auth: the SDK's error before its loading view is the keys', and its own error page is not drawn", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    const widget = FakeWidget.instance!;
    act(() => widget.failAuth());
    expect(recorded.errors[0]).toMatchObject({ code: "auth", fatal: true });
    expect(lastStatus(recorded)).toBe("error");
    expect(widget.ui!.sdkErrorPages).toEqual([]);
  });

  it("data: the SDK's error after its loading view is the data's; a popup is not fatal", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    const widget = FakeWidget.instance!;
    act(() =>
      widget.failData({ errorMsg: "Cannot set navigationStartPoi" }, true),
    );
    expect(recorded.errors[0]).toMatchObject({ code: "data", fatal: false });
    expect(lastStatus(recorded)).toBe("loading");
    act(() => widget.failData());
    expect(recorded.errors[1]).toMatchObject({ code: "data", fatal: true });
    expect(lastStatus(recorded)).toBe("error");
  });

  it("config: the Cloud refusing the site is the config's", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    act(() =>
      FakeWidget.instance!.failData({
        errorTitle: "Invalid settings",
        errorMsg:
          "SDK failed to start - specified site(s-1) could not be found",
      }),
    );
    expect(recorded.errors[0].code).toBe("config");
  });

  it("webgl: the SDK failing to draw is WebGL's", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    act(() =>
      FakeWidget.instance!.failData(
        new Error("Could not create a WebGL context"),
      ),
    );
    expect(recorded.errors[0].code).toBe("webgl");
    expect(lastStatus(recorded)).toBe("unsupported");
  });

  it("an SDK message that carries a key, a token or a signed URL is written without them", async () => {
    const recorded = recorder();
    render(<PointrMap config={config} {...recorded.props} />);
    await serveSdkFiles();
    await waitFor(() => expect(FakeWidget.instance?.started).toBe(1));
    const jwt = token({ sub: "x" });
    act(() =>
      FakeWidget.instance!.failAuth(
        `licenseKey(${LICENSE}) for ${CLIENT} refused; token ${jwt}; https://fake-account.blob.core.windows.net/c?sig=abc`,
      ),
    );
    const message = recorded.errors[0].message;
    expect(message).not.toContain(LICENSE);
    expect(message).not.toContain(CLIENT);
    expect(message).not.toContain(jwt);
    expect(message).not.toContain("sig=abc");
    expect(message).toContain("<redacted>");
  });

  it("data: a map that never becomes ready times out, and a late one is still ready", async () => {
    const recorded = recorder();
    render(
      <PointrMap config={config} readyTimeoutMs={20} {...recorded.props} />,
    );
    await serveSdkFiles();
    await waitFor(() => expect(recorded.errors).toHaveLength(1));
    expect(recorded.errors[0].code).toBe("data");
    expect(lastStatus(recorded)).toBe("error");
    await act(async () => {
      FakeWidget.instance!.loadData();
    });
    await waitFor(() => expect(lastStatus(recorded)).toBe("ready"));
  });
});
