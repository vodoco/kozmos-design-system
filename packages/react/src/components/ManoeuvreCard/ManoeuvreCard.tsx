import React from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

export interface ManoeuvreCardProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children"
> {
  /** What the card sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
  type: DirectionType;
  instruction: string;
  detail?: string;
  /** Open into the itinerary instead of the manoeuvre. */
  expanded: boolean;
  onToggle: () => void;
  expandLabel?: string;
  collapseLabel?: string;
  /**
   * What the closed card is called to assistive technology. Open, the card
   * has no name of its own: the itinerary inside it is the named thing, and
   * two landmarks called the same would be read twice.
   */
  manoeuvreLabel?: string;
  /** Past this height, in pixels, the itinerary scrolls. */
  maxItineraryHeight?: number;
  /** The itinerary the card opens into — `Itinerary`, in the products. */
  children?: React.ReactNode;
}

/** What assistive technology hears for the closed card: the instruction, then the detail. */
export function manoeuvreDescription(instruction: string, detail?: string) {
  return detail ? `${instruction}, ${detail}` : instruction;
}

/**
 * The current manoeuvre, floating over the map during navigation: its arrow,
 * the instruction, how far and how long, and a grab bar that opens the full
 * itinerary in its place. The card owns the toggle and what assistive
 * technology hears of it; the itinerary it opens into is the caller's, so
 * the card never decides what a route is made of. Open, the card is as tall
 * as the itinerary up to `maxItineraryHeight`, past which the itinerary
 * scrolls: a long route must not cover the map.
 */
const ManoeuvreCard = React.forwardRef<HTMLElement, ManoeuvreCardProps>(
  (
    {
      className,
      type,
      instruction,
      detail,
      expanded,
      onToggle,
      expandLabel = "Show itinerary",
      collapseLabel = "Hide itinerary",
      manoeuvreLabel = "Current manoeuvre",
      surface = "solid",
      maxItineraryHeight = 320,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        aria-label={expanded ? undefined : manoeuvreLabel}
        className={cn(
          `kozmos-manoeuvre-card ${surfaceClass(surface)} flex w-full flex-col gap-3 rounded-container px-4 pb-1 pt-4 text-foreground shadow-floating`,
          className,
        )}
        {...props}
      >
        {expanded ? (
          <div
            className="kozmos-manoeuvre-itinerary overflow-y-auto"
            style={{ maxHeight: maxItineraryHeight }}
          >
            {children}
          </div>
        ) : (
          // The instruction row is the button: a click anywhere on it opens
          // the itinerary, and assistive technology hears the manoeuvre.
          <button
            type="button"
            className="flex w-full items-start gap-3 bg-transparent p-0 text-left text-inherit"
            onClick={onToggle}
            aria-expanded={false}
            aria-label={manoeuvreDescription(instruction, detail)}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-primary">
              <DirectionIcon type={type} className="h-6 w-6" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">
                {instruction}
              </span>
              {/* Muted, and on glass the foreground colour (decision 48). */}
              {detail ? (
                <span className="kozmos-muted-text text-sm">{detail}</span>
              ) : null}
            </span>
          </button>
        )}
        {/* The grab bar: the sign that the card opens, and the way to close
            it. Closed, the instruction row already offers the way in, so the
            bar is silent then. */}
        <button
          type="button"
          className="flex w-full justify-center bg-transparent py-1"
          onClick={onToggle}
          aria-label={expanded ? collapseLabel : expandLabel}
          aria-expanded={expanded}
          aria-hidden={expanded ? undefined : true}
          tabIndex={expanded ? 0 : -1}
        >
          <span className="h-[5px] w-9 rounded-pill bg-muted" />
        </button>
      </section>
    );
  },
);
ManoeuvreCard.displayName = "ManoeuvreCard";

export { ManoeuvreCard };
