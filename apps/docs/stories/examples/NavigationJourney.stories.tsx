import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  AdaptiveMapShell,
  ArrivalPanel,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Itinerary,
  ManoeuvreCard,
  RouteLocationField,
  RoutePreviewPanel,
  RouteProgressRail,
  RouteSetupPanel,
  RouteSummary,
} from "@kozmos-ds/react";
import {
  initialJourney,
  journeyReducer,
  type JourneyFailure,
} from "./navigationJourney";

const lobby = {
  value: "lobby",
  label: "North terminal lobby",
  description: "North Terminal · Ground floor",
};
const gallery = {
  value: "gallery",
  label: "Gallery",
  description: "North Terminal · Level 2",
};
const places = [lobby, gallery];
const recovery: Record<
  JourneyFailure,
  { title: string; description: string; retry: boolean }
> = {
  "no-route": {
    title: "Route unavailable",
    description:
      "No route connects these points. Choose another starting point or return to the map.",
    retry: false,
  },
  "step-free-unavailable": {
    title: "Step-free route unavailable",
    description:
      "A step-free route could not be found. Your route preference has not been changed. Choose another starting point or return to the map.",
    retry: false,
  },
  "position-unavailable": {
    title: "Starting position unavailable",
    description:
      "Choose a known starting point from the list or map before trying again.",
    retry: false,
  },
  offline: {
    title: "Connection unavailable",
    description:
      "The route service is offline. Reconnect before trying again. Your selected places are preserved.",
    retry: true,
  },
  transient: {
    title: "Route calculation interrupted",
    description:
      "The route service could not finish this request. You can try again with the same places.",
    retry: true,
  },
};
const actionClass = "h-auto min-h-11 whitespace-normal";

/** A deterministic host adapter demonstration. Fixture controls below the map are NOT product UI. */
function NavigationJourney({
  initialFailure,
  initialResolved = false,
  hasCurrentPosition = false,
}: {
  initialFailure?: JourneyFailure;
  initialResolved?: boolean;
  hasCurrentPosition?: boolean;
}) {
  const [state, dispatch] = React.useReducer(journeyReducer, {
    ...initialJourney,
    destination: gallery,
    ...(initialResolved ? { origin: lobby } : {}),
    ...(initialFailure
      ? { origin: lobby, phase: "recovery" as const, failure: initialFailure }
      : {}),
  });
  const [expanded, setExpanded] = React.useState(false);
  const [candidateValid, setCandidateValid] = React.useState(false);
  const [destinationQuery, setDestinationQuery] = React.useState("");
  const [editingPoint, setEditingPoint] = React.useState<
    "origin" | "destination" | null
  >(null);
  const [draftQuery, setDraftQuery] = React.useState("");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const browseRef = React.useRef<HTMLButtonElement>(null);
  const recoveryActionRef = React.useRef<HTMLButtonElement>(null);
  const originRef = React.useRef<HTMLDivElement>(null);
  const destinationRef = React.useRef<HTMLDivElement>(null);
  const fieldFocus = React.useRef<{
    point: "origin" | "destination";
    resolved: boolean;
  } | null>(null);
  React.useLayoutEffect(() => {
    const intent = fieldFocus.current;
    if (!intent) return;
    fieldFocus.current = null;
    const field =
      intent.point === "origin" ? originRef.current : destinationRef.current;
    field
      ?.querySelector<HTMLElement>(
        intent.resolved ? "button" : '[role="combobox"]',
      )
      ?.focus();
  }, [
    state.origin,
    state.destination,
    state.query,
    destinationQuery,
    editingPoint,
  ]);
  const editPoint = (point: "origin" | "destination") => {
    fieldFocus.current = { point, resolved: false };
    setDraftQuery("");
    setEditingPoint(point);
  };
  const cancelPointEdit = (point: "origin" | "destination") => {
    fieldFocus.current = { point, resolved: true };
    setDraftQuery("");
    setEditingPoint(null);
  };
  const routeId = state.route?.id;

  React.useEffect(() => {
    if (state.phase !== "setup" || state.origin) return;
    // A real adapter aborts its provider request as well as rejecting old identities in the reducer.
    const requestId = state.generation;
    const timer = window.setTimeout(
      () => dispatch({ type: "suggestions", requestId, options: places }),
      200,
    );
    return () => window.clearTimeout(timer);
  }, [state.generation, state.phase, state.origin]);
  React.useEffect(() => {
    setExpanded(false);
    if (state.phase === "recovery") return; // The existing dialog owns focus while open.
    if (state.phase === "browse") browseRef.current?.focus();
    else if (state.phase === "setup" && !state.origin)
      panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    else panelRef.current?.focus();
  }, [state.phase]);
  const calculate = () => {
    dispatch({ type: "calculate" });
  };
  const failure = state.failure ? recovery[state.failure] : undefined;
  const pending = state.phase === "calculating";
  const navigation = state.phase === "navigating";

  const setup = (
    <RouteSetupPanel
      ready={!editingPoint && !!state.origin && !!state.destination}
      pending={pending}
      continueLabel={pending ? "Calculating step-free route…" : "Continue"}
      closeLabel={pending ? "Cancel calculation" : "Close route setup"}
      onContinue={calculate}
      onClose={() => {
        setEditingPoint(null);
        setDraftQuery("");
        dispatch({ type: pending ? "cancel" : "end" });
      }}
    >
      <RouteLocationField
        ref={originRef}
        label="From"
        currentPosition={
          hasCurrentPosition
            ? {
                value: "fixture-position-17",
                label: "Current position",
                description: "North Terminal · Ground floor",
              }
            : null
        }
        location={editingPoint === "origin" ? null : state.origin}
        query={editingPoint === "origin" ? draftQuery : state.query}
        options={editingPoint === "origin" ? places : state.suggestions}
        onEdit={() => editPoint("origin")}
        onCancelEdit={
          editingPoint === "origin"
            ? () => cancelPointEdit("origin")
            : undefined
        }
        disabled={pending}
        status={
          !state.origin && !state.suggestions.length ? "loading" : "ready"
        }
        onQueryChange={(query) =>
          editingPoint === "origin"
            ? setDraftQuery(query)
            : dispatch({ type: "query", query })
        }
        onSelect={(location) => {
          fieldFocus.current = { point: "origin", resolved: true };
          setEditingPoint(null);
          setDraftQuery("");
          dispatch({ type: "select", point: "origin", location });
        }}
        onClear={() => {
          if (editingPoint === "origin") {
            setDraftQuery("");
            originRef.current
              ?.querySelector<HTMLInputElement>("input")
              ?.focus();
            return;
          }
          fieldFocus.current = { point: "origin", resolved: false };
          dispatch({ type: "select", point: "origin", location: null });
        }}
        clearLabel="Clear origin"
        onChooseMap={() => {
          setEditingPoint(null);
          setDraftQuery("");
          setCandidateValid(false);
          dispatch({ type: "choose-map" });
        }}
      />
      <RouteLocationField
        ref={destinationRef}
        label="To"
        location={editingPoint === "destination" ? null : state.destination}
        query={editingPoint === "destination" ? draftQuery : destinationQuery}
        onEdit={() => editPoint("destination")}
        onCancelEdit={
          editingPoint === "destination"
            ? () => cancelPointEdit("destination")
            : undefined
        }
        options={places}
        disabled={pending}
        onQueryChange={
          editingPoint === "destination" ? setDraftQuery : setDestinationQuery
        }
        onSelect={(location) => {
          fieldFocus.current = { point: "destination", resolved: true };
          setEditingPoint(null);
          setDraftQuery("");
          setDestinationQuery("");
          dispatch({ type: "select", point: "destination", location });
        }}
        onClear={() => {
          if (editingPoint === "destination") {
            setDraftQuery("");
            destinationRef.current
              ?.querySelector<HTMLInputElement>("input")
              ?.focus();
            return;
          }
          fieldFocus.current = { point: "destination", resolved: false };
          setDestinationQuery("");
          dispatch({ type: "select", point: "destination", location: null });
        }}
        clearLabel="Clear destination"
      />
    </RouteSetupPanel>
  );

  return (
    <div className="flex flex-col gap-4">
      <AdaptiveMapShell
        className="h-[720px]"
        mapLabel="Host map placeholder"
        panelLabel="Journey"
        panelPresentation="bottom"
        panelSizing="content"
        map={
          <EmptyState
            title="Host map placeholder"
            description="The SDK provides map rendering, positioning and route calculation. This fixture supplies no live map data."
          />
        }
        topBar={
          navigation ? (
            <ManoeuvreCard
              type="lift-up"
              instruction="Take the elevator to Level 2"
              detail="Current step · 18 m"
              expanded={expanded}
              onToggle={() => setExpanded((value) => !value)}
            >
              <Itinerary
                origin={state.origin?.label ?? ""}
                destination={state.destination?.label ?? ""}
                steps={[
                  {
                    id: "approach",
                    type: "straight",
                    instruction: "Follow the corridor to the elevator",
                    distance: "42 m",
                  },
                  {
                    id: "elevator",
                    type: "lift-up",
                    instruction: "Take the elevator to Level 2",
                    current: true,
                    distance: "18 m",
                  },
                  {
                    id: "destination",
                    type: "destination",
                    instruction: "Gallery",
                  },
                ]}
              />
            </ManoeuvreCard>
          ) : undefined
        }
        panel={
          <div
            ref={panelRef}
            tabIndex={-1}
            role="group"
            aria-label={`${state.phase} journey`}
            className="flex min-w-0 flex-col gap-4 px-4 pb-4"
          >
            {["setup", "calculating", "recovery"].includes(state.phase) &&
              setup}
            {state.phase === "map-selection" && (
              <RouteSetupPanel
                title="Set starting point"
                ready={candidateValid}
                continueLabel="Set starting point"
                closeLabel="Cancel map selection"
                description="Confirm the host-selected point or choose a place from the list."
                onClose={() => dispatch({ type: "cancel-map" })}
                onContinue={() =>
                  dispatch({
                    type: "confirm-map",
                    location: candidateValid ? lobby : null,
                  })
                }
              >
                <p>
                  {candidateValid
                    ? "North terminal lobby · Ground floor"
                    : "No valid starting point selected"}
                </p>
                <Button
                  className={actionClass}
                  variant="outline"
                  onClick={() => {
                    // The list, with the confirmed origin kept until a new
                    // one is chosen.
                    dispatch({ type: "cancel-map" });
                    editPoint("origin");
                  }}
                >
                  Choose from a list instead
                </Button>
              </RouteSetupPanel>
            )}
            {state.phase === "preview" && state.route && (
              <RoutePreviewPanel
                destinationName={state.destination?.label ?? ""}
                status="ready"
                backLabel="Edit route points"
                continueLabel="Start navigation"
                onBack={() => dispatch({ type: "cancel" })}
                onOptionSelect={() => {}}
                onContinue={() => dispatch({ type: "start" })}
                options={[
                  {
                    id: state.route.id,
                    label: "Step-free",
                    preference: "step-free",
                    available: true,
                    selected: true,
                    durationSeconds: 360,
                    durationLabel: "6 min",
                    distanceMetres: 220,
                    distanceLabel: "220 m",
                  },
                ]}
              />
            )}
            {navigation && (
              <RouteSummary
                destination={state.destination?.label ?? ""}
                durationText="6 min"
                distanceText="220 m"
                onEndRoute={() => dispatch({ type: "end" })}
                progress={
                  <RouteProgressRail
                    progress={state.route?.progress ?? null}
                    type="lift-up"
                    label="Journey progress"
                    valueText={
                      state.route?.progress == null ? "Unknown" : undefined
                    }
                    activeLeg={state.route?.activeLeg}
                    motion="directional"
                    appearance="gradient"
                    waypoints={[
                      {
                        id: "elevator",
                        position: 0.5,
                        type: "lift-up",
                        label: "Elevator to Level 2",
                      },
                    ]}
                  />
                }
              />
            )}
            {state.phase === "arrived" && (
              <ArrivalPanel
                destination={state.destination?.label ?? ""}
                locationText={state.destination?.description}
                actualDurationText={state.actual?.duration}
                actualDistanceText={state.actual?.distance}
                onDone={() => dispatch({ type: "done" })}
              />
            )}
            {state.phase === "browse" && (
              <>
                <p>
                  Selected destination: {state.destination?.label ?? "None"}
                </p>
                <Button
                  ref={browseRef}
                  className={actionClass}
                  onClick={() => dispatch({ type: "cancel" })}
                >
                  Directions to selected destination
                </Button>
              </>
            )}
          </div>
        }
      />
      <Dialog
        open={state.phase === "recovery"}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "cancel" });
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            recoveryActionRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // The action determines the surviving screen. Never steal browse focus
            // or try to focus a disabled Continue while a retry is calculating.
            requestAnimationFrame(() => {
              const buttons =
                panelRef.current?.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                );
              const target =
                browseRef.current ??
                panelRef.current?.querySelector<HTMLInputElement>("input") ??
                (buttons && buttons[buttons.length - 1]);
              (target ?? panelRef.current)?.focus();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{failure?.title ?? "Route unavailable"}</DialogTitle>
            <DialogDescription>
              {failure?.description ?? "Choose another starting point."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter layout="stacked">
            {failure?.retry && (
              <Button ref={recoveryActionRef} onClick={calculate}>
                Retry calculation
              </Button>
            )}
            <Button
              ref={failure?.retry ? undefined : recoveryActionRef}
              variant={failure?.retry ? "outline" : "default"}
              onClick={() => {
                dispatch({ type: "edit" });
                editPoint("origin");
              }}
            >
              Choose another starting point
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: "end" })}>
              Explore map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <section aria-label="Fixture events" className="flex flex-col gap-3 p-4">
        <h2>Fixture events — not product controls</h2>
        <p>
          Phase: {state.phase}. Done handled: {state.doneCount}. Route estimates
          and actual completed totals are separate fixtures.
        </p>
        {state.phase === "map-selection" && (
          <Button
            className={actionClass}
            onClick={() => setCandidateValid((value) => !value)}
          >
            Simulate {candidateValid ? "invalid" : "valid"} map point
          </Button>
        )}
        {pending && (
          <>
            <Button
              className={actionClass}
              onClick={() =>
                dispatch({
                  type: "result",
                  requestId: state.generation,
                  routeId: `route-${state.generation}`,
                })
              }
            >
              Deliver calculated route
            </Button>
            {Object.keys(recovery).map((reason) => (
              <Button
                className={actionClass}
                variant="outline"
                key={reason}
                onClick={() =>
                  dispatch({
                    type: "failure",
                    requestId: state.generation,
                    reason: reason as JourneyFailure,
                  })
                }
              >
                Simulate {reason}
              </Button>
            ))}
          </>
        )}
        {navigation && routeId && (
          <>
            <Button
              className={actionClass}
              onClick={() =>
                dispatch({
                  type: "progress",
                  routeId,
                  progress: 1,
                  activeLeg: { start: 0.5, end: 1 },
                })
              }
            >
              Report 100% progress
            </Button>
            <Button
              className={actionClass}
              onClick={() => dispatch({ type: "arrive", routeId })}
            >
              Confirm arrival without metrics
            </Button>
            <Button
              className={actionClass}
              onClick={() =>
                dispatch({
                  type: "arrive",
                  routeId,
                  actual: { duration: "8 min", distance: "240 m" },
                })
              }
            >
              Confirm arrival with actual metrics
            </Button>
            <Button
              className={actionClass}
              variant="outline"
              onClick={calculate}
            >
              Request step-free reroute
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

const meta = {
  id: "examples-navigation-journey",
  title: "Examples/Navigation/Journey",
  component: NavigationJourney,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NavigationJourney>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ControlledJourney: Story = {};
export const SelectedLocations: Story = { args: { initialResolved: true } };
export const BlueDotAvailable: Story = { args: { hasCurrentPosition: true } };
export const UnavailableRoute: Story = { args: { initialFailure: "no-route" } };
export const UnavailableStepFree: Story = {
  args: { initialFailure: "step-free-unavailable" },
};
export const OfflineRecovery: Story = { args: { initialFailure: "offline" } };
export const UnavailablePosition: Story = {
  args: { initialFailure: "position-unavailable" },
};
export const InterruptedCalculation: Story = {
  args: { initialFailure: "transient" },
};
