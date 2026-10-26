import type {
  FloorPresentation,
  POIPresentation,
  POIResultPresentation,
  SearchResponsePresentation,
  SearchScopePresentation,
} from "@kozmos-ds/product-contracts";
import type { SdkBuilding, SdkLevel, SdkPoi, SdkSite } from "./sdk";

/**
 * A building as the map reports it.
 *
 * `@kozmos-ds/product-contracts` has no building or site presentation
 * (GAP-175): these two are this package's until it does, built from the
 * contracts' own shapes so they can be replaced by them.
 */
export interface PointrBuildingPresentation {
  id: string;
  /** As the Pointr Cloud titles it; empty when it has no title. */
  label: string;
  siteId: string;
  /** Top floor first (decision 38). */
  floors: readonly FloorPresentation[];
}

/** A site as the map reports it. See PointrBuildingPresentation. */
export interface PointrSitePresentation {
  id: string;
  label: string;
  buildings: readonly PointrBuildingPresentation[];
}

/**
 * A POI the map selected or a search found: the two contract shapes a
 * `POIResultList` row takes, and where it is, for a `LocationPin` placed with
 * `map().project(coordinates)` and for `flyToPoi`.
 */
export interface PointrPoiItem {
  poi: POIPresentation;
  result: POIResultPresentation;
  /** `[longitude, latitude]`: a point's, or the centre of a shape's bounds, as the SDK centres it. */
  coordinates?: readonly [number, number];
  levelIndex?: number;
}

/** A search's answer: the contract's response, and the rows to draw it with. */
export interface PointrSearchResponse extends SearchResponsePresentation {
  items: readonly PointrPoiItem[];
}

const words = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : undefined;

/**
 * An identifier the SDK may hold as a string or a number: one rule for every
 * id (site, building, POI). Null, undefined, an empty or blank string and a
 * number that is not finite are no id.
 */
const identifier = (value: unknown) =>
  (typeof value === "string" && value.trim() !== "") ||
  (typeof value === "number" && Number.isFinite(value))
    ? String(value)
    : undefined;

const index = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
};

/** A level as a floor. Its labels are the Cloud's titles; with none, its index. */
export function toFloor(
  level: SdkLevel | undefined,
): FloorPresentation | undefined {
  const levelIndex = index(level?.levelIndex);
  if (levelIndex === undefined) return undefined;
  const short = words(level?.levelShortTitle);
  const long = words(level?.levelLongTitle);
  return {
    id: String(levelIndex),
    label: long ?? short ?? String(levelIndex),
    shortLabel: short ?? String(levelIndex),
  };
}

/** A building's levels as floors, top floor first, each level once. */
export function toFloors(
  levels: readonly SdkLevel[] | undefined,
): FloorPresentation[] {
  const byId = new Map<string, FloorPresentation>();
  for (const level of levels ?? []) {
    const floor = toFloor(level);
    if (floor && !byId.has(floor.id)) byId.set(floor.id, floor);
  }
  return [...byId.values()].sort((a, b) => Number(b.id) - Number(a.id));
}

export function toBuilding(
  building: SdkBuilding | undefined,
): PointrBuildingPresentation | undefined {
  const id = identifier(building?.buildingInternalIdentifier);
  if (!building || !id) return undefined;
  return {
    id,
    label: words(building.buildingTitle) ?? "",
    siteId: identifier(building.siteInternalIdentifier) ?? "",
    floors: toFloors(building.levels),
  };
}

export function toSite(
  site: SdkSite | undefined,
): PointrSitePresentation | undefined {
  const id = identifier(site?.siteInternalIdentifier);
  if (!site || !id) return undefined;
  return {
    id,
    label: words(site.siteTitle) ?? "",
    buildings: (site.buildings ?? [])
      .map(toBuilding)
      .filter((b): b is PointrBuildingPresentation => b !== undefined),
  };
}

/** The bounds' centre of a POI's geometry, as the SDK's own `getCenterOfPoi` (turf's center) takes it. */
export function poiCoordinates(
  geometry: SdkPoi["geometry"],
): readonly [number, number] | undefined {
  if (!geometry) return undefined;
  const points: [number, number][] = [];
  const walk = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      points.push([value[0], value[1]]);
      return;
    }
    for (const part of value) walk(part);
  };
  walk(geometry.coordinates);
  if (!points.length) return undefined;
  // The SDK's features are GeoJSON, but one without a type is centred on its
  // bounds rather than thrown on inside the SDK's event emitter.
  if (
    typeof geometry.type === "string" &&
    geometry.type.toLowerCase() === "point"
  )
    return points[0];
  let [minX, minY] = points[0];
  let [maxX, maxY] = points[0];
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

/** A Poi instance keeps its fields behind getters; a plain feature has them outright. */
function poiProperties(poi: SdkPoi): Record<string, unknown> {
  const raw = poi as SdkPoi & { _properties?: Record<string, unknown> };
  return raw.properties ?? raw._properties ?? {};
}

function translated(
  properties: Record<string, unknown>,
  field: string,
  language: string | undefined,
) {
  if (language) {
    const own =
      words(properties[`${field}_${language}`]) ??
      words(properties[`${field}_${language.toLowerCase()}`]);
    if (own) return own;
  }
  return words(properties[field]);
}

export interface PoiContext {
  /** The SDK's language code, for `name_<code>`. */
  language?: string;
  /** The open building, for the floor's and the building's labels. */
  building?: PointrBuildingPresentation;
  /** Counted from 1. */
  resultIndex: number;
  selected: boolean;
}

/** The POI's id, `properties.fid`, which every SDK event and search uses. */
export function poiId(poi: SdkPoi | undefined): string | undefined {
  return poi ? identifier(poiProperties(poi).fid) : undefined;
}

/**
 * A Pointr POI as the contracts' POI and result. The product decides what a
 * POI offers, so `actions` is empty, and `media` is empty because an alt text
 * is the product's to write. Undefined for a feature with no id or name.
 */
export function toPoiItem(
  poi: SdkPoi | undefined,
  context: PoiContext,
): PointrPoiItem | undefined {
  const id = poiId(poi);
  if (!poi || !id) return undefined;
  const properties = poiProperties(poi);
  const name = translated(properties, "name", context.language);
  if (!name) return undefined;
  const levelIndex = index(properties.lvl ?? properties.levelIndex);
  const floorId = levelIndex !== undefined ? String(levelIndex) : undefined;
  const building = context.building;
  const buildingId = identifier(properties.bid);
  const floor =
    floorId !== undefined && (!buildingId || buildingId === building?.id)
      ? building?.floors.find((f) => f.id === floorId)
      : undefined;
  const category = words(properties.subType) ?? words(properties.mainType);
  const description = translated(properties, "description", context.language);
  const featured =
    properties.isFeatured === true || properties.isFeatured === "true";
  const presentation: POIPresentation = {
    id,
    name,
    ...(category ? { categoryId: category } : {}),
    ...(floorId !== undefined ? { floorId } : {}),
    ...(floor ? { floorLabel: floor.label } : {}),
    ...(buildingId ? { buildingId } : {}),
    ...(buildingId && buildingId === building?.id && building.label
      ? { buildingLabel: building.label }
      : {}),
    ...(description ? { description } : {}),
    media: [],
    actions: [],
  };
  const result: POIResultPresentation = {
    poiId: id,
    resultIndex: context.resultIndex,
    selected: context.selected,
    featured,
    ...(floorId !== undefined ? { floorId } : {}),
  };
  const coordinates = poiCoordinates(poi.geometry);
  return {
    poi: presentation,
    result,
    ...(coordinates ? { coordinates } : {}),
    ...(levelIndex !== undefined ? { levelIndex } : {}),
  };
}

/** A search's POIs as the contracts' response, numbered from 1 in the SDK's order. */
export function toSearchResponse(
  found: readonly SdkPoi[],
  context: Omit<PoiContext, "resultIndex" | "selected"> & {
    scope?: SearchScopePresentation;
  },
): PointrSearchResponse {
  const items: PointrPoiItem[] = [];
  const seen = new Set<string>();
  for (const poi of found) {
    const id = poiId(poi);
    if (!id || seen.has(id)) continue;
    const item = toPoiItem(poi, {
      ...context,
      resultIndex: items.length + 1,
      selected: false,
    });
    if (!item) continue;
    seen.add(id);
    items.push(item);
  }
  return {
    results: items.map((item) => item.result),
    items,
    ...(items.length ? {} : { emptyKind: "noMatch" as const }),
    ...(context.scope ? { appliedScope: context.scope } : {}),
  };
}
