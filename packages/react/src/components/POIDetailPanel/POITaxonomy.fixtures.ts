/** Product-adapter example, not a public design-system API or a live SDK parser.
 * Snapshot provenance is embedded in the JSON. No runtime taxonomy fetch. */
import type {
  POIDetailAttributeGroup,
  POIDetailSummary,
  POIServicePresentation,
} from "@kozmos-ds/product-contracts";
import snapshot from "./taxonomy-10.12.0.fixture.json";

interface ValueDisplay {
  displayName?: string;
  iconUrl?: string;
  color?: string;
}
interface PropertyDefinition {
  valueType: string;
  segment: string;
  iconUrl?: string;
  validation: {
    min?: number;
    max?: number;
    options?: readonly string[];
    type: string;
  };
  display: ValueDisplay & {
    order?: number;
    highlight?: number;
    action?: string;
    valueDisplay?: Record<string, ValueDisplay>;
  };
}
const dictionary: Record<string, PropertyDefinition> = snapshot.properties;
const own = <T>(record: Record<string, T>, key: string): T | undefined =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
const tones: Record<string, NonNullable<POIDetailSummary["tone"]>> = {
  theme_successColor: "success",
  theme_alertColor: "warning",
  theme_dangerColor: "danger",
  theme_themeColor: "brand",
};
// Product presentation policy from the supplied highlighted-property references.
// The dictionary also supplies order for these; that alone does not mean duplicate them.
const highlightOnly = new Set([
  "rating",
  "priceRange",
  "crowdLevel",
  "waitTime",
  "occupancyStatus",
]);

export function presentTaxonomyProperties(
  values: Readonly<Record<string, unknown>>,
  options: {
    /** Object schemas (notably rating) are not defined by this taxonomy version. */
    customHighlights?: Readonly<Record<string, POIDetailSummary>>;
    formatWait?: (minutes: number) => string;
  } = {},
) {
  const groups = new Map<string, POIDetailAttributeGroup>();
  const highlights: { order: number; item: POIDetailSummary }[] = [];
  const issues: string[] = [];
  for (const key of Object.keys(values))
    if (!own(dictionary, key)) issues.push(`Unknown property: ${key}`);
  const entries = Object.entries(dictionary).sort(
    ([, a], [, b]) =>
      (a.display.order ?? Infinity) - (b.display.order ?? Infinity),
  );
  for (const [key, definition] of entries) {
    const raw = own(values, key);
    if (
      raw === undefined ||
      raw === null ||
      raw === "" ||
      (Array.isArray(raw) && raw.length === 0)
    )
      continue;
    const { display, valueType } = definition;
    // Contact actions, content objects and internal identifiers are not generic tags.
    if (
      display.action ||
      (display.order === undefined && display.highlight === undefined)
    )
      continue;
    const custom = own(options.customHighlights ?? {}, key);
    if (custom && display.highlight !== undefined) {
      highlights.push({
        order: display.highlight,
        item: { ...custom, id: key },
      });
      continue;
    }
    const validScalar = (
      value: unknown,
    ): value is string | number | boolean => {
      if (valueType === "boolean") return typeof value === "boolean";
      if (valueType === "integer")
        return (
          typeof value === "number" &&
          Number.isSafeInteger(value) &&
          value >= (definition.validation.min ?? -Infinity) &&
          value <= (definition.validation.max ?? Infinity)
        );
      return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        (!definition.validation.options ||
          definition.validation.options.includes(value))
      );
    };
    if (
      valueType === "object" ||
      !["array", "enum", "boolean", "integer", "text"].includes(valueType)
    ) {
      issues.push(`Requires a specialized formatter: ${key}`);
      continue;
    }
    if (valueType === "array" ? !Array.isArray(raw) : Array.isArray(raw)) {
      issues.push(`Invalid value shape: ${key}`);
      continue;
    }
    const items: POIServicePresentation[] = [];
    for (const value of [...new Set(Array.isArray(raw) ? raw : [raw])]) {
      if (!validScalar(value)) {
        issues.push(`Invalid value: ${key}`);
        continue;
      }
      const resolved = own(display.valueDisplay ?? {}, String(value));
      // false only has visible meaning when explicitly named (e.g. wheelchair access).
      if (value === false && !resolved) continue;
      const iconUrl =
        resolved?.iconUrl ??
        (valueType === "boolean" || valueType === "integer"
          ? definition.iconUrl
          : undefined);
      items.push({
        id: `${key}:${String(value)}`,
        label: resolved?.displayName ?? String(value),
        ...(iconUrl ? { iconUrl, iconMonochrome: true } : {}),
      });
    }
    if (!items.length) continue;
    if (display.highlight !== undefined) {
      const resolved = own(display.valueDisplay ?? {}, String(raw));
      const color = resolved?.color ?? display.color;
      highlights.push({
        order: display.highlight,
        item: {
          id: key,
          kind: key === "priceRange" ? "price" : "property",
          label: display.displayName ?? key,
          value:
            valueType === "array"
              ? (display.displayName ?? key)
              : items[0].label,
          ...(key === "priceRange"
            ? { priceLevel: raw as 1 | 2 | 3 | 4, value: `${raw} of 4` }
            : {}),
          ...(key === "waitTime"
            ? {
                value: (options.formatWait ?? ((n) => `${n} min wait`))(
                  raw as number,
                ),
              }
            : {}),
          ...(key !== "priceRange" && (resolved?.iconUrl ?? definition.iconUrl)
            ? {
                iconUrl: resolved?.iconUrl ?? definition.iconUrl,
                iconMonochrome: true,
              }
            : {}),
          tone: color ? (own(tones, color) ?? "neutral") : "neutral",
        },
      });
    }
    if (
      display.order !== undefined &&
      !highlightOnly.has(key) &&
      !["description", "tags"].includes(key)
    ) {
      const id = definition.segment;
      const previous = groups.get(id);
      groups.set(id, {
        id,
        heading: id,
        items: [...(previous?.items ?? []), ...items],
      });
    }
  }
  const crowd = highlights.find(({ item }) => item.id === "crowdLevel");
  const wait = highlights.find(({ item }) => item.id === "waitTime");
  if (crowd && wait) crowd.item.detail = wait.item.value;
  return {
    groups: [...groups.values()],
    summary: highlights
      .filter((entry) => !(crowd && entry === wait))
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map(({ item }) => item),
    issues,
  };
}
