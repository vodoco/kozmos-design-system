import { ProgressTrack, type ProgressRange } from "../Progress/Progress";
import { UserLocationMarker } from "../UserLocationMarker/UserLocationMarker";
import { DirectionIcon } from "../DirectionStep/DirectionStep";
import { visibleRouteWaypoints, type RouteProgressWaypoint } from "./waypoints";

/** SDK layout only: the reusable Core track and location dot own their rendering. */
export function RouteTrack({
  activeLeg,
  progress,
  appearance,
  waypoints,
  width,
  activeWaypointId,
  positionMode,
  motion,
}: {
  activeLeg?: ProgressRange;
  progress: number | null;
  appearance: "theme" | "gradient";
  waypoints: readonly RouteProgressWaypoint[];
  width: number;
  activeWaypointId?: string;
  positionMode: "static" | "live";
  motion: "none" | "directional";
}) {
  return (
    <div className="kozmos-route-track" aria-hidden="true">
      <div className="kozmos-route-track-axis">
        <ProgressTrack
          activeRange={activeLeg}
          value={progress}
          appearance={appearance}
          positionMode={positionMode}
          motion={motion}
        />
        <span
          className="kozmos-route-track-endpoint"
          style={{ insetInlineStart: "0%" }}
        />
        <span
          className="kozmos-route-track-endpoint"
          style={{ insetInlineStart: "100%" }}
        />
        {visibleRouteWaypoints(
          waypoints,
          width,
          activeLeg?.end,
          activeWaypointId,
        ).map((point) => (
          <span
            key={point.id}
            data-waypoint-id={point.id}
            className="kozmos-route-track-waypoint"
            style={{ insetInlineStart: `${point.position * 100}%` }}
          >
            <DirectionIcon type={point.type} className="h-4 w-4" />
          </span>
        ))}
        {progress !== null && (
          <span
            data-testid="route-user-location"
            data-position={progress}
            className="kozmos-route-track-location"
            style={{ insetInlineStart: `${progress * 100}%` }}
          >
            <UserLocationMarker compact aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
