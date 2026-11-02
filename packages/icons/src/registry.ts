import type { createPointrIcon } from "./pointr/createPointrIcon";
import type { createTaxonomyIcon } from "./taxonomy/createTaxonomyIcon";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BatteryCharging01,
  Beaker01,
  Bell01,
  BluetoothOff,
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
  Clapperboard,
  Clock,
  ClockPlus,
  Compass01,
  CreditCard01,
  Download01,
  Droplets01,
  Edit01,
  Eye,
  Feather,
  FlipBackward,
  Globe02,
  GraduationHat01,
  Heart,
  HomeLine,
  InfoCircle,
  LayersThree01,
  LayoutAlt02,
  Loading01,
  Lock01,
  LogIn01,
  LogOut01,
  Luggage01,
  Mail01,
  Map01,
  MarkerPin01,
  MedicalCross,
  Menu01,
  Minus,
  NavigationPointer01,
  Package,
  Passport,
  Phone,
  Plane,
  Plus,
  QrCode01,
  Route,
  Scan,
  Scissors01,
  SearchMd,
  Settings01,
  Share01,
  ShoppingBag02,
  Stars01,
  SwitchVertical01,
  Ticket01,
  Trash01,
  Upload01,
  User01,
  Users01,
  Wifi,
  XClose,
} from "./pointr/icons.generated";
import {
  Arriving,
  CustomTransition,
  ElevatorDown,
  ElevatorUp,
  ElevatorUpAndDown,
  EscalatorDown,
  EscalatorNoDirection,
  EscalatorUp,
  FollowTheLine,
  HardLeft,
  HardRight,
  RampDown,
  RampNoDirection,
  RampUp,
  RouteEnter,
  RouteEntranceExit,
  RouteExit,
  SecurityControl,
  Shuttle,
  StairsDown,
  StairsNoDirection,
  StairsUp,
  TurnBack,
} from "./owned/navigation.generated";
import { Accessibility, Utensils, Walking } from "./owned/icons";

export const kozmosIconNames = [
  "activity",
  "alert-circle",
  "alert-triangle",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "bell-01",
  "bluetooth-off",
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
  // Every name to here is now drawn by the Pointr Icon Library, so this
  // grouping records history rather than a difference.
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

  // The venue set (GAP-105, decisions 119 and 121): a place's categories,
  // amenities and services, chosen from what the taxonomy's quick access
  // matches; packages/icons/README.md says how and what was left out. The
  // registry grows only by this set: a UI glyph stays a named import.
  "utensils",
  "medical-cross",
  "plane",
  "clapperboard",
  "graduation-hat-01",
  "beaker-01",
  "accessibility",
  "credit-card-01",
  "battery-charging-01",
  "droplets-01",
  "luggage-01",
  "passport",
  "ticket-01",
  "package",
  "scissors-01",
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

/**
 * An icon this package draws itself, because the Pointr Icon Library has no
 * such outline: owned/icons.ts says where each came from. The Figma plugin
 * carries its artwork and draws it on the Icons page.
 */
export interface KozmosOwnedIconDefinition extends KozmosIconDefinitionBase {
  source: "owned";
}

export type KozmosIconDefinition =
  | KozmosPointrIconDefinition
  | KozmosTaxonomyIconDefinition
  | KozmosOwnedIconDefinition;

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
    description: "Directional arrow down: a level down in a direction step.",
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
      "Directional arrow up: straight on, or a level up in a direction step.",
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
    name: "bluetooth-off",
    figmaName: "bluetooth-off",
    figmaNodeId: "1007:10625",
    category: "Media & devices",
    description: "Bluetooth is off: the map status pill's No Bluetooth.",
    component: BluetoothOff,
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
  {
    name: "utensils",
    figmaName: "Utensils",
    source: "owned",
    category: "Venue categories",
    description: "Food and drink: a restaurant, a café, a food court.",
    component: Utensils,
  },
  {
    name: "medical-cross",
    figmaName: "medical-cross",
    figmaNodeId: "1007:10071",
    category: "Venue categories",
    description: "Medical care: first aid, emergency, a clinic.",
    component: MedicalCross,
  },
  {
    name: "plane",
    figmaName: "plane",
    figmaNodeId: "1007:11868",
    category: "Venue categories",
    description: "Flights: a boarding gate.",
    component: Plane,
  },
  {
    name: "clapperboard",
    figmaName: "clapperboard",
    figmaNodeId: "1007:10637",
    category: "Venue categories",
    description: "Entertainment: a cinema, a theatre.",
    component: Clapperboard,
  },
  {
    name: "graduation-hat-01",
    figmaName: "graduation-hat-01",
    figmaNodeId: "1007:9017",
    category: "Venue categories",
    description: "Learning and study: a classroom, a lecture hall.",
    component: GraduationHat01,
  },
  {
    name: "beaker-01",
    figmaName: "beaker-01",
    figmaNodeId: "1007:8972",
    category: "Venue categories",
    description: "Research and labs: a laboratory.",
    component: Beaker01,
  },
  {
    name: "accessibility",
    figmaName: "Accessibility",
    source: "owned",
    category: "Venue amenities",
    description: "Accessible places and accessibility services.",
    component: Accessibility,
  },
  {
    name: "credit-card-01",
    figmaName: "credit-card-01",
    figmaNodeId: "1007:9540",
    category: "Venue amenities",
    description: "Pay or take out money: an ATM, a checkout.",
    component: CreditCard01,
  },
  {
    name: "battery-charging-01",
    figmaName: "battery-charging-01",
    figmaNodeId: "1007:10604",
    category: "Venue amenities",
    description: "Device charging: a charging station.",
    component: BatteryCharging01,
  },
  {
    name: "droplets-01",
    figmaName: "droplets-01",
    figmaNodeId: "1007:11950",
    category: "Venue amenities",
    description: "Drinking water: a water refill station.",
    component: Droplets01,
  },
  {
    name: "luggage-01",
    figmaName: "luggage-01",
    figmaNodeId: "1007:11815",
    category: "Venue services",
    description: "Check-in and baggage: bag drop, baggage reclaim.",
    component: Luggage01,
  },
  {
    name: "passport",
    figmaName: "passport",
    figmaNodeId: "1007:11863",
    category: "Venue services",
    description: "Passport control, customs and immigration.",
    component: Passport,
  },
  {
    name: "ticket-01",
    figmaName: "ticket-01",
    figmaNodeId: "1007:11878",
    category: "Venue services",
    description: "Tickets: a ticket office, a box office.",
    component: Ticket01,
  },
  {
    name: "package",
    figmaName: "package",
    figmaNodeId: "1007:9151",
    category: "Venue services",
    description: "Order collection: click and collect, parcel pickup.",
    component: Package,
  },
  {
    name: "scissors-01",
    figmaName: "scissors-01",
    figmaNodeId: "1007:11438",
    category: "Venue services",
    description: "A salon: hair and barber services.",
    component: Scissors01,
  },
];

// Every name and the component it draws, written out rather than built from
// the definitions, for what a lookup then leaves behind. A lookup needs a
// component, not its Figma node, category or description, and until 2026-11-02
// this was `Object.fromEntries(kozmosIconDefinitions.map(...))`, which kept all
// of them: 1.49 KB gzip of an app's 19.84 for words it never read. From
// 2026-09-23 to 2026-09-29 that call kept every icon from everything else as
// well, importing `Check` alone cost an app 11.49 KB gzip in 0.4.0, because
// only the outer call was marked `/* @__PURE__ */`. A literal needs no mark.
// scripts/check-icon-names.mjs holds it to the definitions, and
// tests/tree-shaking.test.mjs bundles single imports with both bundlers and
// fails if the registry or the definitions come back with them.
export const kozmosIconRegistry: Record<KozmosIconName, KozmosIconComponent> = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "bell-01": Bell01,
  "bluetooth-off": BluetoothOff,
  "building-01": Building01,
  bus: Bus,
  calendar: Calendar,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  clock: Clock,
  "compass-01": Compass01,
  "download-01": Download01,
  "edit-01": Edit01,
  "flip-backward": FlipBackward,
  "home-line": HomeLine,
  "info-circle": InfoCircle,
  "lock-01": Lock01,
  "map-01": Map01,
  "marker-pin-01": MarkerPin01,
  "menu-01": Menu01,
  minus: Minus,
  "navigation-pointer-01": NavigationPointer01,
  plus: Plus,
  "qr-code-01": QrCode01,
  route: Route,
  scan: Scan,
  "search-md": SearchMd,
  "settings-01": Settings01,
  "stars-01": Stars01,
  "switch-vertical-01": SwitchVertical01,
  "trash-01": Trash01,
  "upload-01": Upload01,
  "user-01": User01,
  "users-01": Users01,
  wifi: Wifi,
  "x-close": XClose,
  bookmark: Bookmark,
  "calendar-check-01": CalendarCheck01,
  "clock-plus": ClockPlus,
  eye: Eye,
  feather: Feather,
  "globe-02": Globe02,
  heart: Heart,
  "layout-alt-02": LayoutAlt02,
  "loading-01": Loading01,
  "mail-01": Mail01,
  phone: Phone,
  "share-01": Share01,
  "shopping-bag-02": ShoppingBag02,
  utensils: Utensils,
  "medical-cross": MedicalCross,
  plane: Plane,
  clapperboard: Clapperboard,
  "graduation-hat-01": GraduationHat01,
  "beaker-01": Beaker01,
  accessibility: Accessibility,
  "credit-card-01": CreditCard01,
  "battery-charging-01": BatteryCharging01,
  "droplets-01": Droplets01,
  "luggage-01": Luggage01,
  passport: Passport,
  "ticket-01": Ticket01,
  package: Package,
  "scissors-01": Scissors01,
};

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

  // The venue set's: what a product holds for a place. Each is a taxonomy
  // mainType or subType as Pointr publishes it (10.16.0), a `serviceTypes`
  // value in kebab case, or a word BrowseCategoriesPanel's stories pass as
  // `iconName`, and each stands for the one glyph that is that thing. A subType
  // several mainTypes share (desk, office, kiosk, lounge) means nothing alone,
  // and a type with no glyph (restroom-space, parking-space) has no alias: a
  // stand-in would say something else.
  "amenity-space": "info-circle",
  atm: "credit-card-01",
  "bag-drop-checkin": "luggage-01",
  "baggage-reclaim": "luggage-01",
  "baggage-services": "luggage-01",
  "boarding-gate": "plane",
  "bus-station": "bus",
  "charging-station": "battery-charging-01",
  checkout: "credit-card-01",
  "customs-immigration": "passport",
  "device-charging": "battery-charging-01",
  dining: "utensils",
  "education-space": "graduation-hat-01",
  elevator: "elevator-up-and-down",
  entrance: "route-enter",
  "entrance-exit": "route-entrance-exit",
  "entertainment-space": "clapperboard",
  escalator: "escalator-no-direction",
  exit: "route-exit",
  favourite: "heart",
  "first-aid": "medical-cross",
  "food-beverage-space": "utensils",
  hydration: "droplets-01",
  information: "info-circle",
  laboratory: "beaker-01",
  "medical-space": "medical-cross",
  "movie-theater": "clapperboard",
  "order-collect": "package",
  "passport-control": "passport",
  ramp: "ramp-no-direction",
  "retail-space": "shopping-bag-02",
  salon: "scissors-01",
  "security-space": "security-control",
  shopping: "shopping-bag-02",
  "shuttle-station": "shuttle",
  stairs: "stairs-no-direction",
  ticketing: "ticket-01",
  "transportation-space": "bus",
  "water-refill-station": "droplets-01",
  "wifi-zone": "wifi",
} as const satisfies Record<
  string,
  KozmosIconName | KozmosIconNameBeyondTheLibrary
>;

export type KozmosIconAlias = keyof typeof kozmosIconAliases;

/**
 * The names drawn beyond the curated library above (GAP-179, the owner's
 * approval of 21 Oct): the 23 wayfinding glyphs of Pointr Maps - Express, by
 * the kebab case of the names this package exports them under, four outlines
 * of the Pointr Icon Library, and the map controls' layers glyph and walking
 * figure (GAP-181): `layers-three-01` by its Pointr name, `walking` by the
 * kebab case of its export. SwiftUI's and Compose's `KozmosIcon` draw the
 * same names, and so did POIDetailPanel's tags, through a map of their own
 * until this list replaced it.
 *
 * They are not in `kozmosIconNames`: that list is the curated set the Figma
 * plugin's Icons page and Code Connect pair with the Pointr Icon Library, name
 * for name and key for key (scripts/check-component-contracts.mjs), and the
 * wayfinding glyphs come from another file. `kozmosIconDefinitions` describes
 * only the curated set.
 */
export const kozmosIconNamesBeyondTheLibrary = [
  "elevator-up",
  "elevator-down",
  "stairs-up",
  "stairs-down",
  "escalator-up",
  "escalator-down",
  "ramp-up",
  "ramp-down",
  "route-enter",
  "route-exit",
  "elevator-up-and-down",
  "escalator-no-direction",
  "stairs-no-direction",
  "ramp-no-direction",
  "route-entrance-exit",
  "hard-left",
  "hard-right",
  "turn-back",
  "follow-the-line",
  "arriving",
  "custom-transition",
  "security-control",
  "shuttle",
  "log-in-01",
  "log-out-01",
  "arrow-up-right",
  "arrow-down-right",
  "layers-three-01",
  "walking",
] as const;

export type KozmosIconNameBeyondTheLibrary =
  (typeof kozmosIconNamesBeyondTheLibrary)[number];

/** Each name beyond the curated library and the component it draws. */
const kozmosIconsBeyondTheLibrary: Readonly<
  Record<KozmosIconNameBeyondTheLibrary, KozmosIconComponent>
> = {
  "elevator-up": ElevatorUp,
  "elevator-down": ElevatorDown,
  "stairs-up": StairsUp,
  "stairs-down": StairsDown,
  "escalator-up": EscalatorUp,
  "escalator-down": EscalatorDown,
  "ramp-up": RampUp,
  "ramp-down": RampDown,
  "route-enter": RouteEnter,
  "route-exit": RouteExit,
  "elevator-up-and-down": ElevatorUpAndDown,
  "escalator-no-direction": EscalatorNoDirection,
  "stairs-no-direction": StairsNoDirection,
  "ramp-no-direction": RampNoDirection,
  "route-entrance-exit": RouteEntranceExit,
  "hard-left": HardLeft,
  "hard-right": HardRight,
  "turn-back": TurnBack,
  "follow-the-line": FollowTheLine,
  arriving: Arriving,
  "custom-transition": CustomTransition,
  "security-control": SecurityControl,
  shuttle: Shuttle,
  "log-in-01": LogIn01,
  "log-out-01": LogOut01,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
  "layers-three-01": LayersThree01,
  walking: Walking,
};

export type KozmosIconKey =
  | KozmosIconName
  | KozmosIconAlias
  | KozmosIconNameBeyondTheLibrary;

/**
 * The name a key draws: an alias's name, or the key itself. A name beyond the
 * curated library resolves to itself.
 */
export function resolveIconName(
  name: KozmosIconKey,
): KozmosIconName | KozmosIconNameBeyondTheLibrary {
  return kozmosIconAliases[name as KozmosIconAlias] ?? (name as KozmosIconName);
}

export function getIconComponent(
  name: KozmosIconKey,
): KozmosIconComponent | undefined {
  const resolved = resolveIconName(name);
  // Only the list's own keys: an inherited name such as `constructor` draws nothing.
  if (
    Object.prototype.hasOwnProperty.call(kozmosIconsBeyondTheLibrary, resolved)
  )
    return kozmosIconsBeyondTheLibrary[
      resolved as KozmosIconNameBeyondTheLibrary
    ];
  return kozmosIconRegistry[resolved as KozmosIconName];
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
