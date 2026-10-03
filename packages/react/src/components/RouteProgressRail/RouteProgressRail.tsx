import React from "react";
import { cn } from "../../utils";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

export interface RouteProgressRailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How far along the route, 0 to 1; anything outside is clamped. */
  progress: number | null;
  /** Localized progress description, particularly when progress is unknown (null). */
  valueText?: string;
  /** The current manoeuvre, carried on the disc. */
  type: DirectionType;
  /** What the rail is called to assistive technology: "Step 2 of 4". */
  label: string;
}

/** The rail's geometry in pixels: the end dots, the travelling disc, the track. */
export const ROUTE_PROGRESS_RAIL = { dot: 10, disc: 34, track: 6 } as const;

export function clampProgress(progress: number) {
  return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
}

/**
 * Where the disc's leading edge sits for a progress, as a CSS length: from
 * just after the start dot to just before the end dot.
 */
export function discLeading(progress: number) {
  return `calc(min(10px, 20%) + max(0px, 100% - min(20px, 40%) - min(34px, 60%)) * ${clampProgress(progress)})`;
}

/**
 * How far along the route the visitor is, as a rail: a dot where it starts,
 * a disc carrying the current manoeuvre's arrow that travels the track, a
 * dot where it ends. Assistive technology hears the label and the progress
 * as a percentage.
 */
const RouteProgressRail = React.forwardRef<
  HTMLDivElement,
  RouteProgressRailProps
>(({ className, style, progress, type, label, valueText, ...props }, ref) => {
  const { disc, track } = ROUTE_PROGRESS_RAIL;
  const clamped = clampProgress(progress ?? 0);
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress === null ? undefined : Math.round(clamped * 100)}
      aria-valuetext={valueText}
      className={cn("kozmos-route-rail relative w-full", className)}
      style={{ height: disc, ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 rounded-pill bg-muted"
        style={{ insetInline: "min(10px, 20%)", height: track }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-pill",
          progress === null ? "bg-muted" : "bg-primary",
        )}
        style={{
          insetInlineStart: 0,
          width: "min(10px, 20%)",
          aspectRatio: "1",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 rounded-pill bg-muted"
        style={{ insetInlineEnd: 0, width: "min(10px, 20%)", aspectRatio: "1" }}
      />
      {progress !== null && (
        <span
          aria-hidden="true"
          data-testid="route-progress-disc"
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-pill bg-primary text-primary-foreground"
          style={{
            insetInlineStart: discLeading(clamped),
            width: "min(34px, 60%)",
            aspectRatio: "1",
          }}
        >
          <span
            style={{ width: "50%", height: "50%", maxWidth: 16, maxHeight: 16 }}
          >
            <DirectionIcon type={type} className="h-full w-full" />
          </span>
        </span>
      )}
    </div>
  );
});
RouteProgressRail.displayName = "RouteProgressRail";

export { RouteProgressRail };
