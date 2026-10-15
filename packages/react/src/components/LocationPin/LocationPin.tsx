import React from "react";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { useDoubleTapGate } from "../../utils/double-tap";

/**
 * The SDK's map result markers (decision 71, GAP-120). In a product these
 * come from the map style's sprite sheet, and a featured place's tile from the
 * featured sprite Pointr's back end makes with its logo; LocationPin draws the
 * same markers for prototypes and boards (decision 81).
 */
export interface LocationPinProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The marker's accessible name. */
  label?: string;
  /** The result's number, as its card's number tab shows it, in the pill.
   *  Without one the pill shows a dot. */
  number?: number;
  /** A featured place's logo, normally an image: it fits inside the tile's
   *  rim, never cropped. Only the featured tile shows it. */
  markerContent?: React.ReactNode;
  /** Fills a result's pill, and grows a featured tile from 44 to 52. */
  selected?: boolean;
  /** A featured place: its logo in a rounded tile with a dark rim, no number
   *  and no accent colour (decision 81: a static sprite with the logo). */
  featured?: boolean;
  /** Added to `label` for a featured place, so assistive technology hears
   *  what the tile shows. Default "Featured"; pass it translated. */
  featuredLabel?: string;
  /** A place on its own, its details open: the green pin, the only marker
   *  shown. It wins over `featured` and `number`. */
  place?: boolean;
  disabled?: boolean;
  externalLabel?: string;
  labelPlacement?: "top" | "right" | "bottom" | "left";
  resultId?: string;
  /** A double tap on the marker opens the place's details (decision 71),
   *  rather than zooming the map: the first tap is the ordinary press, the
   *  second calls this once and is not passed on as another. A keyboard press
   *  is always the ordinary press. */
  onOpen?: () => void;
}

type Kind = "result" | "featured" | "place";

// The place pin's teardrop: a circle of 40 whose bottom comes to a point,
// three quarter arcs and a square corner turned -45 degrees about its centre,
// as the SDK's sprite draws it; its tip is 48.28 below the circle's top.
const TEARDROP =
  "M0 20 A20 20 0 0 1 20 0 A20 20 0 0 1 40 20 A20 20 0 0 1 20 40 L0 40 Z";

const LocationPin = React.forwardRef<HTMLDivElement, LocationPinProps>(
  (
    {
      className,
      label = "Location",
      number,
      markerContent,
      selected = false,
      featured = false,
      featuredLabel = "Featured",
      place = false,
      disabled = false,
      externalLabel,
      labelPlacement = "bottom",
      resultId,
      onOpen,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const doubleTap = useDoubleTapGate();
    const kind: Kind = place ? "place" : featured ? "featured" : "result";
    const isInteractive = Boolean(onClick || onOpen);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (onOpen) {
        const press = doubleTap(event);
        if (press === "ignore") return;
        if (press === "open") {
          trackEvent("LocationPin", "location_pin_opened", { kind, number });
          onOpen();
          return;
        }
      }
      trackEvent("LocationPin", "location_pin_clicked", {
        kind,
        number,
        selected,
      });
      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isInteractive &&
        !disabled &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        event.currentTarget.click();
      }
      onKeyDown?.(event);
    };

    return (
      <div
        ref={ref}
        aria-controls={resultId}
        aria-current={selected || place ? "location" : undefined}
        aria-disabled={isInteractive && disabled ? true : undefined}
        aria-label={kind === "featured" ? `${label}, ${featuredLabel}` : label}
        // Owned CSS draws the markers, anchors them (the pointer's tip, or the
        // dot's centre) and keeps a 44px target round them, with or without
        // @scope.
        className={cn("kozmos-location-pin", className)}
        data-disabled={disabled || undefined}
        data-interactive={isInteractive || undefined}
        data-kind={kind}
        data-selected={selected || undefined}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        role={isInteractive ? "button" : "img"}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        {...props}
      >
        {kind === "result" && (
          <span aria-hidden="true" className="kozmos-location-pin-body">
            <span className="kozmos-location-pin-pill">
              {number != null ? (
                number
              ) : (
                <span className="kozmos-location-pin-pill-dot" />
              )}
            </span>
            <svg
              className="kozmos-location-pin-pointer"
              height="7"
              viewBox="0 0 12 7"
              width="12"
            >
              <path d="M0 0H12L6 7Z" />
            </svg>
          </span>
        )}
        {kind === "featured" && (
          <span aria-hidden="true" className="kozmos-location-pin-body">
            <span className="kozmos-location-pin-tile">
              <span className="kozmos-location-pin-logo">{markerContent}</span>
            </span>
            <span className="kozmos-location-pin-dot" />
          </span>
        )}
        {kind === "place" && (
          <span aria-hidden="true" className="kozmos-location-pin-body">
            <svg
              className="kozmos-location-pin-teardrop"
              height="49"
              viewBox="0 0 40 49"
              width="40"
            >
              <path d={TEARDROP} transform="rotate(-45 20 20)" />
              <circle cx="20" cy="20" r="10" />
            </svg>
            <span className="kozmos-location-pin-dot" />
          </span>
        )}
        {/* The words beside the marker, 4 from it; at its side, centred on
            its shape (the pill, the tile, the circle), as on iOS and
            Compose. Owned CSS places it. */}
        {externalLabel && (
          <span
            aria-hidden="true"
            className="kozmos-location-pin-label max-w-48 whitespace-nowrap rounded-control bg-background px-2 py-1 text-xs font-medium text-foreground shadow-floating ring-1 ring-border"
            data-placement={labelPlacement}
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
