import * as React from "react";
import { cn } from "../../utils";

export interface UserLocationMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: number; // 0 to 360 degrees
  showHeading?: boolean;
  /** Dot only, without the map halo, heading cone or pulse (for compact compositions). */
  compact?: boolean;
  /**
   * What the marker is called, for a visitor who cannot see it. Hard-coded
   * English until row 67, so a German or Japanese device announced "User
   * location" whatever else the product had translated.
   */
  label?: string;
  /**
   * The visitor is on another level than the one in view.
   *
   * Drawn the way LocationPin draws its own `offFloor`: the dot goes hollow
   * rather than merely dimming, so the state is carried by shape and not by
   * colour alone — and the halo and the heading cone go, because neither
   * means anything about a level you are not looking at.
   *
   * Without it the marker looked the same whatever level was in view, so the
   * map page hid it altogether and the visitor lost their position (GAP-069).
   */
  offFloor?: boolean;
  /**
   * What the marker is called while the visitor is on another level. Its own
   * string because "User location" would be a lie about what is on screen.
   */
  offFloorLabel?: string;
}

const UserLocationMarker = React.forwardRef<
  HTMLDivElement,
  UserLocationMarkerProps
>(
  (
    {
      className,
      heading = 0,
      showHeading = true,
      compact = false,
      label = "User location",
      offFloor = false,
      offFloorLabel = "User location, on another level",
      ...props
    },
    ref,
  ) => {
    const gradientId = `kozmos-location-cone-${React.useId().replace(/:/g, "")}`;
    return (
      <div
        ref={ref}
        role="img"
        aria-label={offFloor ? offFloorLabel : label}
        data-off-floor={offFloor || undefined}
        className={cn(
          "relative flex items-center justify-center",
          compact ? "h-[18px] w-[18px]" : "min-h-16 min-w-16",
          className,
        )}
        {...props}
      >
        {/* The halo: 64 at 14 %, still. The ring: 48, pulsing. */}
        {!offFloor && !compact && (
          <>
            <div className="absolute h-16 w-16 rounded-pill bg-map-marker-dot opacity-[0.14] outline-none pointer-events-none" />
            <div className="absolute h-12 w-12 rounded-pill bg-map-marker-dot opacity-30 animate-ping motion-reduce:animate-none outline-none pointer-events-none" />
          </>
        )}

        {/* The heading cone, as SwiftUI and Compose draw it (Olcay,
            2026-10-05): in the 64 box, from the centre to 15 % and 85 % of
            the top edge, the top a quadratic curve through 10 % above it,
            in the marker's blue fading from 40 % at the centre to nothing 32 out.
            The curve rises past the box, so the svg does not clip. */}
        {showHeading && !offFloor && !compact && (
          <div
            className="absolute h-16 w-16 pointer-events-none"
            style={{
              transform: `rotate(${heading}deg)`,
              transformOrigin: "center",
            }}
          >
            <svg
              viewBox="0 0 64 64"
              overflow="visible"
              className="h-full w-full"
            >
              <path
                d="M32 32 L9.6 0 Q32 -6.4 54.4 0 Z"
                fill={`url(#${gradientId})`}
                opacity="0.4"
              />
              <defs>
                <radialGradient
                  id={gradientId}
                  gradientUnits="userSpaceOnUse"
                  cx="32"
                  cy="32"
                  r="32"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--semantics-map-marker-dot)"
                    stopOpacity="1"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--semantics-map-marker-dot)"
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>
            </svg>
          </div>
        )}

        {/* The dot: 18, the marker's blue, with a 3 ring and no shadow, as SwiftUI
            and Compose draw it (Olcay, 2026-10-05). The blue and the full
            marker's white ring are fixed in both themes, so the dot clears
            3:1 against its ring in dark as in light; the compact dot's ring
            is the background, the surface it sits on. */}
        <div
          className={cn(
            "relative z-10 h-[18px] w-[18px] rounded-pill",
            offFloor
              ? // Hollow, as LocationPin's offFloor is: the ring keeps the
                // marker findable while the empty middle says it is not here.
                "border-[3px] border-map-marker-dot bg-background"
              : cn(
                  "border-[3px] bg-map-marker-dot",
                  compact ? "border-background" : "border-map-marker-ring",
                ),
          )}
        />
      </div>
    );
  },
);
UserLocationMarker.displayName = "UserLocationMarker";

export { UserLocationMarker };
