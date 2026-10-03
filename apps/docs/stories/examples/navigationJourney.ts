/** Example HOST state, not a Kozmos routing engine or published contract. Replace fixtures with SDK events. */
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
  route: { id: string; progress: number | null } | null;
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
  | { type: "progress"; routeId: string; progress: number | null }
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
            route: { id: event.routeId, progress: null },
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
      return {
        ...state,
        ...invalidate,
        phase: "setup",
        origin: null,
        query: "",
      };
    case "end":
      return { ...state, ...invalidate, phase: "browse" };
    case "start":
      return state.phase === "preview" && state.route
        ? { ...state, phase: "navigating" }
        : state;
    case "progress":
      return state.phase === "navigating" && state.route?.id === event.routeId
        ? {
            ...state,
            route: {
              ...state.route,
              progress:
                event.progress === null
                  ? null
                  : Number.isFinite(event.progress)
                    ? Math.min(1, Math.max(0, event.progress))
                    : 0,
            },
          }
        : state;
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
