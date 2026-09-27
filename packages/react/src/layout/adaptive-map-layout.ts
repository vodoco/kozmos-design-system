import type {
  AdaptiveMapLayout,
  MapCollisionInsets,
  MapLayoutRect,
  MapPanelPresentation,
} from "@kozmos-ds/product-contracts";
type LayoutRect = MapLayoutRect;
type LayoutInsets = MapCollisionInsets;
export interface AdaptiveMapLayoutInput {
  width: number;
  height: number;
  hasPanel: boolean;
  direction?: "ltr" | "rtl";
  panelPlacement?: "start" | "end";
  panelPresentation?: MapPanelPresentation;
  panelFraction?: number;
  /** Space required by measured map chrome before allocating bottom-panel height. */
  minimumMapHeight?: number;
  /** Exclusions the map and the panel both keep out of, e.g. a keyboard. */
  safeAreaInsets?: Partial<LayoutInsets>;
  /**
   * The device's safe areas — the status bar, a notch, the home indicator —
   * which the map runs under and the chrome keeps: a floating panel sits
   * inside them; a bottom sheet's surface reaches the edge and its content
   * keeps them.
   */
  chromeInsets?: Partial<LayoutInsets>;
  /** Host supplies hinge-free regions, already converted to shell-local units. */
  usableRegions?: readonly LayoutRect[];
}

export const emptyInsets: LayoutInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
const positive = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, value!) : 0;

export function intersectRect(a: LayoutRect, b: LayoutRect): LayoutRect {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x),
    height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y),
  };
}

/** React policy for the shared contract; geometry never owns product state. */
export function resolveAdaptiveMapLayout(
  input: AdaptiveMapLayoutInput,
): AdaptiveMapLayout {
  const width = positive(input.width),
    height = positive(input.height);
  const safe = input.safeAreaInsets ?? emptyInsets;
  const x = Math.min(width, positive(safe.left)),
    y = Math.min(height, positive(safe.top));
  const bounds = {
    x,
    y,
    width: Math.max(0, width - x - positive(safe.right)),
    height: Math.max(0, height - y - positive(safe.bottom)),
  };
  const regions = (input.usableRegions ?? [bounds])
    .filter(
      (region) =>
        Object.values(region).every(Number.isFinite) &&
        region.width > 0 &&
        region.height > 0,
    )
    .map((region) => intersectRect(region, bounds))
    .filter((region) => region.width > 0 && region.height > 0)
    .sort(
      (a, b) =>
        b.width * b.height - a.width * a.height || a.y - b.y || a.x - b.x,
    );
  const mapBounds = regions[0] ?? { ...bounds, width: 0, height: 0 };
  const onRight =
    (input.panelPlacement !== "start") === (input.direction !== "rtl");
  const other = regions
    .slice(1)
    .find(
      (region) =>
        region.width >= 240 &&
        region.height >= 120 &&
        intersectRect(region, mapBounds).width *
          intersectRect(region, mapBounds).height ===
          0,
    );
  if (
    input.hasPanel &&
    input.panelPresentation !== "bottom" &&
    input.panelPresentation !== "side" &&
    other &&
    mapBounds.width >= 240 &&
    mapBounds.height >= 120
  ) {
    // Keep map above the panel for tabletop; otherwise respect logical placement.
    const vertical =
      Math.min(mapBounds.y + mapBounds.height, other.y + other.height) <=
      Math.max(mapBounds.y, other.y);
    const panelFirst = vertical
      ? mapBounds.y > other.y
      : onRight
        ? mapBounds.x > other.x
        : mapBounds.x < other.x;
    return {
      mapBounds: panelFirst ? other : mapBounds,
      panelBounds: panelFirst ? mapBounds : other,
      presentation: "separated",
    };
  }
  // Leave at least 128px of panel height after the two 16px gutters.
  const side =
    input.panelPresentation === "side" ||
    (input.panelPresentation !== "bottom" &&
      mapBounds.width >= 720 &&
      mapBounds.height >= 160);
  const presentation = side ? "side" : "bottom";
  if (!input.hasPanel || !mapBounds.width || !mapBounds.height)
    return { mapBounds, panelBounds: null, presentation };
  const chrome = input.chromeInsets ?? emptyInsets;
  if (side) {
    // The floating panel keeps the device's safe areas around it.
    const safeMap = intersectRect(mapBounds, {
      x: mapBounds.x + positive(chrome.left),
      y: mapBounds.y + positive(chrome.top),
      width: Math.max(
        0,
        mapBounds.width - positive(chrome.left) - positive(chrome.right),
      ),
      height: Math.max(
        0,
        mapBounds.height - positive(chrome.top) - positive(chrome.bottom),
      ),
    });
    const gap = Math.min(16, safeMap.width / 4, safeMap.height / 4);
    const panelWidth = Math.min(
      416,
      safeMap.width * 0.42,
      Math.max(0, safeMap.width - 2 * gap),
    );
    return {
      mapBounds,
      presentation,
      panelBounds: {
        x: onRight
          ? safeMap.x + safeMap.width - gap - panelWidth
          : safeMap.x + gap,
        y: safeMap.y + gap,
        width: panelWidth,
        height: Math.max(0, safeMap.height - 2 * gap),
      },
    };
  }
  // The bottom sheet's usable range and resting share: the detents'
  // (components/AdaptiveMapShell/panel-detents.ts — medium, 0.12–0.94).
  const fraction = Number.isFinite(input.panelFraction)
    ? Math.min(0.94, Math.max(0.12, input.panelFraction!))
    : 0.54;
  const panelHeight = Math.min(
    mapBounds.height * fraction,
    Math.max(0, mapBounds.height - positive(input.minimumMapHeight)),
  );
  if (!panelHeight) return { mapBounds, presentation, panelBounds: null };
  return {
    mapBounds,
    presentation,
    panelBounds: {
      x: mapBounds.x,
      y: mapBounds.y + mapBounds.height - panelHeight,
      width: mapBounds.width,
      height: panelHeight,
    },
  };
}

/** Conservative edge padding relative to mapBounds; internal exclusions remain rectangles. */
export function resolveMapInsets(
  map: LayoutRect,
  chrome: readonly { bounds: LayoutRect; edge: keyof LayoutInsets }[],
  supplied: Partial<LayoutInsets> = {},
): LayoutInsets {
  const result = {
    top: positive(supplied.top),
    right: positive(supplied.right),
    bottom: positive(supplied.bottom),
    left: positive(supplied.left),
  };
  for (const { bounds, edge } of chrome) {
    const overlap = intersectRect(map, bounds);
    if (!overlap.width || !overlap.height) continue;
    const value =
      edge === "top"
        ? overlap.y + overlap.height - map.y
        : edge === "bottom"
          ? map.y + map.height - overlap.y
          : edge === "left"
            ? overlap.x + overlap.width - map.x
            : map.x + map.width - overlap.x;
    result[edge] = Math.max(result[edge], value);
  }
  // An entirely obscured map has zero usable space, never negative dimensions.
  result.left = Math.min(result.left, map.width);
  result.right = Math.min(result.right, map.width - result.left);
  result.top = Math.min(result.top, map.height);
  result.bottom = Math.min(result.bottom, map.height - result.top);
  return result;
}
