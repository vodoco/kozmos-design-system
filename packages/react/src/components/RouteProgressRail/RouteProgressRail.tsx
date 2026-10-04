import React from "react";
import { cn } from "../../utils";
import { validProgressRange, type ProgressRange } from "../Progress/Progress";
import { RouteTrack } from "./RouteTrack";
import {
  validWaypoints,
  visibleWaypoints,
  type RouteProgressWaypoint,
} from "./waypoints";
export type { RouteProgressWaypoint } from "./waypoints";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

export interface RouteProgressRailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Absolute route position, 0 to 1. With activeLeg, null/nonfinite/outside
   * that interval means unknown; static mode ignores it. Legacy calls clamp. */
  progress: number | null;
  /** Localized progress description, particularly when progress is unknown (null). */
  valueText?: string;
  /** Optional transition markers. Invalid/ambiguous IDs or positions are omitted. */
  waypoints?: readonly RouteProgressWaypoint[];
  /** Opt into a static completed segment. Unknown progress never paints completion. */
  showCompletedTrack?: boolean;
  /** Opt into distance-based route presentation. Host advances this interval explicitly,
   * atomically with waypoints and progress on reroute; omitting it retains the legacy step disc. */
  activeLeg?: ProgressRange;
  /** Next transition ID at activeLeg.end; disambiguates coincident transitions. */
  activeWaypointId?: string;
  /** Gradient spans the selected static section, or journey start to the live dot. */
  appearance?: "theme" | "gradient";
  /** Explicitly distinguish manual section selection from unavailable live positioning. */
  positionMode?: "static" | "live";
  /** Opt-in directional flow. Set none for paused, unreliable or completed guidance. */
  motion?: "none" | "directional";
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
>(
  (
    {
      className,
      style,
      progress,
      type,
      label,
      valueText,
      waypoints = [],
      showCompletedTrack = false,
      activeLeg,
      activeWaypointId,
      appearance = "theme",
      positionMode = "live",
      motion = "none",
      ...props
    },
    ref,
  ) => {
    const { disc, track } = ROUTE_PROGRESS_RAIL;
    const clamped = clampProgress(progress ?? 0);
    const routeMode = activeLeg !== undefined;
    const range = validProgressRange(activeLeg) ? activeLeg : undefined;
    const position = routeMode
      ? positionMode === "live" &&
        range &&
        progress !== null &&
        Number.isFinite(progress) &&
        progress >= range.start &&
        progress <= range.end
        ? progress
        : null
      : progress === null
        ? null
        : clamped;
    const nodeRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState(0);
    const waypointDescription = React.useId();
    const valid = validWaypoints(waypoints);
    const visible = visibleWaypoints(
      valid,
      width,
      progress === null ? null : clamped,
    );
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    React.useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;
      const measure = () => setWidth(node.clientWidth);
      measure();
      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
      }
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);
    return (
      <>
        <div
          ref={setRef}
          role={routeMode && positionMode === "static" ? "img" : "progressbar"}
          aria-label={
            routeMode && positionMode === "static" && valueText
              ? `${label}: ${valueText}`
              : label
          }
          aria-valuemin={routeMode && positionMode === "static" ? undefined : 0}
          aria-valuemax={
            routeMode && positionMode === "static" ? undefined : 100
          }
          aria-valuenow={
            position === null ? undefined : Math.round(position * 100)
          }
          aria-valuetext={
            routeMode && positionMode === "static" ? undefined : valueText
          }
          className={cn("kozmos-route-rail relative w-full", className)}
          style={{ height: routeMode ? 48 : disc, ...style }}
          {...props}
          aria-describedby={
            [
              props["aria-describedby"],
              valid.length ? waypointDescription : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        >
          {routeMode ? (
            <RouteTrack
              activeLeg={range}
              activeWaypointId={activeWaypointId}
              progress={position}
              appearance={appearance}
              positionMode={positionMode}
              motion={motion}
              waypoints={valid}
              width={width}
            />
          ) : (
            <>
              <span
                aria-hidden="true"
                className="absolute top-1/2 -translate-y-1/2 rounded-pill bg-muted"
                style={{ insetInline: "min(10px, 20%)", height: track }}
              />
              {showCompletedTrack && progress !== null && clamped > 0 && (
                <span
                  aria-hidden="true"
                  data-testid="route-completed-track"
                  className="absolute top-1/2 -translate-y-1/2 rounded-pill bg-primary"
                  style={{
                    insetInlineStart: "min(10px, 20%)",
                    height: track,
                    width: `calc(min(17px, 30%) + max(0px, 100% - min(20px, 40%) - min(34px, 60%)) * ${clamped})`,
                  }}
                />
              )}
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
                style={{
                  insetInlineEnd: 0,
                  width: "min(10px, 20%)",
                  aspectRatio: "1",
                }}
              />
              {visible.map((point) => (
                <span
                  key={point.id}
                  aria-hidden="true"
                  data-waypoint-id={point.id}
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-pill bg-muted text-foreground border border-border"
                  style={{
                    insetInlineStart:
                      15 + Math.max(0, width - 54) * point.position,
                    width: 24,
                    height: 24,
                  }}
                >
                  <DirectionIcon type={point.type} className="h-4 w-4" />
                </span>
              ))}
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
                    style={{
                      width: "50%",
                      height: "50%",
                      maxWidth: 16,
                      maxHeight: 16,
                    }}
                  >
                    <DirectionIcon type={type} className="h-full w-full" />
                  </span>
                </span>
              )}
            </>
          )}
        </div>
        {valid.length > 0 && (
          <span id={waypointDescription} hidden>
            {valid.map((point) => point.label).join("; ")}
          </span>
        )}
      </>
    );
  },
);
RouteProgressRail.displayName = "RouteProgressRail";

export { RouteProgressRail };
