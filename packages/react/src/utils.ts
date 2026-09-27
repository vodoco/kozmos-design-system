import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system's own scales, taught to tailwind-merge.
 *
 * tailwind-merge resolves conflicts from a table of known class groups. It
 * knows `rounded-sm` and `rounded-full`; it has never heard of `rounded-pill`
 * or `rounded-control`, so it did not treat them as the same property and kept
 * both — leaving CSS order to decide. That is why
 * `<Avatar className="rounded-control">` rendered as a pill: the component's
 * own `rounded-pill` and the caller's `rounded-control` both survived, and the
 * stylesheet had the last word. Found while rebuilding the SDK's POI detail
 * card, where the logo is a square and would not stop being a circle.
 *
 * Every role a component can carry has to be listed here, or overriding it
 * from outside silently does nothing. The values mirror
 * `packages/react/tailwind.config.js`; the standard scale is already known and
 * is not repeated.
 */
const RADIUS_ROLES = [
  "none",
  "marker",
  "control",
  "container",
  "panel",
  "pill",
  "card",
  "input",
  "button",
] as const;

const ELEVATION_ROLES = ["raised", "floating", "overlay"] as const;

const BORDER_WIDTHS = ["sm", "md", "lg"] as const;

/** `rounded-*` has a group per corner and per side, and each needs the roles. */
const ROUNDED_GROUPS = [
  "rounded",
  "rounded-s",
  "rounded-e",
  "rounded-t",
  "rounded-r",
  "rounded-b",
  "rounded-l",
  "rounded-ss",
  "rounded-se",
  "rounded-ee",
  "rounded-es",
  "rounded-tl",
  "rounded-tr",
  "rounded-br",
  "rounded-bl",
] as const;

const roundedClassGroups = Object.fromEntries(
  ROUNDED_GROUPS.map((group) => [group, [{ [group]: [...RADIUS_ROLES] }]]),
);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      ...roundedClassGroups,
      shadow: [{ shadow: [...ELEVATION_ROLES] }],
      "border-w": [{ border: [...BORDER_WIDTHS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Combine caller and component-owned accessibility ID references. */
export function mergeAriaIds(...values: (string | undefined)[]) {
  const ids = values.flatMap((value) => value?.trim().split(/\s+/) ?? []);
  return [...new Set(ids.filter(Boolean))].join(" ") || undefined;
}

/**
 * A POI's floor and building, joined the way every platform joins them.
 *
 * Kotlin and Swift both derive this on the model with " · ". The web had no
 * shared derivation, so two components each built it by hand — and
 * POIDetailPanel had drifted to " / " while POIResultCard used " · ", which is
 * the same place described two ways in one product.
 *
 * Exported, so a product composing its own row joins them identically rather
 * than inventing a third separator.
 */
export function poiLocationLabel(poi: {
  floorLabel?: string;
  buildingLabel?: string;
}): string {
  return [poi.floorLabel, poi.buildingLabel].filter(Boolean).join(" · ");
}
