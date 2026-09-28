import "./Wayfinding.css";
import { useState } from "react";
import {
  AdaptiveMapShell,
  Box,
  Button,
  FeedbackCard,
  FloorSelector,
  Itinerary,
  LocationPin,
  ManoeuvreCard,
  MapControlsGroup,
  MapView,
  NavigationAnnouncer,
  POIResultList,
  RoutePreviewPanel,
  RouteProgressRail,
  RouteSummary,
  RoutingInputGroup,
  Stack,
  Text,
  UserLocationMarker,
  type RoutePoint,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";
import { categoryFor, tint, venueName } from "../venue-explorer/data";
import {
  arrivalTime,
  dotsOn,
  entrance,
  floorLabel,
  floors,
  headingBetween,
  places,
  routesTo,
  secondsFor,
  type Preference,
} from "./data";

type Stage = "plan" | "preview" | "navigating" | "arrived";

const ground = floors[floors.length - 1].id;

const panelLabels: Record<Stage, string> = {
  plan: "Where to",
  preview: "Route options",
  navigating: "Navigation",
  arrived: "Arrived",
};

function matches(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export default function Wayfinding() {
  const [stage, setStage] = useState<Stage>("plan");
  const [query, setQuery] = useState("");
  const [destinationId, setDestinationId] = useState<string>();
  const [routeId, setRouteId] = useState("quickest");
  const [stepIndex, setStepIndex] = useState(0);
  const [floorId, setFloorId] = useState(ground);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState<string>();

  const destination = places.find((place) => place.poi.id === destinationId);
  const routes = destination ? routesTo(destination) : [];
  const route =
    routes.find((entry) => entry.option.id === routeId) ?? routes[0];
  const steps = route?.steps ?? [];
  const preference: Preference =
    route?.option.preference === "step-free" ? "step-free" : "quickest";

  // Walking: the marker stands where the last step ended and faces the next.
  const navigating = stage === "navigating";
  const arrived = stage === "arrived";
  const current = steps[Math.min(stepIndex, steps.length - 1)];
  const standing =
    stepIndex === 0 || !steps[stepIndex - 1]
      ? { point: entrance, floorId: ground }
      : steps[stepIndex - 1];
  const marker = arrived && current ? current : standing;
  const heading = current ? headingBetween(marker.point, current.point) : 0;
  const remaining = steps.slice(stepIndex);
  const remainingMetres = remaining.reduce(
    (sum, step) => sum + step.distanceMetres,
    0,
  );
  const remainingSeconds = secondsFor(remaining, preference);

  function choose(poiId: string) {
    const place = places.find((entry) => entry.poi.id === poiId);
    if (!place) return;
    setDestinationId(poiId);
    setQuery(place.poi.name);
    setRouteId("quickest");
    setStage("preview");
    setFloorId(ground);
  }

  function reset() {
    setStage("plan");
    setDestinationId(undefined);
    setQuery("");
    setStepIndex(0);
    setExpanded(false);
    setNote(undefined);
    setFloorId(ground);
  }

  function start() {
    setStepIndex(0);
    setFloorId(ground);
    setStage("navigating");
  }

  function advance() {
    if (!current) return;
    if (stepIndex >= steps.length - 1) {
      setStage("arrived");
      setFloorId(current.floorId);
      return;
    }
    setStepIndex(stepIndex + 1);
    setFloorId(current.floorId);
  }

  const points: RoutePoint[] = [
    { id: "from", value: "Main entrance", placeholder: "From" },
    { id: "to", value: query, placeholder: "Where to?" },
  ];

  const topBar =
    navigating && current ? (
      <ManoeuvreCard
        type={current.type}
        instruction={current.instruction}
        detail={
          current.distanceMetres > 0
            ? `${current.distanceMetres} m`
            : `To the ${floorLabel(current.floorId).toLowerCase()}`
        }
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      >
        <Itinerary
          origin="Main entrance"
          destination={destination?.poi.name ?? ""}
          steps={steps.map((step, index) => ({
            id: step.id,
            type: step.type,
            instruction: step.instruction,
            current: index === stepIndex,
          }))}
        />
      </ManoeuvreCard>
    ) : arrived ? undefined : (
      // The origin is where the visitor stands, so the points do not swap.
      <RoutingInputGroup
        points={points}
        onPointChange={(id, value) => {
          if (id !== "to") return;
          setQuery(value);
          setDestinationId(undefined);
          setStage("plan");
        }}
      />
    );

  // Each stage replaces the panel's view; focus goes into the new one
  // (../focus.ts), where the control that was pressed has gone.
  const panelFocus = useFocusOnChange(stage);

  const panel =
    stage === "plan" ? (
      <Box className="ex-way-list">
        <POIResultList
          ref={panelFocus}
          tabIndex={-1}
          className="ex-way-panel-focus"
          label="Where to?"
          resultCountLabel={(() => {
            const count = places.filter((place) =>
              matches(place.poi.name, query),
            ).length;
            return count === 1 ? "1 place" : `${count} places`;
          })()}
          items={places
            .filter((place) => matches(place.poi.name, query))
            .map((place, index) => ({
              poi: place.poi,
              result: {
                poiId: place.poi.id,
                resultIndex: index + 1,
                selected: false,
                featured: false,
                floorId: place.poi.floorId,
                travelEstimate: place.details.travelEstimate,
              },
            }))}
          currentFloorId={floorId}
          onSelect={choose}
          emptyState="No place has that name. Try another word."
        />
      </Box>
    ) : stage === "preview" && destination ? (
      <RoutePreviewPanel
        ref={panelFocus}
        tabIndex={-1}
        className="ex-way-panel-focus"
        status="ready"
        destinationName={destination.poi.name}
        options={routes.map((entry) => ({
          ...entry.option,
          selected: entry.option.id === route?.option.id,
        }))}
        optionsCountLabel={`${routes.length} routes`}
        selectedRouteAnnouncement={`${route?.option.label ?? ""} selected`}
        backLabel="Back"
        continueLabel="Start"
        onBack={() => setStage("plan")}
        onOptionSelect={setRouteId}
        onContinue={start}
      />
    ) : navigating && destination && current ? (
      <Box
        className="ex-way-stack ex-way-panel-focus"
        ref={panelFocus}
        tabIndex={-1}
      >
        <RouteSummary
          destination={destination.poi.name}
          durationText={`${Math.max(1, Math.round(remainingSeconds / 60))} min`}
          distanceText={`${remainingMetres} m`}
          arrivalText={arrivalTime(remainingSeconds)}
          endLabel="End"
          onEndRoute={reset}
          progress={
            <RouteProgressRail
              progress={stepIndex / steps.length}
              type={current.type}
              label={`Step ${stepIndex + 1} of ${steps.length}`}
            />
          }
        />
        <Stack gap={2}>
          <Button variant="outline" onClick={advance}>
            Next step
          </Button>
          <Text size="sm" color="muted">
            Walks the visitor to the next manoeuvre; a product moves with the
            device’s position instead.
          </Text>
        </Stack>
      </Box>
    ) : arrived && destination ? (
      <Box
        className="ex-way-stack ex-way-panel-focus"
        ref={panelFocus}
        tabIndex={-1}
      >
        <FeedbackCard
          title="You have arrived"
          description={`How was the route to ${destination.poi.name}?`}
          onSubmitFeedback={(rating) =>
            setNote(`Thanks — ${rating} of 5 noted for this route.`)
          }
          successMessage="Thank you. Every rating tunes the routes."
        />
        {/* Always there, so a screen reader hears the thanks put in it;
            empty, it takes no room. */}
        <Text size="sm" color="muted" role="status" className="ex-way-live">
          {note}
        </Text>
        <Button variant="outline" onClick={reset}>
          Plan another route
        </Button>
      </Box>
    ) : null;

  const dots = dotsOn(steps, floorId);
  const shownPins =
    stage === "plan"
      ? places.filter((place) => place.poi.floorId === floorId)
      : destination && destination.poi.floorId === floorId
        ? [destination]
        : [];

  const map = (
    <MapView
      mapLabel={`${venueName}, ${floorLabel(floorId)}. Illustrative map`}
    >
      <Box className="ex-way-layer">
        {stage !== "plan"
          ? dots.map((dot, index) => (
              <Box
                key={index}
                className="ex-way-dot"
                aria-hidden="true"
                style={{ "--dot-x": `${dot.x}%`, "--dot-y": `${dot.y}%` }}
              />
            ))
          : null}
        {shownPins.map((place) => {
          const category = categoryFor(place.poi.categoryId);
          return (
            <Box
              key={place.poi.id}
              className="ex-way-pin"
              style={{
                "--pin-x": `${place.position.x}%`,
                "--pin-y": `${place.position.y}%`,
              }}
            >
              <LocationPin
                label={`${place.poi.name}, ${place.poi.floorLabel}`}
                selected={place.poi.id === destinationId}
                featured={arrived && place.poi.id === destinationId}
                tint={category ? tint(category.tint) : undefined}
                onClick={
                  stage === "plan" ? () => choose(place.poi.id) : undefined
                }
              />
            </Box>
          );
        })}
        {marker.floorId === floorId ? (
          <Box
            className="ex-way-user"
            style={{
              "--pin-x": `${marker.point.x}%`,
              "--pin-y": `${marker.point.y}%`,
            }}
          >
            <UserLocationMarker
              aria-label={navigating ? "You, walking" : "You are here"}
              heading={heading}
              showHeading={navigating}
            />
          </Box>
        ) : null}
      </Box>
    </MapView>
  );

  const controls = (
    <Box className="ex-way-controls">
      <FloorSelector
        label="Floor"
        floors={floors}
        selectedFloor={floorId}
        onFloorSelect={setFloorId}
      />
      <MapControlsGroup
        label="Map controls"
        onMyLocation={() => setFloorId(marker.floorId)}
        locationState={navigating ? "following" : "off"}
        locationLabel="Show my location"
      />
    </Box>
  );

  return (
    <Box className="ex-way">
      <NavigationAnnouncer
        message={navigating && current ? current.instruction : ""}
        isActive={navigating}
      />
      <AdaptiveMapShell
        mapLabel="Route map"
        map={map}
        topBar={topBar}
        controls={controls}
        panel={panel}
        panelLabel={panelLabels[stage]}
      />
    </Box>
  );
}
