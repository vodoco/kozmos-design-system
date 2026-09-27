import React from "react";
import type { MapCollisionInsets } from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";

export interface MapOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  width?: "auto" | "sm" | "md" | "lg" | "full";
  /** Extra renderer/attribution clearance supplied by the map adapter. */
  collisionInsets?: Partial<MapCollisionInsets>;
}

const positionClasses: Record<
  NonNullable<MapOverlayProps["position"]>,
  string
> = {
  "top-left": "left-[var(--map-overlay-left)] top-[var(--map-overlay-top)]",
  "top-right": "right-[var(--map-overlay-right)] top-[var(--map-overlay-top)]",
  "bottom-left":
    "bottom-[var(--map-overlay-bottom)] left-[var(--map-overlay-left)]",
  "bottom-right":
    "bottom-[var(--map-overlay-bottom)] right-[var(--map-overlay-right)]",
  "top-center": "left-1/2 top-[var(--map-overlay-top)] -translate-x-1/2",
  "bottom-center":
    "bottom-[var(--map-overlay-bottom)] left-1/2 -translate-x-1/2",
};

const widthClasses: Record<NonNullable<MapOverlayProps["width"]>, string> = {
  auto: "w-auto max-w-[calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right))]",
  sm: "w-[min(20rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  md: "w-[min(24rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  lg: "w-[min(32rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  full: "w-[calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right))]",
};

const MapOverlay = React.forwardRef<HTMLDivElement, MapOverlayProps>(
  (
    {
      className,
      position = "top-left",
      width = "auto",
      collisionInsets,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const insetStyle = {
      "--map-overlay-top": `calc(env(safe-area-inset-top) + 1rem + ${collisionInsets?.top ?? 0}px)`,
      "--map-overlay-right": `calc(env(safe-area-inset-right) + 1rem + ${collisionInsets?.right ?? 0}px)`,
      "--map-overlay-bottom": `calc(env(safe-area-inset-bottom) + 1rem + ${collisionInsets?.bottom ?? 0}px)`,
      "--map-overlay-left": `calc(env(safe-area-inset-left) + 1rem + ${collisionInsets?.left ?? 0}px)`,
      ...style,
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-50 flex flex-col gap-4",
          positionClasses[position],
          widthClasses[width],
          className,
        )}
        style={insetStyle}
        {...props}
      >
        <div className="pointer-events-auto flex max-h-[calc(100dvh-var(--map-overlay-top)-var(--map-overlay-bottom))] w-full flex-col gap-4 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    );
  },
);

MapOverlay.displayName = "MapOverlay";

export { MapOverlay };
