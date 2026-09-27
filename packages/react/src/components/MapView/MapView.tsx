import React from "react";
import { cn } from "../../utils";

/**
 * How the map sits in what holds it.
 *
 * `framed` is a map in page flow: its own surface, with a boundary, a radius
 * and a height to stand up in. `fill` is a map that IS the surface — inside
 * AdaptiveMapShell it covers the screen edge to edge, and a border, a rounded
 * corner or a 400px floor there are all wrong: the frame is the window.
 */
export type MapViewVariant = "framed" | "fill";

export interface MapViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Accessible name for the rendered map surface. */
  mapLabel?: string;
  variant?: MapViewVariant;
}

const MapView = React.forwardRef<HTMLDivElement, MapViewProps>(
  (
    {
      className,
      children,
      mapLabel = "Map",
      role,
      variant = "framed",
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      aria-label={mapLabel}
      className={cn(
        "relative h-full w-full overflow-hidden bg-muted",
        variant === "framed" &&
          "min-h-[400px] rounded-container border border-border",
        className,
      )}
      // A filling map is inside a shell that has already named the map area a
      // region, so naming it again has a screen reader announce the same
      // surface twice. `group` keeps the label without the second landmark.
      // A caller's own role still wins.
      role={role ?? (variant === "fill" ? "group" : "region")}
      {...props}
    >
      {children}
    </div>
  ),
);
MapView.displayName = "MapView";

export { MapView };
