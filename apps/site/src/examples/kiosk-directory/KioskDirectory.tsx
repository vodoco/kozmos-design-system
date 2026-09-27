import "./KioskDirectory.css";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  BrowseCategoriesPanel,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FloorSelector,
  Heading,
  Icon,
  Itinerary,
  LocationPin,
  MapOverlay,
  MapView,
  POIDetailPanel,
  POIResultList,
  RouteSummary,
  SearchBar,
  Stack,
  Surface,
  Text,
  UserLocationMarker,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";
import type {
  CategoryPresentation,
  POIAction,
} from "@kozmos-ds/product-contracts";
import {
  categories,
  categoryFor,
  floorLabel,
  floors,
  places,
  tint,
  venueName,
  type Place,
} from "../venue-explorer/data";
import { dotsOn, entrance, routesTo } from "../wayfinding/data";

/** A kiosk speaks to one person at a time: after this long alone, it rests. */
const IDLE_SECONDS = 45;

const ground = floors[floors.length - 1].id;

const actionLabels: Record<POIAction, string> = {
  navigate: "Take me there",
  favourite: "Favourite",
  bookmark: "Save",
  share: "Share",
  order: "Order",
};

function matches(place: Place, query: string) {
  const words = query.trim().toLowerCase();
  if (!words) return true;
  return [place.poi.name, place.poi.categoryLabel ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(words);
}

export default function KioskDirectory() {
  const [resting, setResting] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [floorId, setFloorId] = useState(ground);
  const [routing, setRouting] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastTouch, setLastTouch] = useState(() => Date.now());
  // Focus follows the screen (../focus.ts): to "Touch to start" when the
  // attract screen comes up, back to the directory when it lifts, and into
  // the panel when a place or its route replaces the list.
  const attractFocus = useFocusOnChange(resting, resting);
  const directoryFocus = useFocusOnChange(resting, !resting);

  // The attract screen after a while alone; any touch or key resets the clock.
  useEffect(() => {
    if (resting) return;
    const timer = window.setTimeout(
      () => setResting(true),
      IDLE_SECONDS * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [resting, lastTouch]);

  const category = categoryFor(categoryId);
  const selected = places.find((place) => place.poi.id === selectedId);
  const route = selected && routing ? routesTo(selected)[0] : undefined;

  const results = useMemo(
    () =>
      places
        .filter((place) => !category || place.poi.categoryId === category.id)
        .filter((place) => matches(place, query))
        .sort((a, b) => a.minutes - b.minutes),
    [category, query],
  );

  const categoryPresentations: CategoryPresentation[] = categories.map(
    (entry) => {
      const count = places.filter(
        (place) => place.poi.categoryId === entry.id,
      ).length;
      return {
        id: entry.id,
        label: entry.label,
        iconName: entry.icon,
        selected: entry.id === categoryId,
        resultCount: count,
        resultCountLabel: count === 1 ? "1 place" : `${count} places`,
      };
    },
  );

  function startOver() {
    setQuery("");
    setCategoryId(undefined);
    setSelectedId(undefined);
    setFloorId(ground);
    setRouting(false);
    setSending(false);
    setResting(true);
  }

  function wake() {
    setResting(false);
    setLastTouch(Date.now());
  }

  function select(poiId: string) {
    const place = places.find((entry) => entry.poi.id === poiId);
    if (!place) return;
    setSelectedId(poiId);
    // A place need not be on a floor (contracts: no levels, no floor).
    if (place.poi.floorId) setFloorId(place.poi.floorId);
    setRouting(false);
  }

  function act(action: POIAction) {
    if (action === "navigate") {
      setRouting(true);
      setFloorId(ground);
    }
  }

  const panelView = selected ? (route ? "route" : "place") : "list";
  const panelFocus = useFocusOnChange(panelView);

  const pins = selected
    ? [selected]
    : results.filter((place) => place.poi.floorId === floorId);
  const dots = route ? dotsOn(route.steps, floorId) : [];

  return (
    <Box
      className="ex-kiosk"
      onPointerDown={() => setLastTouch(Date.now())}
      onKeyDown={() => setLastTouch(Date.now())}
    >
      {/* Under the attract screen the directory is inert: not reachable by
          the keyboard, not read by a screen reader. */}
      <Box className="ex-kiosk-side" inert={resting}>
        <Stack gap={1}>
          <Heading
            level={2}
            ref={directoryFocus}
            tabIndex={-1}
            className="ex-kiosk-title"
          >
            {venueName}
          </Heading>
          <Text color="muted">Directory · you are at the main entrance</Text>
        </Stack>
        <SearchBar
          variant="inline"
          aria-label="Search the centre"
          placeholder="Search the centre"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setSelectedId(undefined);
            setRouting(false);
          }}
          onClear={() => setQuery("")}
        />
        <BrowseCategoriesPanel
          label="Browse by category"
          categories={categoryPresentations}
          renderIcon={(entry) => {
            const match = categoryFor(entry.id);
            return match ? <Icon name={match.icon} size="xl" /> : null;
          }}
          tint={(entry) => {
            const match = categoryFor(entry.id);
            return match ? tint(match.tint) : undefined;
          }}
          onSelect={(id) => {
            setCategoryId((current) => (current === id ? undefined : id));
            setSelectedId(undefined);
            setRouting(false);
          }}
        />
        <Button variant="outline" onClick={startOver}>
          Start over
        </Button>
      </Box>

      <Box className="ex-kiosk-map" inert={resting}>
        <MapView
          mapLabel={`${venueName}, ${floorLabel(floorId)}. Illustrative map`}
        >
          <Box className="ex-kiosk-layer">
            {dots.map((dot, index) => (
              <Box
                key={index}
                className="ex-kiosk-dot"
                aria-hidden="true"
                style={{ "--dot-x": `${dot.x}%`, "--dot-y": `${dot.y}%` }}
              />
            ))}
            {pins.map((place) => {
              const index = results.indexOf(place);
              const placeCategory = categoryFor(place.poi.categoryId);
              return (
                <Box
                  key={place.poi.id}
                  className="ex-kiosk-pin"
                  style={{
                    "--pin-x": `${place.position.x}%`,
                    "--pin-y": `${place.position.y}%`,
                  }}
                >
                  <LocationPin
                    size="lg"
                    label={`${place.poi.name}, ${place.poi.floorLabel}`}
                    number={!selected && index >= 0 ? index + 1 : undefined}
                    selected={place.poi.id === selectedId}
                    tint={placeCategory ? tint(placeCategory.tint) : undefined}
                    onClick={() => select(place.poi.id)}
                  />
                </Box>
              );
            })}
            {floorId === ground ? (
              <Box
                className="ex-kiosk-you"
                style={{
                  "--pin-x": `${entrance.x}%`,
                  "--pin-y": `${entrance.y}%`,
                }}
              >
                <UserLocationMarker
                  aria-label="This kiosk, at the main entrance"
                  showHeading={false}
                />
              </Box>
            ) : null}
          </Box>
          <MapOverlay position="top-center" width="auto">
            <FloorSelector
              label="Floor"
              variant="horizontal-list"
              floors={floors}
              selectedFloor={floorId}
              onFloorSelect={setFloorId}
            />
          </MapOverlay>
        </MapView>
      </Box>

      <Box
        className="ex-kiosk-panel"
        inert={resting}
        ref={panelFocus}
        tabIndex={-1}
      >
        {selected && route ? (
          <Stack gap={4}>
            <RouteSummary
              state="preview"
              etaText={route.option.durationLabel}
              distanceText={route.option.distanceLabel}
              transportModeIcon={<Icon name="user-01" size="sm" />}
              startNavigationLabel="Send to my phone"
              onStartNavigation={() => setSending(true)}
              onEndRoute={() => setRouting(false)}
            />
            <Itinerary
              label="Route"
              origin="Main entrance"
              destination={selected.poi.name}
              steps={route.steps.map((step) => ({
                id: step.id,
                type: step.type,
                instruction: step.instruction,
              }))}
            />
            <Text size="sm" color="muted">
              Quickest route, on foot. The Wayfinding example walks it.
            </Text>
          </Stack>
        ) : selected ? (
          <POIDetailPanel
            presentation="panel"
            poi={selected.poi}
            details={selected.details}
            actionLabels={actionLabels}
            onAction={act}
            onClose={() => setSelectedId(undefined)}
            closeLabel="Back to the list"
          />
        ) : (
          <POIResultList
            label={
              category
                ? category.label
                : query.trim()
                  ? `Results for “${query.trim()}”`
                  : "Every place"
            }
            resultCountLabel={
              results.length === 1 ? "1 place" : `${results.length} places`
            }
            items={results.map((place, index) => ({
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
            onSelect={select}
            emptyState="No places match. Try another word, or a category."
          />
        )}
      </Box>

      <Dialog open={sending} onOpenChange={setSending}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take the route with you</DialogTitle>
            <DialogDescription>
              Open the {venueName} app on your phone and enter this code. The
              route to {selected?.poi.name ?? "the place"} is waiting there.
            </DialogDescription>
          </DialogHeader>
          <Text
            size="4xl"
            weight="bold"
            align="center"
            aria-label="Code 4 8 2 1"
          >
            4821
          </Text>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {resting ? (
        // The attract screen: glass over the directory until someone touches
        // it. A Backdrop would cover the browser instead (GAPS.md, GAP-34).
        <Surface variant="glass" className="ex-kiosk-attract">
          <Stack gap={3} align="center">
            <Heading level={2}>Find your way</Heading>
            <Text size="lg" color="muted" align="center">
              Shops, information, transport and events, on three floors.
            </Text>
            <Button size="lg" onClick={wake} ref={attractFocus}>
              Touch to start
            </Button>
          </Stack>
        </Surface>
      ) : null}
    </Box>
  );
}
