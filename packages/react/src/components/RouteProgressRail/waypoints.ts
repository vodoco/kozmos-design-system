import type { DirectionType } from "../DirectionStep/DirectionStep";

/** A host-owned transition; positions share the rail's distance/time basis. */
export interface RouteProgressWaypoint {
  id: string;
  position: number;
  type: DirectionType;
  /** Localized transport, destination floor and/or landmark description. */
  label: string;
}

export function validWaypoints(points: readonly RouteProgressWaypoint[]) {
  const counts = new Map<string, number>();
  points.forEach((point) =>
    counts.set(point.id, (counts.get(point.id) ?? 0) + 1),
  );
  return points
    .filter(
      (p) =>
        p.id.trim() &&
        p.label.trim() &&
        counts.get(p.id) === 1 &&
        Number.isFinite(p.position) &&
        p.position >= 0 &&
        p.position <= 1,
    )
    .sort((a, b) => a.position - b.position);
}

/** Deterministic visual thinning only: every valid label remains available to AT. */
export function visibleWaypoints(
  points: readonly RouteProgressWaypoint[],
  width: number,
  progress: number | null,
) {
  if (width < 54) return [];
  const travel = width - 54;
  let last = -Infinity;
  return validWaypoints(points).filter((point) => {
    const x = 27 + travel * point.position;
    const current = progress === null ? null : 27 + travel * progress;
    if ((current !== null && Math.abs(current - x) < 33) || x - last < 28)
      return false;
    last = x;
    return true;
  });
}
