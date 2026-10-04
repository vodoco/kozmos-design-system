import React from "react";
import {
  travelTimeTone,
  type POIAttributeKind,
  type POIAvailability,
  type POIPresentation,
  type POIResultAction,
  type POIResultPresentation,
  type TravelTimeBand,
} from "@kozmos-ds/product-contracts";
import { Star01 as Star, NavigationPointer01 } from "@kozmos-ds/icons";
import { cn, poiLocationLabel } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Button } from "../Button/Button";

/**
 * The DOM id of a place's result card: what `LocationPin`'s `resultId` names
 * to say which card a pin controls. Pass the `idPrefix` the card's list was
 * given when a page shows the same place in more than one list; left out, it
 * is the id every result card has always had.
 */
export function getPOIResultDomId(poiId: string, idPrefix?: string) {
  const id = `poi-result-${encodeURIComponent(poiId)}`;
  return idPrefix ? `${idPrefix}-${id}` : id;
}

export interface POIResultCardProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  poi: POIPresentation;
  result: POIResultPresentation;
  onSelect: (poiId: string) => void;
  /**
   * Run an action from the selected result. The card draws whatever
   * `result.actions` carries and reports which was pressed; it never decides
   * that a POI can be booked, only that the product said so.
   * Without a handler, the actions remain visible but disabled.
   */
  onAction?: (action: POIResultAction, poiId: string) => void;
  featuredLabel?: string;
  /** Localized disclosure shown only for result.languageNotListed === true. */
  languageNotListedLabel?: string;
  selectionLabel?: string;
  /** Names the action row for assistive technology. */
  actionsLabel?: string;
  /** The floor the map shows: a result on it carries a dot before its floor. */
  currentFloorId?: string;
  /**
   * How the row draws its own edges.
   *
   * `card` is a standalone result with its own border and radius. `row` is a
   * result inside a container that already has them — a POIResultGroup, where
   * nine bordered cards inside one bordered box reads as a mistake, and the
   * design separates them with dividers instead.
   */
  appearance?: "card" | "row";
  /** SDK design by default: combined corner tabs, neutral selection, wrapping names and Go icon. Use legacy only for a staged migration. */
  presentationStyle?: "legacy" | "sdk";
  /**
   * The words for a walk shown as a band, when `result.travelEstimate.band`
   * is set (decision 50). English by default; a product that translates
   * passes its own, for one band or all five.
   */
  travelTimeBandLabels?: Partial<Record<TravelTimeBand, string>>;
  /**
   * Draw the result's number, `result.resultIndex`, in its tab: the number
   * its pin shows on the map. Off unless the product turns it on, for a list
   * whose pins are numbered, as quick access's are when a category's places
   * are listed and pinned.
   *
   * The card draws the number it is given and never renumbers, so the
   * product numbers results the way it numbers pins. The default SDK design
   * combines the number with Featured (a star separator) or a badge. Legacy
   * presentation hides Featured numbers and lets numbers replace badges.
   * The number leads the accessible name; a `selectionLabel` replaces that
   * whole name, so it must include the number itself if needed.
   */
  numbered?: boolean;
  /**
   * Names this card apart from another card for the same place on the page:
   * the search's results and an assistant's answer can both show it. The
   * card's id becomes `getPOIResultDomId(poi.id, idPrefix)`, and its action
   * row's and unavailable note's ids follow it, so each card's references
   * stay its own. Left out, the id is `getPOIResultDomId(poi.id)`, as it has
   * always been. An `id` given to the card wins over both.
   *
   * Keep it the same on the server and in the browser: a word, or an id from
   * React's `useId()`. `POIResultList` and `POIResultGroup` pass theirs on.
   */
  idPrefix?: string;
}

/**
 * The bands' words, and the only English the card holds for them. The colour
 * each is drawn in is the contract's rule, `travelTimeTone`: Nearby in the
 * success colour, the others in the card's text colour.
 */
const travelTimeBandLabel: Record<TravelTimeBand, string> = {
  nearby: "Nearby",
  oneToTwoMinutes: "1–2 min",
  twoToFiveMinutes: "2–5 min",
  fiveToTenMinutes: "5–10 min",
  moreThanTenMinutes: "More than 10 min",
};

/**
 * Availability is drawn in three tones, not two.
 *
 * "Closing soon" is a reason to hurry or choose something else, so it cannot
 * look like "open"; and it is not "closed" either, because the place is still
 * open. The warning tone is the one a visitor already reads as "act on this".
 * Where the boundary sits - thirty minutes, an hour - is the product's call;
 * this only draws what it is told.
 */
const availabilityTone: Record<POIAvailability, string> = {
  open: "text-success-text",
  openingSoon: "text-warning-text",
  closingSoon: "text-warning-text",
  closed: "text-muted-foreground",
  unknown: "text-muted-foreground",
};

/**
 * A restriction is the one attribute drawn apart.
 *
 * "Staff only" is not a feature like "Vegan" or "Step-free": it is the reason
 * a visitor cannot go, and a row of identical grey chips would bury it among
 * the things they can have. The rest read as one set because to a visitor they
 * are one - what this place offers.
 */
const attributeTone: Record<POIAttributeKind, string> = {
  service: "border-border bg-muted text-muted-foreground",
  dietary: "border-border bg-muted text-muted-foreground",
  accessibility: "border-border bg-muted text-muted-foreground",
  restriction: "border-warning/50 bg-warning/10 text-warning-text",
};

const POIResultCard = React.forwardRef<HTMLElement, POIResultCardProps>(
  (
    {
      className,
      poi,
      result,
      onSelect,
      onAction,
      featuredLabel = "Featured",
      languageNotListedLabel = "Language not listed",
      selectionLabel,
      actionsLabel = "Actions for this result",
      currentFloorId,
      appearance = "card",
      presentationStyle = "sdk",
      travelTimeBandLabels,
      numbered = false,
      idPrefix,
      id = getPOIResultDomId(poi.id, idPrefix),
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const available = result.available !== false;
    const sdk = presentationStyle === "sdk";
    // One tab: SDK combines the host's number with Featured or a badge.
    // Legacy keeps its original Featured > number > badge precedence.
    const number =
      numbered && (sdk || !result.featured)
        ? String(result.resultIndex)
        : undefined;
    const tab: { kind: "featured" | "number" | "badge"; label: string } | null =
      result.featured
        ? { kind: "featured", label: featuredLabel }
        : sdk && result.badge
          ? { kind: "badge", label: result.badge.label }
          : number !== undefined
            ? { kind: "number", label: number }
            : result.badge
              ? { kind: "badge", label: result.badge.label }
              : null;
    // The list shows the band when the product sets one (decision 50); the
    // exact minutes stay in the estimate for the details card. A band this
    // version has no words for falls back to the exact minutes.
    const band = result.travelEstimate?.band;
    const bandLabel =
      band && (travelTimeBandLabels?.[band] ?? travelTimeBandLabel[band]);
    const unavailableId = `${id}-unavailable`;
    const languageNotListedId = `${id}-language-not-listed`;
    const describedBy =
      [
        !available && result.unavailableReason ? unavailableId : undefined,
        result.languageNotListed === true ? languageNotListedId : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined;
    // A unit is narrower than a floor and a visitor is told both, so it leads
    // the line: "Unit 214 · Level 2 · Terminal 2" (GAP-022).
    const locationLabel = [result.unitLabel, poiLocationLabel(poi)]
      .filter(Boolean)
      .join(" · ");
    const onCurrentFloor =
      currentFloorId !== undefined && result.floorId === currentFloorId;

    // Shown only on the selected result: an action row on every card would be
    // a wall of buttons, and the tap that selects is the tap that asks.
    const actions = result.selected ? (result.actions ?? []) : [];
    const showActions = available && actions.length > 0;
    const actionsId = `${id}-actions`;

    // The access restriction arrives as its own labelled field rather than in
    // services, so it is folded in here and marked as what it is.
    const attributes = [
      ...(poi.accessRestrictions === "present" && poi.accessRestrictionsLabel
        ? [
            {
              id: `${poi.id}-restriction`,
              label: poi.accessRestrictionsLabel,
              kind: "restriction" as const,
            },
          ]
        : []),
      ...(poi.services ?? []),
    ];

    const handleAction = (action: POIResultAction) => {
      if (!onAction) return;
      trackEvent("POIResultCard", "poi_result_action", {
        poiId: poi.id,
        resultIndex: result.resultIndex,
        action,
      });
      onAction(action, poi.id);
    };

    const name = (
      <span
        className={cn(
          "kozmos-poi-result-name block min-w-0 text-lg font-normal leading-tight text-foreground",
          !sdk && "truncate",
        )}
        // Story 2 shows an authored name exactly as authored, which leaves a
        // screen reader saying a Japanese name in the voice of the interface
        // language. The tag tells it which voice to use, and is set only when
        // the two differ (GAP-004).
        lang={result.nameLanguage}
      >
        {poi.name}
      </span>
    );

    const handleSelect = () => {
      if (!available) return;
      trackEvent("POIResultCard", "poi_result_selected", {
        poiId: poi.id,
        resultIndex: result.resultIndex,
        featured: result.featured,
      });
      onSelect(poi.id);
    };

    const cornerTab = tab && (
      <span
        aria-hidden={sdk || tab.kind === "number" || undefined}
        className="kozmos-poi-result-tab pointer-events-none absolute start-0 top-0 inline-flex h-4 items-center gap-1 whitespace-nowrap pe-1.5 ps-[5px] pt-px text-[11px] font-normal leading-[14px]"
        data-selected={result.selected || undefined}
        data-tab={tab.kind}
      >
        {sdk && number !== undefined && tab.kind !== "number" && (
          <span>{number}</span>
        )}
        {tab.kind === "featured" && (
          <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
        )}
        {sdk ? <span>{tab.label}</span> : tab.label}
      </span>
    );

    return (
      <article
        ref={ref}
        className={cn(
          "kozmos-poi-result-card relative bg-card text-card-foreground",
          appearance === "card" && "rounded-control border",
          !sdk &&
            appearance === "card" &&
            result.selected &&
            "ring-2 ring-primary/20",
          // Only Featured recolours the card's edge, in its tab's amber (an
          // owned rule), selected or not. Legacy uses a selection ring; SDK
          // uses the neutral selection surface. A
          // number keeps the grey edge, so it never reads as the selected
          // card, and a badge is quiet: it must not read as featured
          // (GAP-054).
          appearance === "card" &&
            (tab?.kind === "featured"
              ? "kozmos-poi-result-card-featured"
              : result.selected && !sdk
                ? "border-primary"
                : "border-border"),
          // A row states its selection with a fill, since it has no border of
          // its own to thicken.
          !sdk && appearance === "row" && result.selected && "bg-primary/5",
          className,
        )}
        data-appearance={appearance}
        data-presentation-style={presentationStyle}
        data-available={available}
        data-current-floor={onCurrentFloor || undefined}
        data-featured={result.featured || undefined}
        data-poi-id={poi.id}
        data-selected={result.selected || undefined}
        id={id}
        {...props}
      >
        {/* Owned CSS preserves legacy geometry and gives SDK tabs normal-flow
            height, matching outer/inner radii and wider padding. The combined
            SDK tab is decorative: its words are announced once by the row. */}
        {!sdk && appearance === "card" && cornerTab}

        <button
          aria-controls={showActions ? actionsId : undefined}
          aria-describedby={describedBy}
          aria-expanded={
            (result.actions?.length ?? 0) > 0 ? showActions : undefined
          }
          aria-label={selectionLabel}
          // `aria-current`, not `aria-pressed` (GAP-049).
          //
          // A pressed button is a toggle, and this one is not: `handleSelect`
          // always selects, so a second tap never releases it. Claiming the
          // toggle meant every result in a list announced itself as a button
          // that was "not pressed" — a state the visitor could not reach and
          // the card could not leave.
          //
          // What is actually true is that one result is the current one, which
          // is what LocationPin has always said about the same state, in the
          // same word. The two now agree, which matters: the pin and the row
          // are one thing to a visitor and are announced together.
          aria-current={result.selected ? "location" : undefined}
          className="kozmos-reset kozmos-poi-result-select"
          disabled={!available}
          onClick={handleSelect}
          type="button"
        >
          {sdk && cornerTab}
          <span
            className={cn(
              "grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3",
              !sdk && appearance === "card" && tab && "pt-6",
            )}
          >
            <span className="min-w-0">
              {sdk && (number !== undefined || tab) && (
                <>
                  <span className="kozmos-poi-result-number-name">
                    {[number, tab?.kind !== "number" ? tab?.label : undefined]
                      .filter(Boolean)
                      .join(", ")}
                    {","}
                  </span>{" "}
                </>
              )}
              {!sdk && number !== undefined && (
                // The number leads the result's name, "2, Burger King": the tab
                // that draws it is decorative. The space after it keeps WebKit
                // from running it into the name.
                <>
                  <span className="kozmos-poi-result-number-name">{`${number},`}</span>{" "}
                </>
              )}
              {!sdk && appearance === "row" && number !== undefined ? (
                // A row in a POIResultGroup has no edge of its own to hang a
                // tab from, so its number stands before its name, painted as
                // the tab is.
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="kozmos-poi-result-tab inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-control px-1.5 text-xs font-semibold"
                    data-placement="inline"
                    data-selected={result.selected || undefined}
                    data-tab="number"
                  >
                    {number}
                  </span>
                  {name}
                </span>
              ) : (
                name
              )}
              {poi.categoryLabel && (
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {poi.categoryLabel}
                </span>
              )}
              <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                {onCurrentFloor && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-pill bg-primary"
                  />
                )}
                <span className="truncate">{locationLabel}</span>
              </span>
              {result.summary && (
                // One generated line about this result, already localized.
                // Two lines at most: a result card is scanned, and a summary
                // that grows makes the cards below it move (GAP-029).
                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                  {result.summary}
                </span>
              )}
              {attributes.length > 0 && (
                <ul className="mt-1.5 flex list-none flex-wrap gap-1 p-0">
                  {attributes.map((attribute) => (
                    <li
                      className={cn(
                        "inline-flex max-w-full items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-medium",
                        attributeTone[attribute.kind ?? "service"],
                      )}
                      key={attribute.id}
                    >
                      {attribute.iconUrl && (
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0"
                          src={attribute.iconUrl}
                        />
                      )}
                      <span className="truncate">{attribute.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {poi.availabilityLabel && (
                <span
                  className={cn(
                    "mt-1 block text-xs font-semibold",
                    poi.availability
                      ? availabilityTone[poi.availability]
                      : "text-muted-foreground",
                  )}
                >
                  {poi.availabilityLabel}
                </span>
              )}
            </span>

            <span className="flex shrink-0 flex-col items-end gap-2">
              {poi.logo && (
                <img
                  alt={poi.logo.alt}
                  className="h-12 w-12 rounded-control border border-border object-contain"
                  src={poi.logo.src}
                />
              )}
              {result.travelEstimate && (
                <span
                  className={cn(
                    "whitespace-nowrap text-sm",
                    // The word says Nearby, so the tone is never the only
                    // signal; the colour is an owned rule, so it holds where
                    // the utilities do not.
                    band && bandLabel && travelTimeTone(band) === "success"
                      ? "kozmos-travel-time-success"
                      : "text-foreground",
                  )}
                >
                  {bandLabel || result.travelEstimate.durationLabel}
                </span>
              )}
            </span>
          </span>
        </button>

        {result.languageNotListed === true && (
          <p
            id={languageNotListedId}
            className="px-4 pb-3 text-sm text-muted-foreground"
          >
            {languageNotListedLabel}
          </p>
        )}

        {/* A sibling of the select button, never a child of it. A button inside
            a button is invalid HTML: the browser closes the outer one, and
            what a screen reader and the keyboard then get is not what the
            markup says. This is why the whole card could not simply gain two
            more buttons. */}
        {showActions && (
          <div className="kozmos-poi-result-actions">
            <div
              aria-label={actionsLabel}
              className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border px-4 py-3"
              id={actionsId}
              role="group"
            >
              {actions.map((entry, index) => (
                <Button
                  variant={entry.primary ? "default" : "outline"}
                  emotion={entry.primary ? "themed" : "neutral"}
                  // The row owns available space; Core still owns the action's
                  // appearance and interaction. Translations grow vertically.
                  className="h-auto min-h-11 min-w-11 max-w-full whitespace-normal"
                  disabled={entry.disabled || !onAction}
                  key={`${entry.action}-${index}`}
                  onClick={() => handleAction(entry.action)}
                  type="button"
                >
                  {sdk && entry.action === "navigate" && (
                    <NavigationPointer01
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0"
                    />
                  )}
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {entry.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {!available && result.unavailableReason && (
          <p
            className="border-t border-border px-4 py-2 text-xs text-muted-foreground"
            id={unavailableId}
          >
            {result.unavailableReason}
          </p>
        )}
      </article>
    );
  },
);

POIResultCard.displayName = "POIResultCard";

export { POIResultCard };
