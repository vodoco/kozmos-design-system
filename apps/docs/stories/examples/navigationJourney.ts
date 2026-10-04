/** Example HOST state, not a Kozmos routing engine or published contract. Replace fixtures with SDK events. */
import { validProgressRange } from "@kozmos-ds/react";
export interface JourneyPlace {
  value: string;
  label: string;
  description?: string;
}
export type JourneyFailure =
  | "no-route"
  | "step-free-unavailable"
  | "position-unavailable"
  | "offline"
  | "transient";
export interface JourneyState {
  phase:
    | "setup"
    | "map-selection"
    | "calculating"
    | "preview"
    | "navigating"
    | "recovery"
    | "arrived"
    | "browse";
  generation: number;
  origin: JourneyPlace | null;
  destination: JourneyPlace | null;
  query: string;
  suggestions: JourneyPlace[];
  route: {
    id: string;
    progress: number | null;
    activeLeg: { start: number; end: number };
  } | null;
  failure?: JourneyFailure;
  actual?: { duration?: string; distance?: string };
  doneCount: number;
}
export type JourneyEvent =
  | {
      type: "select";
      point: "origin" | "destination";
      location: JourneyPlace | null;
    }
  | { type: "query"; query: string }
  | { type: "suggestions"; requestId: number; options: JourneyPlace[] }
  | {
      type:
        | "calculate"
        | "cancel"
        | "start"
        | "done"
        | "end"
        | "choose-map"
        | "cancel-map"
        | "edit";
    }
  | { type: "confirm-map"; location: JourneyPlace | null }
  | { type: "result"; requestId: number; routeId: string }
  | { type: "failure"; requestId: number; reason: JourneyFailure }
  | {
      type: "progress";
      routeId: string;
      progress: number | null;
      activeLeg?: { start: number; end: number };
    }
  | { type: "arrive"; routeId: string; actual?: JourneyState["actual"] };
export const initialJourney: JourneyState = {
  phase: "setup",
  generation: 0,
  origin: null,
  destination: null,
  query: "",
  suggestions: [],
  route: null,
  doneCount: 0,
};
const valid = (place: JourneyPlace | null) =>
  !!place?.value.trim() && !!place.label.trim();

export function journeyReducer(
  state: JourneyState,
  event: JourneyEvent,
): JourneyState {
  // Any point edit/cancel increments identity. An adapter must additionally abort the actual network/SDK work.
  const invalidate = {
    generation: state.generation + 1,
    route: null,
    failure: undefined,
    actual: undefined,
    suggestions: [],
  };
  switch (event.type) {
    case "select":
      return {
        ...state,
        ...invalidate,
        phase: "setup",
        [event.point]: valid(event.location) ? event.location : null,
        query: "",
      };
    case "query":
      return {
        ...state,
        ...invalidate,
        phase: "setup",
        origin: null,
        query: event.query,
      };
    case "suggestions":
      return state.phase === "setup" &&
        !state.origin &&
        event.requestId === state.generation
        ? { ...state, suggestions: event.options }
        : state;
    case "calculate":
      return valid(state.origin) &&
        valid(state.destination) &&
        ["setup", "recovery", "navigating"].includes(state.phase)
        ? { ...state, ...invalidate, phase: "calculating" }
        : state;
    case "result":
      return state.phase === "calculating" &&
        event.requestId === state.generation &&
        event.routeId.trim()
        ? {
            ...state,
            phase: "preview",
            route: {
              id: event.routeId,
              progress: null,
              activeLeg: { start: 0, end: 0.5 },
            },
          }
        : state;
    case "failure":
      return state.phase === "calculating" &&
        event.requestId === state.generation
        ? { ...state, phase: "recovery", failure: event.reason, route: null }
        : state;
    case "cancel":
      return { ...state, ...invalidate, phase: "setup" };
    case "edit":
      // Back to setup to change a point. Confirmed points stay until a new
      // one is chosen, so cancelling the change restores them.
      return {
        ...state,
        ...invalidate,
        phase: "setup",
        query: "",
      };
    case "end":
      return { ...state, ...invalidate, phase: "browse" };
    case "start":
      return state.phase === "preview" && state.route
        ? { ...state, phase: "navigating" }
        : state;
    case "progress": {
      const activeLeg = event.activeLeg ?? state.route?.activeLeg;
      return state.phase === "navigating" && state.route?.id === event.routeId
        ? {
            ...state,
            route: {
              ...state.route,
              activeLeg: event.activeLeg ?? state.route.activeLeg,
              // Never turn an invalid SDK sample into a convincing start/end
              // position. Validate against the same atomic section snapshot.
              progress:
                validProgressRange(activeLeg) &&
                event.progress !== null &&
                Number.isFinite(event.progress) &&
                event.progress >= activeLeg.start &&
                event.progress <= activeLeg.end
                  ? event.progress
                  : null,
            },
          }
        : state;
    }
    case "arrive":
      return state.phase === "navigating" && state.route?.id === event.routeId
        ? { ...state, phase: "arrived", actual: event.actual }
        : state;
    case "done":
      return state.phase === "arrived"
        ? {
            ...state,
            ...invalidate,
            phase: "browse",
            doneCount: state.doneCount + 1,
          }
        : state;
    case "choose-map":
      return state.phase === "setup"
        ? { ...state, ...invalidate, phase: "map-selection" }
        : state;
    case "cancel-map":
      return state.phase === "map-selection"
        ? { ...state, ...invalidate, phase: "setup" }
        : state;
    case "confirm-map":
      return state.phase === "map-selection" && valid(event.location)
        ? {
            ...state,
            ...invalidate,
            phase: "setup",
            origin: event.location,
            query: "",
          }
        : state;
  }
}
