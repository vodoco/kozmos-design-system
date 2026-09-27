/**
 * Invented data the demos share: a shopping centre and an airport, places,
 * categories, floors and routes. Every value is made up and looks it.
 */
import type {
  CategoryPresentation,
  FloorPresentation,
  POIDetailsPresentation,
  POIPresentation,
  POIResultPresentation,
  RouteOptionPresentation,
} from "@kozmos-ds/product-contracts";
import type { CategoryTint } from "@kozmos-ds/react";

export function tint(name: string): CategoryTint {
  return {
    accent: `var(--semantics-category-accent-${name})`,
    fill: `var(--semantics-category-fill-${name})`,
    onFill: `var(--semantics-category-on-fill-${name})`,
  };
}

export const floors: readonly FloorPresentation[] = [
  { id: "2", label: "Second floor", shortLabel: "2" },
  { id: "1", label: "First floor", shortLabel: "1" },
  { id: "g", label: "Ground floor", shortLabel: "G" },
  { id: "-1", label: "Car park", shortLabel: "P" },
];

export const categories: readonly CategoryPresentation[] = [
  {
    id: "shops",
    label: "Shops",
    iconName: "shopping-bag-02",
    selected: false,
    resultCount: 24,
    resultCountLabel: "24 places",
  },
  {
    id: "information",
    label: "Information",
    iconName: "info-circle",
    selected: true,
    resultCount: 3,
    resultCountLabel: "3 places",
  },
  {
    id: "transport",
    label: "Transport",
    iconName: "bus",
    selected: false,
    resultCount: 6,
    resultCountLabel: "6 places",
  },
  {
    id: "events",
    label: "Events",
    iconName: "calendar",
    selected: false,
    resultCount: 2,
    resultCountLabel: "2 places",
  },
];

export const categoryTints: Record<string, string> = {
  shops: "blue",
  information: "turquoise",
  transport: "green",
  events: "orange",
};

export const bookshop: POIPresentation = {
  id: "bookshop",
  name: "Bookshop",
  categoryId: "shops",
  categoryLabel: "Shops",
  floorId: "1",
  floorLabel: "First floor",
  buildingLabel: "Riverside Centre",
  media: [],
  availability: "open",
  availabilityLabel: "Open until 20:00",
  description:
    "New and second-hand books, with a reading corner by the window.",
  services: [
    { id: "click-collect", label: "Click and collect" },
    { id: "gift-wrap", label: "Gift wrapping" },
  ],
  actions: ["navigate", "favourite", "share"],
};

export const bookshopDetails: POIDetailsPresentation = {
  travelEstimate: {
    durationSeconds: 180,
    durationLabel: "3 min",
    distanceMetres: 210,
    distanceLabel: "210 m",
    mode: "walking",
    modeLabel: "on foot",
  },
  summary: [
    {
      id: "rating",
      kind: "rating",
      label: "Rating",
      value: "4.6",
      detail: "312 reviews",
      tone: "brand",
    },
    { id: "price", kind: "price", label: "Price", value: "££", priceLevel: 2 },
    {
      id: "crowd",
      kind: "crowd",
      label: "Busy",
      value: "Quiet now",
      tone: "success",
    },
  ],
  openingHours: {
    label: "Opening hours",
    summary: "Open today until 20:00",
    rows: [
      { id: "mon-fri", day: "Monday to Friday", hours: "09:00 to 20:00" },
      { id: "sat", day: "Saturday", hours: "09:00 to 20:00" },
      { id: "sun", day: "Sunday", hours: "11:00 to 17:00" },
    ],
  },
  tags: [
    { id: "books", label: "Books" },
    { id: "cafe", label: "Café" },
    { id: "events", label: "Author events" },
  ],
};

export const places: readonly POIPresentation[] = [
  bookshop,
  {
    id: "info-desk",
    name: "Information desk",
    categoryId: "information",
    categoryLabel: "Information",
    floorId: "g",
    floorLabel: "Ground floor",
    buildingLabel: "Riverside Centre",
    media: [],
    availability: "open",
    availabilityLabel: "Open",
    description: "Maps, directions, wheelchair loans and lost children.",
    actions: ["navigate"],
  },
  {
    id: "bus",
    name: "Bus interchange",
    categoryId: "transport",
    categoryLabel: "Transport",
    floorId: "g",
    floorLabel: "Ground floor",
    buildingLabel: "Riverside Centre",
    media: [],
    availability: "unknown",
    availabilityLabel: "Hours unavailable",
    description: "Local and regional buses from stands A to F.",
    actions: ["navigate", "share"],
  },
];

export const results: readonly {
  poi: POIPresentation;
  result: POIResultPresentation;
}[] = places.map((poi, index) => ({
  poi,
  result: {
    poiId: poi.id,
    resultIndex: index + 1,
    selected: index === 0,
    featured: index === 0,
    floorId: poi.floorId,
    travelEstimate: {
      durationSeconds: 120 + index * 90,
      durationLabel: `${2 + index * 2} min`,
    },
  },
}));

export const routeOptions: readonly RouteOptionPresentation[] = [
  {
    id: "quickest",
    label: "Quickest",
    durationSeconds: 240,
    durationLabel: "4 min",
    distanceMetres: 280,
    distanceLabel: "280 m",
    preference: "quickest",
    selected: true,
    available: true,
  },
  {
    id: "step-free",
    label: "Step-free",
    durationSeconds: 360,
    durationLabel: "6 min",
    distanceMetres: 410,
    distanceLabel: "410 m",
    preference: "step-free",
    selected: false,
    available: true,
  },
  {
    id: "custom",
    label: "Via the terrace",
    durationSeconds: 540,
    durationLabel: "9 min",
    distanceMetres: 620,
    distanceLabel: "620 m",
    preference: "custom",
    selected: false,
    available: false,
    warning: "The terrace closes at 18:00.",
  },
];

export const itinerary = [
  { id: "1", type: "straight", instruction: "Head towards the atrium" },
  {
    id: "2",
    type: "left",
    instruction: "Turn left at the pharmacy",
    current: true,
  },
  {
    id: "3",
    type: "escalator-up",
    instruction: "Take the escalator to the first floor",
  },
  { id: "4", type: "right", instruction: "Turn right past the lifts" },
  { id: "5", type: "destination", instruction: "The bookshop is on your left" },
] as const;

export const comboboxOptions = [
  { value: "london", label: "London", description: "United Kingdom" },
  { value: "istanbul", label: "Istanbul", description: "Türkiye" },
  { value: "dubai", label: "Dubai", description: "United Arab Emirates" },
  { value: "new-york", label: "New York", description: "United States" },
  {
    value: "singapore",
    label: "Singapore",
    description: "Singapore",
    disabled: true,
  },
];

export const tableRows = [
  {
    venue: "Riverside Centre",
    city: "London",
    floors: 3,
    places: 148,
    status: "Live",
  },
  {
    venue: "Harbour Terminal",
    city: "Istanbul",
    floors: 2,
    places: 96,
    status: "Live",
  },
  {
    venue: "North Campus",
    city: "Dubai",
    floors: 5,
    places: 312,
    status: "Draft",
  },
  {
    venue: "Central Station",
    city: "Singapore",
    floors: 4,
    places: 205,
    status: "Review",
  },
];
