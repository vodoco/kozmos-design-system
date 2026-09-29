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
import { Star01 as Star } from "@kozmos-ds/icons";
import { cn, poiLocationLabel } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

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
   */
  onAction?: (action: POIResultAction, poiId: string) => void;
  featuredLabel?: string;
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
   * product numbers the results the way it numbers the pins. A featured
   * result keeps its Featured tab and shows no number, as its pin shows its
   * logo; a number takes the place of a badge, so the list's numbers match
   * the pins. The number leads the result's accessible name ("2, Burger
   * King"); a `selectionLabel` replaces that whole name, so it says the
   * number itself.
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
      selectionLabel,
      actionsLabel = "Actions for this result",
      currentFloorId,
      appearance = "card",
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
    // One tab, and what it says decides how it looks. Featured is the CMS's
    // word and the map acts on it too (its pin draws the logo), so it wins;
    // then the number, which pairs the result with its pin; then the badge,
    // which only says why the result is in the list.
    const number =
      numbered && !result.featured ? String(result.resultIndex) : undefined;
    const tab: { kind: "featured" | "number" | "badge"; label: string } | null =
      result.featured
        ? { kind: "featured", label: featuredLabel }
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
      trackEvent("POIResultCard", "poi_result_action", {
        poiId: poi.id,
        resultIndex: result.resultIndex,
        action,
      });
      onAction?.(action, poi.id);
    };

    const name = (
      <span
        className="block min-w-0 truncate text-lg font-normal leading-tight text-foreground"
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

    return (
      <article
        ref={ref}
        className={cn(
          "kozmos-poi-result-card relative bg-card text-card-foreground",
          appearance === "card" && "rounded-control border",
          appearance === "card" &&
            (result.selected
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"),
          // A row states its selection with a fill, since it has no border of
          // its own to thicken.
          appearance === "row" && result.selected && "bg-primary/5",
          // The tab hangs above the card, so it needs the space a card has.
          appearance === "card" && tab && "mt-3",
          // Only Featured recolours the card's edge. A number keeps the grey
          // edge, so it never reads as the selected card, and a badge is
          // quiet: it must not read as featured (GAP-054).
          appearance === "card" && tab?.kind === "featured" && "border-warning",
          className,
        )}
        data-appearance={appearance}
        data-current-floor={onCurrentFloor || undefined}
        data-featured={result.featured || undefined}
        data-poi-id={poi.id}
        data-selected={result.selected || undefined}
        id={id}
        {...props}
      >
        {/* One tab per card, painted for what it says (owned CSS, so the
            paint holds without @scope):
            - Featured: the warning fill with a star, and the card's edge in
              the same colour. It is set in the CMS and read beyond this card.
            - A number: the pin's number. Quiet, outlined on the card's own
              fill, until the result is selected; then filled in the primary
              colour, as the selected card's edge is. Decorative: the number
              is said at the start of the result's name instead.
            - A badge: quiet, a neutral fill with no star, on the card's grey
              edge (GAP-054). It is read, as it always was.
            It sits at the card's start edge, so it follows the name in a
            right-to-left language. */}
        {appearance === "card" && tab && (
          <span
            aria-hidden={tab.kind === "number" || undefined}
            className="kozmos-poi-result-tab absolute bottom-full start-4 inline-flex h-6 items-center gap-1 rounded-t-control px-2 text-xs font-semibold"
            data-selected={result.selected || undefined}
            data-tab={tab.kind}
          >
            {tab.kind === "featured" && (
              <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
            )}
            {tab.label}
          </span>
        )}

        <button
          aria-controls={showActions ? actionsId : undefined}
          aria-describedby={!available ? unavailableId : undefined}
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
          className="grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[inherit] px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!available}
          onClick={handleSelect}
          type="button"
        >
          <span className="min-w-0">
            {number !== undefined && (
              // The number leads the result's name, "2, Burger King": the tab
              // that draws it is decorative. The space after it keeps WebKit
              // from running it into the name.
              <>
                <span className="kozmos-poi-result-number-name">{`${number},`}</span>{" "}
              </>
            )}
            {appearance === "row" && number !== undefined ? (
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
        </button>

        {/* A sibling of the select button, never a child of it. A button inside
            a button is invalid HTML: the browser closes the outer one, and
            what a screen reader and the keyboard then get is not what the
            markup says. This is why the whole card could not simply gain two
            more buttons. */}
        {showActions && (
          <div className="kozmos-poi-result-actions">
            <div
              aria-label={actionsLabel}
              className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3"
              id={actionsId}
              role="group"
            >
              {actions.map((entry, index) => (
                <button
                  className={cn(
                    "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                    entry.primary
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-card text-foreground hover:bg-muted",
                  )}
                  disabled={entry.disabled}
                  key={`${entry.action}-${index}`}
                  onClick={() => handleAction(entry.action)}
                  type="button"
                >
                  <span className="truncate">{entry.label}</span>
                </button>
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
