import type { CategoryTint } from "../CategoryTile/CategoryTint";
import React from "react";
import { MarkerPin01 as MapPin, Star01 as Star } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface LocationPinProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  label?: string;
  /** The result's number, as its card's number tab shows it. At rest the pin
   *  is quiet — the outlined marker on the background, its ring and number in
   *  its colour — and it fills only when `selected`, as the tab does. */
  number?: number;
  markerContent?: React.ReactNode;
  /** Grows the pin, and fills a numbered one. */
  selected?: boolean;
  featured?: boolean;
  disabled?: boolean;
  /** On another floor: the outlined marker with a dashed ring, on the
   *  background, and the number in the foreground, so shape carries the
   *  state, as on iOS and Compose. The dashes tell it from a quiet numbered
   *  pin at rest, which is outlined too; it never fills, selected or not. */
  offFloor?: boolean;
  externalLabel?: string;
  labelPlacement?: "top" | "right" | "bottom" | "left";
  resultId?: string;
  /** A category's colours for the marker — its fill, solid, with its ink for
   *  the number — over the variant's; a featured pin keeps the alert colour.
   *  A numbered pin at rest and a pin off the floor are outlined in the fill,
   *  with the number in the foreground. */
  tint?: CategoryTint;
}

const LocationPin = React.forwardRef<HTMLDivElement, LocationPinProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      label = "Location",
      number,
      markerContent,
      selected = false,
      featured = false,
      disabled = false,
      offFloor = false,
      externalLabel,
      labelPlacement = "bottom",
      tint,
      resultId,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const sizeClasses = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-10 h-10",
    };

    const variantClasses = {
      default: "text-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
    };

    // The ink that reads on each variant's solid marker. The number used to
    // sit in white on a 20 % wash, and a tint's ink, chosen for its solid
    // fill, failed on that wash in every tint in one mode or the other, down
    // to 1.01:1 (2026-09-21).
    const inkClasses = {
      default: "text-background",
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      accent: "text-accent-foreground",
    };

    // Each variant's colour where it is a ring and a number on the surface —
    // a quiet pin, or one off the floor. Secondary's own colour is a surface
    // grey (background/200, 1.6:1 on the surface), so it takes the muted
    // foreground there, the grey native's secondary pin is drawn in.
    const outlineClasses = {
      default: "text-foreground",
      primary: "text-primary",
      secondary: "text-muted-foreground",
      accent: "text-accent",
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      trackEvent("LocationPin", "location_pin_clicked", {
        variant,
        size,
        number,
        selected,
      });
      onClick?.(e);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        onClick &&
        !disabled &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        event.currentTarget.click();
      }
      onKeyDown?.(event);
    };

    const isInteractive = Boolean(onClick);
    const visibleContent = markerContent ?? number;
    const hasContent = visibleContent !== undefined && visibleContent !== null;
    // Decision 55 (Olcay, 2026-09-29): a numbered pin on this floor is quiet
    // at rest — the surface, a ring and the number in its colour — and filled
    // only when selected, as the result card's number tab is. A featured pin
    // (its logo on the map), a pin showing markerContent and a pin with no
    // number keep their fill.
    const quiet =
      markerContent == null &&
      number != null &&
      !selected &&
      !featured &&
      !offFloor;
    // Off the floor and quiet both draw the outlined marker; a dashed ring is
    // what says another floor, so the two never read alike.
    const outlined = quiet || offFloor;
    const tinted = Boolean(tint) && !featured;
    const externalLabelClasses = {
      top: "bottom-full left-1/2 mb-1 -translate-x-1/2",
      right: "left-full top-1/2 ml-1 -translate-y-1/2",
      bottom: "left-1/2 top-full mt-1 -translate-x-1/2",
      left: "right-full top-1/2 mr-1 -translate-y-1/2",
    };

    return (
      <div
        ref={ref}
        aria-controls={resultId}
        aria-current={selected ? "location" : undefined}
        aria-disabled={isInteractive && disabled ? true : undefined}
        aria-label={label}
        className={cn(
          // `left-0 top-0` physical, not `start-0`, and not omitted.
          //
          // The pin is positioned absolutely with no inset, so it fell back to
          // its static position — where it would have sat in flow. In a
          // left-to-right map that is the container's left edge, which is what
          // the -50% translate expects. In Arabic it is the container's RIGHT
          // edge, so every pin drew one pin-width to the left of its place.
          //
          // Physical because the translate beside it is physical: a logical
          // `start-0` would flip the origin in RTL and leave the translate
          // pulling the wrong way, which is the same bug with more steps. The
          // renderer gives a physical point; the pin honours it.
          "absolute left-0 top-0 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-full items-center justify-center transition-transform",
          isInteractive &&
            "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          selected && "scale-110",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        data-featured={featured || undefined}
        data-off-floor={offFloor || undefined}
        data-selected={selected || undefined}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        role={isInteractive ? "button" : "img"}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        {...props}
      >
        <span className="relative flex items-center justify-center">
          {/* Selected, featured, or showing a logo, the marker is solid in its
              colour and the number is inked for that fill, as on iOS, Compose
              and in Figma. A numbered pin at rest is quiet: the outlined
              marker on the background, its ring and number in its colour.
              Off the floor it is the outlined marker with a dashed ring and
              the number in the foreground (Olcay, 2026-09-21), so shape, not
              colour, tells the floor. A number takes the place of the head's
              dot. */}
          <MapPin
            aria-hidden="true"
            className={cn(
              sizeClasses[size],
              outlined ? outlineClasses[variant] : variantClasses[variant],
              outlined ? "fill-background" : "fill-current",
              offFloor && "[&>path:last-child]:[stroke-dasharray:2_4.5]",
              hasContent && "[&_circle]:hidden",
            )}
            style={tinted ? { color: tint?.fill } : undefined}
          />
          {hasContent && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 top-[18%] truncate px-1 text-center text-[10px] font-bold leading-none",
                // A tint's fill fails 4.5:1 as text on the background for six
                // of the eight categories (yellow reads 1.92:1), so an
                // outlined tinted pin's number is in the foreground.
                offFloor || (quiet && tinted)
                  ? "text-foreground"
                  : quiet
                    ? outlineClasses[variant]
                    : inkClasses[variant],
              )}
              style={tinted && !outlined ? { color: tint?.onFill } : undefined}
            >
              {visibleContent}
            </span>
          )}
          {featured && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-pill bg-background text-primary shadow-raised ring-1 ring-border">
              <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
            </span>
          )}
        </span>
        {externalLabel && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute max-w-48 whitespace-nowrap rounded-control bg-background px-2 py-1 text-xs font-medium text-foreground shadow-floating ring-1 ring-border",
              externalLabelClasses[labelPlacement],
            )}
          >
            {externalLabel}
          </span>
        )}
      </div>
    );
  },
);
LocationPin.displayName = "LocationPin";

export { LocationPin };
