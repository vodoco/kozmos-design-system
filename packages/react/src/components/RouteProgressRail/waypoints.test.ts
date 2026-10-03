import { describe, expect, it } from "vitest";
import { validWaypoints, visibleWaypoints } from "./waypoints";

const points = [
  {
    id: "end",
    position: 1,
    type: "destination" as const,
    label: "Destination",
  },
  {
    id: "lift",
    position: 0.5,
    type: "lift-up" as const,
    label: "Elevator to level 2",
  },
  { id: "same", position: 0.5, type: "right" as const, label: "Turn right" },
  { id: "start", position: 0, type: "straight" as const, label: "Entrance" },
];

describe("route waypoint layout", () => {
  it("sorts by position and retains coincident semantics without inventing distance", () => {
    expect(validWaypoints(points).map((p) => p.id)).toEqual([
      "start",
      "lift",
      "same",
      "end",
    ]);
    expect(visibleWaypoints(points, 300, null).map((p) => p.id)).toEqual([
      "start",
      "lift",
      "end",
    ]);
  });
  it("hides visual collisions with current position or a tiny container", () => {
    expect(visibleWaypoints(points, 300, 0.5).map((p) => p.id)).toEqual([
      "start",
      "end",
    ]);
    expect(visibleWaypoints(points, 20, null)).toEqual([]);
    expect(visibleWaypoints(points, 54, null)).toHaveLength(1);
  });
  it("rejects invalid positions and ambiguous IDs instead of drawing false waypoints", () => {
    const invalid = points.concat([
      { ...points[0], id: "bad", position: NaN },
      { ...points[0], id: "outside", position: 2 },
      { ...points[0], id: "lift", position: 0.1 },
    ]);
    expect(validWaypoints(invalid).map((p) => p.id)).toEqual([
      "start",
      "same",
      "end",
    ]);
  });
});
