import React from "react";
import type {
  POIAttributeKind,
  POIAvailability,
  POIPresentation,
  POIResultAction,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";
import { Star01 as Star } from "@kozmos-ds/icons";
import { cn, poiLocationLabel } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

export function getPOIResultDomId(poiId: string) {
  return `poi-result-${encodeURIComponent(poiId)}`;
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
}

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
      id = getPOIResultDomId(poi.id),
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const available = result.available !== false;
    const unavailableId = `${id}-unavailable`;
    const locationLabel = poiLocationLabel(poi);
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
          "relative bg-card text-card-foreground transition-shadow",
          appearance === "card" && "rounded-control border",
          appearance === "card" &&
            (result.selected
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"),
          // A row states its selection with a fill, since it has no border of
          // its own to thicken.
          appearance === "row" && result.selected && "bg-primary/5",
          // The tab hangs above the card, so it needs the space a card has.
          appearance === "card" &&
            (result.featured
              ? "mt-3 border-warning"
              : result.badge && "mt-3 border-warning"),
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
        {/* One tab, one treatment. The prototypes draw "★ Popular Choice" in
            the same amber as "★ Featured", so the LABEL distinguishes them and
            the styling does not — which is also why the plugin notes a
            sponsored result is never identified by colour alone. What differs
            is meaning, not paint: featured is set in the CMS and read beyond
            this card (the map marker draws a featured POI with its logo), so a
            result that is both shows featured. */}
        {appearance === "card" && result.featured ? (
          <span className="absolute bottom-full left-4 inline-flex h-6 items-center gap-1 rounded-t-control bg-warning px-2 text-xs font-semibold text-warning-foreground">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
            {featuredLabel}
          </span>
        ) : (
          appearance === "card" &&
          result.badge && (
            <span className="absolute bottom-full left-4 inline-flex h-6 items-center gap-1 rounded-t-control bg-warning px-2 text-xs font-semibold text-warning-foreground">
              <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              {result.badge.label}
            </span>
          )
        )}

        <button
          aria-controls={showActions ? actionsId : undefined}
          aria-describedby={!available ? unavailableId : undefined}
          aria-expanded={
            (result.actions?.length ?? 0) > 0 ? showActions : undefined
          }
          aria-label={selectionLabel}
          aria-pressed={result.selected}
          className="grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[inherit] px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!available}
          onClick={handleSelect}
          type="button"
        >
          <span className="min-w-0">
            <span className="block truncate text-lg font-normal leading-tight text-foreground">
              {poi.name}
            </span>
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
              <span className="whitespace-nowrap text-sm text-foreground">
                {result.travelEstimate.durationLabel}
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
