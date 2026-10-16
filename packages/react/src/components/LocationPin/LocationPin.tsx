import React from "react";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { DensityScope } from "../../theme/DensityScope";
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
   *  second calls this once and is not passed on as another. By keyboard,
   *  Enter opens a pin that is already the current one (selected, or a place
   *  on its own) or that has `onOpen` alone; otherwise Enter, and Space
   *  always, is the ordinary press (Olcay, 16 Oct). */
  onOpen?: () => void;
  /** Read after the label while Enter opens the pin, so a screen-reader user
   *  knows. Default "Press Enter to open details"; pass it translated. */
  openHint?: string;
}

type Kind = "result" | "featured" | "place";

// MapLibre counts a second tap within 500 ms (its tap recognizer's
// MAX_TAP_INTERVAL): on it, the map zooms and cancels the tap's click, so a
// pin's details would never open. A pin keeps any second tap within that
// window to itself.
const MAP_DOUBLE_TAP_MS = 500;

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
      openHint = "Press Enter to open details",
      onClick,
      onDoubleClick,
      onKeyDown,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const doubleTap = useDoubleTapGate();
    const hintId = React.useId();
    const node = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (element: HTMLDivElement | null) => {
        node.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref],
    );
    const kind: Kind = place ? "place" : featured ? "featured" : "result";
    const isInteractive = Boolean(onClick || onOpen);
    // Enter opens the current pin (selected, or a place on its own), or one
    // whose only action is to open; any other pin it presses.
    const opensOnEnter =
      Boolean(onOpen) && !disabled && (selected || place || !onClick);
    // A disabled pin is still a (disabled) button for assistive technology,
    // but lets pointers through to the map, as on SwiftUI.
    const takesPointers = isInteractive && !disabled;

    // The second tap opens the place "rather than zooming the map" (decision
    // 71). A map listens for taps on its container, above the pin: MapLibre
    // zooms on a second tap there and cancels its click, so the pin never saw
    // it (measured with MapLibre GL 4.7.1, touch, Chromium and WebKit, on 16
    // Oct: the map zoomed and the pin didn't open). Listened for on the pin
    // itself, natively, so it holds wherever React delegates its events. Only
    // a second tap is kept: a first tap, and a pan begun on the pin, still
    // reach the map.
    const keepsSecondTap = Boolean(onOpen) && !disabled;
    React.useEffect(() => {
      const element = node.current;
      if (!element || !keepsSecondTap) return;
      let lastTapEnd = -Infinity;
      let second = false;
      const touchStart = (event: TouchEvent) => {
        second = event.timeStamp - lastTapEnd < MAP_DOUBLE_TAP_MS;
        if (second) event.stopPropagation();
      };
      const touchEnd = (event: TouchEvent) => {
        if (second) {
          event.stopPropagation();
          second = false;
          lastTapEnd = -Infinity;
        } else {
          lastTapEnd = event.timeStamp;
        }
      };
      const touchCancel = () => {
        second = false;
      };
      element.addEventListener("touchstart", touchStart, { passive: true });
      element.addEventListener("touchend", touchEnd, { passive: true });
      element.addEventListener("touchcancel", touchCancel, { passive: true });
      return () => {
        element.removeEventListener("touchstart", touchStart);
        element.removeEventListener("touchend", touchEnd);
        element.removeEventListener("touchcancel", touchCancel);
      };
    }, [keepsSecondTap]);

    // A double click stops at the pin: React listens on the pin's own root or
    // portal container, which a map's marker element is, so the stop holds
    // below the map's container either way (measured as above, a portal
    // too).
    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (onOpen && !disabled) event.stopPropagation();
      onDoubleClick?.(event);
    };

    const open = () => {
      trackEvent("LocationPin", "location_pin_opened", { kind, number });
      onOpen?.();
    };

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (onOpen) {
        const press = doubleTap(event);
        if (press === "ignore") return;
        if (press === "open") {
          open();
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
      if (event.key === "Enter" && opensOnEnter) {
        event.preventDefault();
        // A held Enter opens once: the repeats that follow a first Enter
        // which selected the pin would otherwise open it too.
        if (!event.repeat) open();
      } else if (
        isInteractive &&
        !disabled &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        event.currentTarget.click();
      }
      onKeyDown?.(event);
    };
    const describedByIds =
      [describedBy, opensOnEnter ? hintId : null].filter(Boolean).join(" ") ||
      undefined;

    return (
      // The SDK's touch geometry under any density (decision 89).
      <DensityScope density="touch" asChild>
        <div
          ref={setRefs}
          aria-controls={resultId}
          aria-current={selected || place ? "location" : undefined}
          aria-disabled={isInteractive && disabled ? true : undefined}
          aria-label={
            kind === "featured" ? `${label}, ${featuredLabel}` : label
          }
          // Owned CSS draws the markers, anchors them (the pointer's tip, or the
          // dot's centre) and keeps a 44px target round them, with or without
          // @scope.
          className={cn("kozmos-location-pin", className)}
          data-disabled={disabled || undefined}
          data-interactive={takesPointers || undefined}
          data-kind={kind}
          data-selected={selected || undefined}
          onClick={isInteractive ? handleClick : undefined}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          role={isInteractive ? "button" : "img"}
          tabIndex={isInteractive && !disabled ? 0 : undefined}
          {...props}
          aria-describedby={describedByIds}
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
                <span className="kozmos-location-pin-logo">
                  {markerContent}
                </span>
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
              className="kozmos-location-pin-label max-w-48 whitespace-nowrap rounded-control bg-background px-2 py-1 text-xs font-semibold text-foreground shadow-floating ring-1 ring-border"
              data-placement={labelPlacement}
            >
              {externalLabel}
            </span>
          )}
          {opensOnEnter && (
            // A description need not be shown to be read: hidden, it is still
            // the pin's accessible description, and nothing draws it.
            <span hidden id={hintId}>
              {openHint}
            </span>
          )}
        </div>
      </DensityScope>
    );
  },
);
LocationPin.displayName = "LocationPin";

export { LocationPin };
