/**
 * Platform-neutral, already-localized presentation models.
 *
 * API and map-SDK objects must be adapted into these contracts outside UI
 * components. Human-readable labels are included alongside machine values so
 * each platform renders the same meaning without embedding English formatters.
 */

/**
 * Whether a place is open, and how close that is to changing.
 *
 * `openingSoon` and `closingSoon` are their own states rather than a flag on
 * open or closed, because a visitor reads them differently: "closing soon" is
 * a reason to hurry or pick something else, and drawing it as plain "open" is
 * the difference between arriving and arriving too late. Where the boundary
 * sits - thirty minutes, an hour - is the product's, not this contract's.
 */
export type POIAvailability =
  | "open"
  | "openingSoon"
  | "closingSoon"
  | "closed"
  | "unknown";

export type POIAccessRestrictions = "none" | "present" | "unknown";

export type POIAction =
  | "navigate"
  | "favourite"
  | "bookmark"
  | "share"
  | "order";

/**
 * What a RESULT may offer, which is everything a POI offers plus opening its
 * own details.
 *
 * Kept apart from POIAction rather than folded into it. A detail panel cannot
 * offer itself, and POIDetailPanel maps POIAction exhaustively — widening the
 * shared union made it carry a case that can never reach it, which the
 * compiler was right to object to.
 */
export type POIResultAction = POIAction | "details";

export interface POIMediaPresentation {
  id: string;
  src: string;
  alt: string;
}

/**
 * What sort of attribute a chip is.
 *
 * Change #4 asks a result to show access restrictions, dietary, accessibility
 * and services. Those are four meanings and one shape - a short localized
 * label with an optional icon - so they share this list rather than gaining
 * three more of their own. The kind is what lets a card order them, tone them,
 * or show only some.
 *
 * Optional, because every existing caller predates it and a service with no
 * kind is still a service.
 */
export type POIAttributeKind =
  | "service"
  | "dietary"
  | "accessibility"
  | "restriction";

export interface POIServicePresentation {
  id: string;
  label: string;
  iconName?: string;
  /** Optional decorative asset; label remains visible. Web accepts HTTPS or root-relative URLs. */
  iconUrl?: string;
  /** Use the asset alpha as a current-color mask (monochrome assets only). */
  iconMonochrome?: boolean;
  /** Defaults to a plain service when absent. */
  kind?: POIAttributeKind;
}

export interface POIPresentation {
  id: string;
  name: string;
  categoryId?: string;
  categoryLabel?: string;
  /**
   * Optional: a venue need not have levels.
   *
   * Story 15's edge case is a single-storey venue, where every result sitting
   * on "Ground Floor" is noise rather than information. A product with levels
   * supplies these exactly as before; one without omits them, and the card
   * draws what is left rather than a floor nobody has.
   */
  floorId?: string;
  floorLabel?: string;
  buildingId?: string;
  buildingLabel?: string;
  logo?: {
    src: string;
    alt: string;
  };
  media: readonly POIMediaPresentation[];
  availability?: POIAvailability;
  availabilityLabel?: string;
  description?: string;
  accessRestrictions?: POIAccessRestrictions;
  accessRestrictionsLabel?: string;
  services?: readonly POIServicePresentation[];
  actions: readonly POIAction[];
}

/** Optional, already-localized detail content. Keep category-specific API fields
 * in the product adapter, not in the shared POI identity or React props. */
export interface POIDetailAttributeGroup {
  id: string;
  heading: string;
  /** Optional iconName follows the existing service presentation contract.
   * Text remains authoritative when a platform cannot resolve an icon. */
  items: readonly POIServicePresentation[];
}

/** Kind describes meaning without coupling the contract to a platform icon. */
export interface POIDetailSummary {
  id: string;
  kind: "rating" | "price" | "accessibility" | "dietary" | "crowd" | "property";
  label: string;
  value: string;
  detail?: string;
  iconUrl?: string;
  iconMonochrome?: boolean;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  /** Optional visual scale. The localized value remains the accessible text. */
  priceLevel?: 1 | 2 | 3 | 4;
}

export interface POIOpeningHoursPresentation {
  label: string;
  summary: string;
  rows: readonly { id: string; day: string; hours: string }[];
  note?: string;
}

export type POISupplementaryAction = "book" | "call";

export interface POIDetailsPresentation {
  travelEstimate?: TravelEstimatePresentation;
  /** Highest-priority first. POI detail panels display at most the first three. */
  summary?: readonly POIDetailSummary[];
  groups?: readonly POIDetailAttributeGroup[];
  openingHours?: POIOpeningHoursPresentation;
  /** Plain text only. Products must adapt/sanitize rich API content separately. */
  description?: { preview: string; full?: string };
  tags?: readonly POIServicePresentation[];
  supplementaryActions?: readonly {
    action: POISupplementaryAction;
    label: string;
  }[];
}

export interface TravelEstimatePresentation {
  durationSeconds: number;
  durationLabel: string;
  distanceMetres?: number;
  distanceLabel?: string;
  mode?: string;
  modeLabel?: string;
}

/**
 * A short, already-localized tab above a result: "Alternative", "Similar",
 * "Close by".
 *
 * Deliberately NOT how `featured` is expressed. Featured is a property of the
 * POI in the CMS and is read by more than this card — the map marker draws a
 * featured POI with its logo — so it stays a boolean with meaning, and this
 * stays a label with none. A result that is both draws the featured tab: it is
 * the one with consequences elsewhere.
 */
export interface POIResultBadgePresentation {
  /** Already localized. Keep it to a word or two; it sits in a 24px tab. */
  label: string;
}

/**
 * Why a result is in the list.
 *
 * MAP-474 shows alternatives and unconfirmed results as further lists under
 * their own headings, and change #5 settled that they use the same cards. That
 * only works if the grouping comes from the data: a product cannot sort results
 * into "Alternatives" and "Gluten-free not confirmed" from a card that does not
 * say which it is.
 */
export type POIResultMatch = "exact" | "alternative" | "unconfirmed";

/** What a result card offers on the selected result, in the order given. */
export interface POIResultActionPresentation {
  action: POIResultAction;
  /** Already localized. */
  label: string;
  /** Drawn first and filled. Exactly one action should carry it. */
  primary?: boolean;
  disabled?: boolean;
}

export interface POIResultPresentation {
  poiId: string;
  resultIndex: number;
  selected: boolean;
  /** Set in the CMS. Draws the starred tab here, and the logo on the marker. */
  featured: boolean;
  /** Optional for the same reason as POIPresentation.floorId: no levels, no floor. */
  floorId?: string;
  travelEstimate?: TravelEstimatePresentation;
  available?: boolean;
  unavailableReason?: string;
  /** A quiet tab: why this result is in this list. Ignored when featured. */
  badge?: POIResultBadgePresentation;
  /**
   * Whether this result answers the query exactly, stands in for one that
   * would, or has not been confirmed. Absent means exact.
   */
  match?: POIResultMatch;
  /**
   * The unit or suite, where a venue has them: "Unit 214", "Suite 3B".
   * Separate from floorLabel because a visitor is told both.
   */
  unitLabel?: string;
  /**
   * BCP 47 tag for the language poi.name is authored in, when it differs from
   * the interface language. MAP-474 Story 2 requires an authored name to be
   * shown exactly as authored, and a screen reader needs the tag to say it
   * correctly.
   */
  nameLanguage?: string;
  /**
   * Revealed when the result is selected. The product decides what a POI
   * offers — a restaurant may book where a shop does not — so the card renders
   * what it is given and never assumes a fixed pair.
   */
  actions?: readonly POIResultActionPresentation[];
}

/**
 * Why a search returned nothing.
 *
 * An empty list is not one situation. "No results" after a typo wants a
 * different screen from "no results because you filtered to a building with
 * none", and Story 15 AC6 asks for the constraint that emptied the list to be
 * named. Without this a product can only say "nothing found" and leave the
 * visitor to guess what to undo.
 */
export type SearchEmptyKind =
  /** The query matched nothing anywhere in the venue. */
  | "noMatch"
  /** Matches exist, but every one was excluded by a filter. */
  | "filteredOut"
  /** The venue has no data for this at all — a category nobody has mapped. */
  | "unavailable";

export interface SearchResponsePresentation {
  results: readonly POIResultPresentation[];
  /** Present only when `results` is empty. */
  emptyKind?: SearchEmptyKind;
  /**
   * The filter that emptied the list, already localized — "HQ Building",
   * "Gluten-free". Story 15 AC6: name what to undo.
   */
  emptiedBy?: string;
  /**
   * Set when results were found in a language other than the one asked for,
   * carrying the BCP 47 tag actually used. Story 2's unhappy path: a visitor
   * reading Japanese who gets English names should be told, not left to
   * wonder.
   */
  languageFallback?: string;
}

export interface FloorPresentation {
  id: string;
  label: string;
  shortLabel: string;
  disabled?: boolean;
}

export interface CategoryPresentation {
  id: string;
  label: string;
  /** A design system icon, by its registry name. */
  iconName?: string;
  /**
   * The venue's own category artwork, as the taxonomy publishes it.
   *
   * A quick-access category carries an `iconUrl` in the taxonomy's published
   * JSON. That artwork belongs to the venue and is versioned on Pointr's
   * cadence, not this package's, so it arrives as a URL rather than a bundled
   * component - the eight that were bundled went stale the moment a taxonomy
   * release landed, and were removed.
   *
   * Where both are given, the consumer decides; `renderIcon` overrides either.
   */
  iconUrl?: string;
  selected: boolean;
  disabled?: boolean;
  resultCount?: number;
  resultCountLabel?: string;
}

export type RoutePreference = "quickest" | "step-free" | "custom";

export interface RouteOptionPresentation {
  id: string;
  label: string;
  durationSeconds: number;
  durationLabel: string;
  distanceMetres: number;
  distanceLabel: string;
  preference: RoutePreference;
  selected: boolean;
  available: boolean;
  warning?: string;
}

export type RouteReadiness =
  | "idle"
  | "calculating"
  | "ready"
  | "no-route"
  | "error";

export type MapReadiness =
  | "loading"
  | "ready"
  | "error"
  | "offline"
  | "unsupported";

export type UserLocationState =
  | "off"
  | "locating"
  | "following"
  | "heading"
  | "permission-denied"
  | "stale"
  | "unavailable";

export interface MapCollisionInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Physical rectangle in the shell's local units (CSS px, points or dp). */
export interface MapLayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MapPanelPresentation = "auto" | "bottom" | "side";

/** Presentation geometry only: selection, camera and route state belong to the host. */
export interface AdaptiveMapLayout {
  /** Renderer bounds relative to the shell, not the screen. */
  mapBounds: MapLayoutRect;
  panelBounds: MapLayoutRect | null;
  presentation: "bottom" | "side" | "separated";
}

export interface MapOcclusion {
  kind: "panel" | "top-bar" | "controls";
  /** Shell-local bounds; intersect with mapBounds before sending to a renderer. */
  bounds: MapLayoutRect;
}

export interface AdaptiveMapLayoutSnapshot extends AdaptiveMapLayout {
  occlusions: readonly MapOcclusion[];
  /** Physical edge padding relative to mapBounds, NOT relative to the shell. */
  collisionInsets: MapCollisionInsets;
}
