import { describe, expect, it } from "vitest";
import { initialJourney, journeyReducer as reduce } from "./navigationJourney";

const destination = {
  value: "gallery",
  label: "Gallery",
  description: "Level 2",
};
const origin = { value: "lobby", label: "Lobby", description: "Ground floor" };
const setup = () =>
  reduce(
    reduce(initialJourney, {
      type: "select",
      point: "destination",
      location: destination,
    }),
    { type: "select", point: "origin", location: origin },
  );
const request = () => reduce(setup(), { type: "calculate" });
const navigate = () => {
  const s = request();
  return reduce(
    reduce(s, { type: "result", requestId: s.generation, routeId: "route-1" }),
    { type: "start" },
  );
};
describe("host journey example state", () => {
  it.each([-0.1, 1.2, 0.8, Infinity, NaN])(
    "does not turn inconsistent position %s into valid progress",
    (progress) => {
      const state = reduce(navigate(), {
        type: "progress",
        routeId: "route-1",
        progress,
      });
      expect(state.route?.progress).toBeNull();
      expect(state.phase).toBe("navigating");
    },
  );
  it("validates the position against the same newly supplied section snapshot", () => {
    const state = reduce(navigate(), {
      type: "progress",
      routeId: "route-1",
      progress: 0.6,
      activeLeg: { start: 0.5, end: 1 },
    });
    expect(state.route?.progress).toBe(0.6);
    expect(
      reduce(state, { type: "progress", routeId: "route-1", progress: 0.4 })
        .route?.progress,
    ).toBeNull();
    expect(
      reduce(state, {
        type: "progress",
        routeId: "route-1",
        progress: 0.6,
        activeLeg: { start: 0.7, end: 0.5 },
      }).route?.progress,
    ).toBeNull();
  });
  it("keeps a transition host-controlled and treats invalid position as unknown", () => {
    const atLift = reduce(navigate(), {
      type: "progress",
      routeId: "route-1",
      progress: 0.5,
    });
    expect(atLift.route?.activeLeg).toEqual({ start: 0, end: 0.5 });
    const afterLift = reduce(atLift, {
      type: "progress",
      routeId: "route-1",
      progress: 0.6,
      activeLeg: { start: 0.5, end: 1 },
    });
    expect(afterLift.route?.activeLeg).toEqual({ start: 0.5, end: 1 });
    expect(
      reduce(afterLift, {
        type: "progress",
        routeId: "old",
        progress: 0,
        activeLeg: { start: 0, end: 0.5 },
      }),
    ).toEqual(afterLift);
    expect(
      reduce(afterLift, { type: "progress", routeId: "route-1", progress: NaN })
        .route?.progress,
    ).toBeNull();
    expect(afterLift.phase).toBe("navigating");
  });
  it("never treats typed text as a resolved origin", () => {
    const s = reduce(setup(), { type: "query", query: "Lobby" });
    expect(s.origin).toBeNull();
    expect(reduce(s, { type: "calculate" }).phase).toBe("setup");
  });
  it("rejects old search results after new text, selection or cancellation", () => {
    const a = reduce(initialJourney, { type: "query", query: "L" });
    for (const b of [
      reduce(a, { type: "query", query: "Ga" }),
      reduce(a, { type: "select", point: "origin", location: origin }),
      reduce(a, { type: "cancel" }),
    ]) {
      expect(
        reduce(b, {
          type: "suggestions",
          requestId: a.generation,
          options: [origin],
        }),
      ).toBe(b);
    }
  });
  it("rejects calculation responses after cancellation, point change or newer calculation", () => {
    const a = request();
    for (const b of [
      reduce(a, { type: "cancel" }),
      reduce(a, { type: "select", point: "destination", location: origin }),
      reduce(reduce(a, { type: "cancel" }), { type: "calculate" }),
    ]) {
      expect(
        reduce(b, {
          type: "result",
          requestId: a.generation,
          routeId: "stale",
        }),
      ).toBe(b);
    }
  });
  it("does not arrive from progress, and accepts arrival once for the active route", () => {
    const s = reduce(navigate(), {
      type: "progress",
      routeId: "route-1",
      progress: 1,
      activeLeg: { start: 0.5, end: 1 },
    });
    expect(s.route?.progress).toBe(1);
    expect(s.phase).toBe("navigating");
    expect(reduce(s, { type: "arrive", routeId: "old" })).toBe(s);
    const arrived = reduce(s, { type: "arrive", routeId: "route-1" });
    expect(arrived.actual).toBeUndefined();
    expect(
      reduce(arrived, {
        type: "arrive",
        routeId: "route-1",
        actual: { duration: "99 min" },
      }),
    ).toBe(arrived);
    const done = reduce(arrived, { type: "done" });
    expect(done.phase).toBe("browse");
    expect(done.destination).toEqual(destination);
    expect(done.doneCount).toBe(1);
    expect(reduce(done, { type: "done" })).toBe(done);
  });
  it("keeps supplied actual totals distinct from estimates and ignores old route updates after reroute", () => {
    const s = navigate();
    const reroute = reduce(s, { type: "calculate" });
    expect(reduce(reroute, { type: "arrive", routeId: "route-1" })).toBe(
      reroute,
    );
    const arrived = reduce(s, {
      type: "arrive",
      routeId: "route-1",
      actual: { duration: "8 min", distance: "240 m" },
    });
    expect(arrived.actual).toEqual({ duration: "8 min", distance: "240 m" });
  });
  it("keeps points on failure and never silently changes step-free preference", () => {
    const s = request();
    const failed = reduce(s, {
      type: "failure",
      requestId: s.generation,
      reason: "step-free-unavailable",
    });
    expect(failed.phase).toBe("recovery");
    expect(failed.origin).toEqual(origin);
    expect(failed.destination).toEqual(destination);
    expect(failed.route).toBeNull();
  });
  it("cancels an unconfirmed map point without losing the confirmed origin", () => {
    const s = reduce(setup(), { type: "choose-map" });
    expect(reduce(s, { type: "cancel-map" }).origin).toEqual(origin);
    expect(reduce(s, { type: "confirm-map", location: null })).toBe(s);
    expect(
      reduce(s, { type: "confirm-map", location: destination }).origin,
    ).toEqual(destination);
  });
});
