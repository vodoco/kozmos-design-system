import type { createPointrIcon } from "./pointr/createPointrIcon";
import type { createTaxonomyIcon } from "./taxonomy/createTaxonomyIcon";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell01,
  Bookmark,
  Building01,
  Bus,
  Calendar,
  CalendarCheck01,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ClockPlus,
  Compass01,
  Download01,
  Edit01,
  Eye,
  Feather,
  FlipBackward,
  Globe02,
  Heart,
  HomeLine,
  InfoCircle,
  LayoutAlt02,
  Loading01,
  Lock01,
  Mail01,
  Map01,
  MarkerPin01,
  Menu01,
  Minus,
  NavigationPointer01,
  Phone,
  Plus,
  QrCode01,
  Route,
  Scan,
  SearchMd,
  Settings01,
  Share01,
  ShoppingBag02,
  Stars01,
  SwitchVertical01,
  Trash01,
  Upload01,
  User01,
  Users01,
  Wifi,
  XClose,
} from "./pointr/icons.generated";

export const kozmosIconNames = [
  "activity",
  "alert-circle",
  "alert-triangle",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "bell-01",
  "building-01",
  "bus",
  "calendar",
  "check",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "clock",
  "compass-01",
  "download-01",
  "edit-01",
  "flip-backward",
  "home-line",
  "info-circle",
  "lock-01",
  "map-01",
  "marker-pin-01",
  "menu-01",
  "minus",
  "navigation-pointer-01",
  "plus",
  "qr-code-01",
  "route",
  "scan",
  "search-md",
  "settings-01",
  "stars-01",
  "switch-vertical-01",
  "trash-01",
  "upload-01",
  "user-01",
  "users-01",
  "wifi",
  "x-close",

  // These were the first owned outlines, added when every name above still
  // resolved to the nearest lucide shape. Each was needed by the SDK's POI
  // detail card and had no Kozmos name at all — see docs/poi-detail-card-gaps.
  // Every name in this registry is now drawn by the Pointr Icon Library, so
  // this grouping records history rather than a difference.
  "bookmark",
  "calendar-check-01",
  "clock-plus",
  "eye",
  "feather",
  "globe-02",
  "heart",
  "layout-alt-02",
  "loading-01",
  "mail-01",
  "phone",
  "share-01",
  "shopping-bag-02",

] as const;

export type KozmosIconName = (typeof kozmosIconNames)[number];

/**
 * An icon is an outline owned by this package or a taxonomy symbol, and both
 * are drawn from the Pointr Icon Library's own artwork. Until 2026-09-23 this
 * union had a third arm, `LucideIcon`, and 43 of the 64 names resolved to it:
 * the same concept in a different hand from the one Figma shows. Every one had
 * an exact Pointr equivalent by name, so nothing here maps onto a near-miss
 * any more. Both take the same props, so a consumer cannot tell them apart.
 */
export type KozmosIconComponent =
  | ReturnType<typeof createPointrIcon>
  | ReturnType<typeof createTaxonomyIcon>;

interface KozmosIconDefinitionBase {
  name: KozmosIconName;
  figmaName: string;
  category: string;
  description: string;
  component: KozmosIconComponent;
}

/** An icon of the Pointr Icon Library, at its node there. */
export interface KozmosPointrIconDefinition extends KozmosIconDefinitionBase {
  source?: "pointr";
  figmaNodeId: string;
}

/**
 * A quick-access symbol the taxonomy publishes, which has no node in the icon
 * library: `figmaName` is its published name without the colour, and
 * `taxonomyVersion` the release it was taken from.
 */
export interface KozmosTaxonomyIconDefinition extends KozmosIconDefinitionBase {
  source: "taxonomy";
  taxonomyVersion: string;
}

export type KozmosIconDefinition =
  | KozmosPointrIconDefinition
  | KozmosTaxonomyIconDefinition;

export const kozmosIconDefinitions: readonly KozmosIconDefinition[] = [
  {
    name: "activity",
    figmaName: "activity",
    figmaNodeId: "1007:9735",
    category: "General",
    description: "Activity and status pulse.",
    component: Activity,
  },
  {
    name: "alert-circle",
    figmaName: "alert-circle",
    figmaNodeId: "1007:10316",
    category: "Alerts & feedback",
    description: "Circular warning or validation alert.",
    component: AlertCircle,
  },
  {
    name: "alert-triangle",
    figmaName: "alert-triangle",
    figmaNodeId: "1007:10328",
    category: "Alerts & feedback",
    description: "Triangular warning alert.",
    component: AlertTriangle,
  },
  {
    name: "arrow-down",
    figmaName: "arrow-down",
    figmaNodeId: "1007:9277",
    category: "Arrows",
    description:
      "Directional arrow down: a level, lift, escalator or stairs down in a direction step.",
    component: ArrowDown,
  },
  {
    name: "arrow-left",
    figmaName: "arrow-left",
    figmaNodeId: "1007:9286",
    category: "Arrows",
    description: "Directional arrow left.",
    component: ArrowLeft,
  },
  {
    name: "arrow-right",
    figmaName: "arrow-right",
    figmaNodeId: "1007:9313",
    category: "Arrows",
    description: "Directional arrow right.",
    component: ArrowRight,
  },
  {
    name: "arrow-up",
    figmaName: "arrow-up",
    figmaNodeId: "1007:9340",
    category: "Arrows",
    description:
      "Directional arrow up: straight on, or a level, lift, escalator or stairs up in a direction step.",
    component: ArrowUp,
  },
  {
    name: "bell-01",
    figmaName: "bell-01",
    figmaNodeId: "1007:10340",
    category: "General",
    description: "Notification bell.",
    component: Bell01,
  },
  {
    name: "building-01",
    figmaName: "building-01",
    figmaNodeId: "1007:9771",
    category: "General",
    description: "Building or venue.",
    component: Building01,
  },
  {
    name: "bus",
    figmaName: "bus",
    figmaNodeId: "1007:11761",
    category: "Maps & travel",
    description: "Bus transit mode.",
    component: Bus,
  },
  {
    name: "calendar",
    figmaName: "calendar",
    figmaNodeId: "1007:11518",
    category: "Time",
    description: "Calendar date picker.",
    component: Calendar,
  },
  {
    name: "check",
    figmaName: "check",
    figmaNodeId: "1007:9795",
    category: "General",
    description: "Confirmation check mark.",
    component: Check,
  },
  {
    name: "chevron-down",
    figmaName: "chevron-down",
    figmaNodeId: "1007:9364",
    category: "Arrows",
    description: "Chevron down.",
    component: ChevronDown,
  },
  {
    name: "chevron-left",
    figmaName: "chevron-left",
    figmaNodeId: "1007:9370",
    category: "Arrows",
    description: "Chevron left.",
    component: ChevronLeft,
  },
  {
    name: "chevron-right",
    figmaName: "chevron-right",
    figmaNodeId: "1007:9376",
    category: "Arrows",
    description: "Chevron right.",
    component: ChevronRight,
  },
  {
    name: "chevron-up",
    figmaName: "chevron-up",
    figmaNodeId: "1007:9388",
    category: "Arrows",
    description: "Chevron up.",
    component: ChevronUp,
  },
  {
    name: "clock",
    figmaName: "clock",
    figmaNodeId: "1007:11548",
    category: "Time",
    description: "Clock or time.",
    component: Clock,
  },
  {
    name: "compass-01",
    figmaName: "compass-01",
    figmaNodeId: "1007:11770",
    category: "Maps & travel",
    description: "Compass navigation.",
    component: Compass01,
  },
  {
    name: "download-01",
    figmaName: "download-01",
    figmaNodeId: "1007:9873",
    category: "General",
    description: "Download action.",
    component: Download01,
  },
  {
    name: "edit-01",
    figmaName: "edit-01",
    figmaNodeId: "1007:10179",
    category: "General",
    description: "Edit action.",
    component: Edit01,
  },
  {
    name: "flip-backward",
    figmaName: "flip-backward",
    figmaNodeId: "1007:9436",
    category: "Arrows",
    description: "Turn back: the direction step that reverses.",
    component: FlipBackward,
  },
  {
    name: "home-line",
    figmaName: "home-line",
    figmaNodeId: "1007:10275",
    category: "General",
    description: "Home navigation.",
    component: HomeLine,
  },
  {
    name: "info-circle",
    figmaName: "info-circle",
    figmaNodeId: "1007:10281",
    category: "Alerts & feedback",
    description: "Informational message.",
    component: InfoCircle,
  },
  {
    name: "lock-01",
    figmaName: "lock-01",
    figmaNodeId: "1007:8883",
    category: "Security",
    description: "Locked or private state.",
    component: Lock01,
  },
  {
    name: "map-01",
    figmaName: "map-01",
    figmaNodeId: "1007:11824",
    category: "Maps & travel",
    description: "Map view.",
    component: Map01,
  },
  {
    name: "marker-pin-01",
    figmaName: "marker-pin-01",
    figmaNodeId: "1007:11833",
    category: "Maps & travel",
    description: "Map pin or destination marker.",
    component: MarkerPin01,
  },
  {
    name: "menu-01",
    figmaName: "menu-01",
    figmaNodeId: "1007:10077",
    category: "General",
    description: "Navigation menu.",
    component: Menu01,
  },
  {
    name: "minus",
    figmaName: "minus",
    figmaNodeId: "1007:10092",
    category: "General",
    description: "Remove, collapse, or decrement.",
    component: Minus,
  },
  {
    name: "navigation-pointer-01",
    figmaName: "navigation-pointer-01",
    figmaNodeId: "1007:11851",
    category: "Maps & travel",
    description: "Navigation pointer.",
    component: NavigationPointer01,
  },
  {
    name: "plus",
    figmaName: "plus",
    figmaNodeId: "1007:10119",
    category: "General",
    description: "Add or expand.",
    component: Plus,
  },
  {
    name: "qr-code-01",
    figmaName: "qr-code-01",
    figmaNodeId: "1007:9176",
    category: "Development",
    description: "QR code.",
    component: QrCode01,
  },
  {
    name: "route",
    figmaName: "route",
    figmaNodeId: "1007:11875",
    category: "Maps & travel",
    description: "Route or path.",
    component: Route,
  },
  {
    name: "scan",
    figmaName: "scan",
    figmaNodeId: "1007:8919",
    category: "Security",
    description: "Scan frame.",
    component: Scan,
  },
  {
    name: "search-md",
    figmaName: "search-md",
    figmaNodeId: "1007:10140",
    category: "General",
    description: "Search action.",
    component: SearchMd,
  },
  {
    name: "settings-01",
    figmaName: "settings-01",
    figmaNodeId: "1007:10149",
    category: "General",
    description: "Settings.",
    component: Settings01,
  },
  {
    name: "stars-01",
    figmaName: "stars-01",
    figmaNodeId: "1007:11992",
    category: "Weather",
    description: "Sparkles: the AI search.",
    component: Stars01,
  },
  {
    name: "switch-vertical-01",
    figmaName: "switch-vertical-01",
    figmaNodeId: "1007:9487",
    category: "Arrows",
    description: "Swap the origin and the destination.",
    component: SwitchVertical01,
  },
  {
    name: "trash-01",
    figmaName: "trash-01",
    figmaNodeId: "1007:9963",
    category: "General",
    description: "Delete action.",
    component: Trash01,
  },
  {
    name: "upload-01",
    figmaName: "upload-01",
    figmaNodeId: "1007:9975",
    category: "General",
    description: "Upload action.",
    component: Upload01,
  },
  {
    name: "user-01",
    figmaName: "user-01",
    figmaNodeId: "1007:10494",
    category: "Users",
    description: "Single user.",
    component: User01,
  },
  {
    name: "users-01",
    figmaName: "users-01",
    figmaNodeId: "1007:10566",
    category: "Users",
    description: "User group.",
    component: Users01,
  },
  {
    name: "wifi",
    figmaName: "wifi",
    figmaNodeId: "1007:10913",
    category: "Media & devices",
    description: "Wireless connection.",
    component: Wifi,
  },
  {
    name: "x-close",
    figmaName: "x-close",
    figmaNodeId: "1007:9999",
    category: "General",
    description: "Close or dismiss.",
    component: XClose,
  },
  {
    name: "bookmark",
    figmaName: "bookmark",
    figmaNodeId: "1007:9756",
    category: "General",
    description: "Save for later.",
    component: Bookmark,
  },
  {
    name: "calendar-check-01",
    figmaName: "calendar-check-01",
    figmaNodeId: "1007:11521",
    category: "Time",
    description: "A booked or confirmed date.",
    component: CalendarCheck01,
  },
  {
    name: "clock-plus",
    figmaName: "clock-plus",
    figmaNodeId: "1007:11557",
    category: "Time",
    description: "Added or extended time, such as a wait.",
    component: ClockPlus,
  },
  {
    name: "eye",
    figmaName: "eye",
    figmaNodeId: "1007:10200",
    category: "General",
    description: "Show or preview.",
    component: Eye,
  },
  {
    name: "feather",
    figmaName: "feather",
    figmaNodeId: "1007:11303",
    category: "Editor",
    description: "Compose or write.",
    component: Feather,
  },
  {
    name: "globe-02",
    figmaName: "globe-02",
    figmaNodeId: "1007:11800",
    category: "Maps & travel",
    description: "A website or the wider web.",
    component: Globe02,
  },
  {
    name: "heart",
    figmaName: "heart",
    figmaNodeId: "1007:10224",
    category: "General",
    description: "Favourite.",
    component: Heart,
  },
  {
    name: "layout-alt-02",
    figmaName: "layout-alt-02",
    figmaNodeId: "1007:8614",
    category: "Layout",
    description: "A menu or listing laid out in sections.",
    component: LayoutAlt02,
  },
  {
    name: "loading-01",
    figmaName: "loading-01",
    figmaNodeId: "1007:10035",
    category: "General",
    description: "Work in progress.",
    component: Loading01,
  },
  {
    name: "mail-01",
    figmaName: "mail-01",
    figmaNodeId: "1007:11046",
    category: "Communication",
    description: "Email.",
    component: Mail01,
  },
  {
    name: "phone",
    figmaName: "phone",
    figmaNodeId: "1007:11145",
    category: "Communication",
    description: "Call.",
    component: Phone,
  },
  {
    name: "share-01",
    figmaName: "share-01",
    figmaNodeId: "1007:10161",
    category: "General",
    description: "Share.",
    component: Share01,
  },
  {
    name: "shopping-bag-02",
    figmaName: "shopping-bag-02",
    figmaNodeId: "1007:9693",
    category: "Finance & eCommerce",
    description: "Order or shop.",
    component: ShoppingBag02,
  },
];

// `/* @__PURE__ */` for the same reason each generated icon carries one: this
// is a call at module scope, and a bundler must assume a call can do something
// unless told otherwise. Without it, importing a single icon from this package
// retained the whole registry — measured on 2026-09-23 at 75 path definitions
// in a bundle that asked for one icon — because the lookup references every
// component the registry names.
export const kozmosIconRegistry = /* @__PURE__ */ Object.fromEntries(
  kozmosIconDefinitions.map((icon) => [icon.name, icon.component]),
) as Record<KozmosIconName, KozmosIconComponent>;

export const kozmosIconAliases = {
  add: "plus",
  back: "arrow-left",
  close: "x-close",
  delete: "trash-01",
  edit: "edit-01",
  home: "home-line",
  location: "marker-pin-01",
  "map-pin": "marker-pin-01",
  menu: "menu-01",
  next: "arrow-right",
  notifications: "bell-01",
  search: "search-md",
  settings: "settings-01",
  user: "user-01",
  users: "users-01",
  warning: "alert-triangle",
  x: "x-close",
} as const satisfies Record<string, KozmosIconName>;

export type KozmosIconAlias = keyof typeof kozmosIconAliases;
export type KozmosIconKey = KozmosIconName | KozmosIconAlias;

export function resolveIconName(name: KozmosIconKey): KozmosIconName {
  return kozmosIconAliases[name as KozmosIconAlias] ?? (name as KozmosIconName);
}

export function getIconComponent(
  name: KozmosIconKey,
): KozmosIconComponent | undefined {
  return kozmosIconRegistry[resolveIconName(name)];
}

export function getIconDefinition(
  name: KozmosIconKey,
): KozmosIconDefinition | undefined {
  const resolvedName = resolveIconName(name);
  return kozmosIconDefinitions.find((icon) => icon.name === resolvedName);
}

export function isKozmosIconKey(name: string): name is KozmosIconKey {
  return getIconComponent(name as KozmosIconKey) !== undefined;
}
