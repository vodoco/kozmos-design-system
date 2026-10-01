/**
 * An invented shopping centre: its floors, the categories Kozmos can draw an
 * icon for, and its places. Positions are percentages of the illustrative map.
 */
import type { CategoryTint, IconProps } from "@kozmos-ds/react";
import type {
  FloorPresentation,
  POIDetailsPresentation,
  POIPresentation,
  UserLocationState,
} from "@kozmos-ds/product-contracts";

type IconName = NonNullable<IconProps["name"]>;

/** The taxonomy's eight quick-access colours, as Kozmos tokens. */
type TintName =
  | "yellow"
  | "orange"
  | "turquoise"
  | "red"
  | "blue"
  | "navy"
  | "green"
  | "pink";

export function tint(name: TintName): CategoryTint {
  return {
    accent: `var(--semantics-category-accent-${name})`,
    fill: `var(--semantics-category-fill-${name})`,
    onFill: `var(--semantics-category-on-fill-${name})`,
  };
}

export const venueName = "Riverside Centre";

export const floors: readonly FloorPresentation[] = [
  { id: "2", label: "Second floor", shortLabel: "2" },
  { id: "1", label: "First floor", shortLabel: "1" },
  { id: "g", label: "Ground floor", shortLabel: "G" },
];

export function floorLabel(id: string) {
  return floors.find((floor) => floor.id === id)?.label ?? id;
}

export interface VenueCategory {
  id: string;
  label: string;
  icon: IconName;
  tint: TintName;
}

/**
 * Food and drink, toilets, accessible facilities, parking and first aid are
 * a venue's most used categories and are missing here: `Icon` names none of
 * them, and toilets and parking have no Kozmos glyph at all (GAPS.md, GAP-15).
 */
export const categories: readonly VenueCategory[] = [
  { id: "shops", label: "Shops", icon: "shopping-bag-02", tint: "blue" },
  {
    id: "information",
    label: "Information",
    icon: "info-circle",
    tint: "turquoise",
  },
  { id: "transport", label: "Transport", icon: "bus", tint: "green" },
  { id: "events", label: "Events", icon: "calendar", tint: "orange" },
  { id: "offices", label: "Offices", icon: "building-01", tint: "navy" },
  { id: "wifi", label: "Wi-Fi zones", icon: "wifi", tint: "pink" },
];

export function categoryFor(id: string | undefined) {
  return categories.find((category) => category.id === id);
}

export interface Place {
  poi: POIPresentation;
  details: POIDetailsPresentation;
  /** Where its pin sits on the illustrative map, in percent. */
  position: { x: number; y: number };
  /** Minutes on foot from the ground-floor entrance. */
  minutes: number;
}

const weekdayHours = (open: string, close: string) => ({
  label: "Opening hours",
  summary: `Open today until ${close}`,
  rows: [
    { id: "mon-fri", day: "Monday to Friday", hours: `${open} to ${close}` },
    { id: "sat", day: "Saturday", hours: `${open} to ${close}` },
    { id: "sun", day: "Sunday", hours: "11:00 to 17:00" },
  ],
});

function place(
  id: string,
  name: string,
  categoryId: string,
  floorId: string,
  position: Place["position"],
  minutes: number,
  description: string,
  extra: Partial<POIPresentation> = {},
  details: POIDetailsPresentation = {},
): Place {
  const category = categoryFor(categoryId);
  return {
    poi: {
      id,
      name,
      categoryId,
      categoryLabel: category?.label,
      floorId,
      floorLabel: floorLabel(floorId),
      buildingLabel: venueName,
      media: [],
      availability: "open",
      availabilityLabel: "Open",
      description,
      actions: ["navigate", "favourite", "share"],
      ...extra,
    },
    details: {
      travelEstimate: {
        durationSeconds: minutes * 60,
        durationLabel: `${minutes} min`,
        distanceMetres: minutes * 70,
        distanceLabel: `${minutes * 70} m`,
        mode: "walking",
        modeLabel: "on foot",
      },
      ...details,
    },
    position,
    minutes,
  };
}

export const places: readonly Place[] = [
  place(
    "books",
    "Bookshop",
    "shops",
    "1",
    { x: 24, y: 30 },
    3,
    "New and second-hand books, with a reading corner by the window.",
    {},
    { openingHours: weekdayHours("09:00", "20:00") },
  ),
  place(
    "outdoor",
    "Outdoor clothing",
    "shops",
    "g",
    { x: 68, y: 26 },
    2,
    "Waterproofs, boots and camping gear.",
    {},
    { openingHours: weekdayHours("09:30", "19:00") },
  ),
  place(
    "electronics",
    "Electronics",
    "shops",
    "2",
    { x: 38, y: 58 },
    5,
    "Phones, laptops and repairs while you wait.",
    {},
    { openingHours: weekdayHours("10:00", "20:00") },
  ),
  place(
    "info-desk",
    "Information desk",
    "information",
    "g",
    { x: 50, y: 48 },
    1,
    "Maps, directions, wheelchair loans and lost children.",
  ),
  place(
    "lost-property",
    "Lost property",
    "information",
    "1",
    { x: 76, y: 70 },
    4,
    "Hand in or collect anything left in the centre.",
    { availability: "closed", availabilityLabel: "Closed until 10:00" },
  ),
  place(
    "bus",
    "Bus interchange",
    "transport",
    "g",
    { x: 18, y: 78 },
    3,
    "Local and regional buses from stands A to F.",
  ),
  place(
    "taxi",
    "Taxi rank",
    "transport",
    "g",
    { x: 84, y: 82 },
    4,
    "Licensed taxis, day and night.",
  ),
  place(
    "hall",
    "Community hall",
    "events",
    "2",
    { x: 70, y: 32 },
    6,
    "Markets, classes and exhibitions. Check the board for today’s events.",
  ),
  place(
    "terrace",
    "Rooftop terrace",
    "events",
    "2",
    { x: 22, y: 76 },
    7,
    "Open-air seating with a view over the river.",
    { availability: "unknown", availabilityLabel: "Weather permitting" },
  ),
  place(
    "offices",
    "Co-working offices",
    "offices",
    "2",
    { x: 54, y: 22 },
    6,
    "Desks and meeting rooms by the hour. Reception on arrival.",
  ),
  place(
    "wifi-lounge",
    "Wi-Fi lounge",
    "wifi",
    "1",
    { x: 46, y: 50 },
    3,
    "Free fast Wi-Fi, sockets at every seat.",
  ),
];

/** The ground-floor entrance, where "my location" is in this example. */
export const userLocation = { floorId: "g", position: { x: 50, y: 88 } };

/**
 * What a press on the location control does, as the SDK's control does it
 * (decision 40): the map follows the visitor, then turns with them, then
 * stops. The states are the contracts' `UserLocationState`; a product moves
 * them with the device's position, which this example does not have.
 */
export function nextLocationState(state: UserLocationState): UserLocationState {
  if (state === "following") return "heading";
  if (state === "heading") return "off";
  return "following";
}

/**
 * The words under "Focus", as the SDK writes them: "On" while the map follows
 * or turns with the visitor, "No Location" alone where there is no position,
 * and "Off" otherwise. Every word is the product's to translate.
 */
export function locationStateLabel(state: UserLocationState) {
  if (state === "following" || state === "heading") return "On";
  if (state === "unavailable" || state === "permission-denied")
    return "No Location";
  return "Off";
}
