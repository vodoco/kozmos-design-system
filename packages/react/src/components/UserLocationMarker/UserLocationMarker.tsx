import * as React from "react";
import { cn } from "../../utils";

export interface UserLocationMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: number; // 0 to 360 degrees
  showHeading?: boolean;
  /**
   * What the marker is called, for a visitor who cannot see it. Hard-coded
   * English until row 67, so a German or Japanese device announced "User
   * location" whatever else the product had translated.
   */
  label?: string;
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
      label = "User location",
      ...props
    },
    ref,
  ) => {
    const gradientId = `kozmos-location-cone-${React.useId().replace(/:/g, "")}`;
    return (
      <div
        ref={ref}
        role="img"
        aria-label={label}
        className={cn(
          "relative flex items-center justify-center min-h-16 min-w-16",
          className,
        )}
        {...props}
      >
        {/* The halo: 64 at 14 %, still. The ring: 48, pulsing. */}
        <div className="absolute h-16 w-16 rounded-pill bg-data-blue opacity-[0.14] outline-none pointer-events-none" />
        <div className="absolute h-12 w-12 rounded-pill bg-data-blue opacity-30 animate-ping motion-reduce:animate-none outline-none pointer-events-none" />

        {/* Heading Cone (if active) */}
        {showHeading && (
          <div
            className="absolute h-24 w-24 pointer-events-none"
            style={{
              transform: `rotate(${heading}deg)`,
              transformOrigin: "center",
            }}
          >
            {/* Complex SVG cone representing view direction */}
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path
                d="M50 50 L85 10 A 50 50 0 0 0 15 10 Z"
                fill={`url(#${gradientId})`}
                opacity="0.4"
              />
              <defs>
                <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor="var(--semantics-data-blue)"
                    stopOpacity="1"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--semantics-data-blue)"
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>
            </svg>
          </div>
        )}

        {/* Core Dot bordered with white */}
        <div className="relative h-[18px] w-[18px] rounded-pill border-[3px] border-background bg-data-blue shadow-floating z-10" />
      </div>
    );
  },
);
UserLocationMarker.displayName = "UserLocationMarker";

export { UserLocationMarker };
