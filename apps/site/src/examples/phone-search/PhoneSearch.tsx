import "./PhoneSearch.css";
import { useMemo, useState } from "react";
import {
  AdaptiveMapShell,
  AISearchButton,
  Box,
  BrowseCategoriesPanel,
  CategoryField,
  FloorSelector,
  Icon,
  LocationPin,
  MapControlsGroup,
  MapView,
  POIDetailPanel,
  POIResultList,
  SearchBar,
  SegmentedControl,
  Text,
  UserLocationMarker,
  type POIActionState,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";
import { Assistant } from "./Assistant";
import type {
  CategoryPresentation,
  POIAction,
  UserLocationState,
} from "@kozmos-ds/product-contracts";
import {
  categories,
  categoryFor,
  floorLabel,
  floors,
  locationStateLabel,
  nextLocationState,
  places,
  tint,
  userLocation,
  venueName,
  type Place,
} from "./data";

const actionLabels: Record<POIAction, string> = {
  navigate: "Directions",
  favourite: "Favourite",
  bookmark: "Save",
  share: "Share",
  order: "Order",
};

type Detent = "collapsed" | "medium" | "large";

const detents: { value: Detent; label: string }[] = [
  { value: "collapsed", label: "Peek" },
  { value: "medium", label: "Half" },
  { value: "large", label: "Full" },
];

function isDetent(value: string | undefined): value is Detent {
  return detents.some((detent) => detent.value === value);
}

function matches(place: Place, query: string) {
  const words = query.trim().toLowerCase();
  if (!words) return true;
  return [place.poi.name, place.poi.categoryLabel ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(words);
}

export default function PhoneSearch() {
  const [detent, setDetent] = useState<Detent>("medium");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [floorId, setFloorId] = useState("g");
  const [locationState, setLocationState] = useState<UserLocationState>("off");
  const [favourites, setFavourites] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [notice, setNotice] = useState<string>();
  const [assistantOpen, setAssistantOpen] = useState(false);

  const category = categoryFor(categoryId);
  const browsing = !category && !query.trim();
  const selected = places.find((place) => place.poi.id === selectedId);

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

  function select(poiId: string) {
    const place = places.find((entry) => entry.poi.id === poiId);
    if (!place) return;
    setSelectedId(poiId);
    // A place need not be on a floor (contracts: no levels, no floor).
    if (place.poi.floorId) setFloorId(place.poi.floorId);
    setNotice(undefined);
    // A place's details deserve the room: the sheet opens to half at least.
    if (detent === "collapsed") setDetent("medium");
  }

  function act(action: POIAction, poiId: string) {
    if (action === "favourite") {
      setFavourites((current) => {
        const next = new Set(current);
        if (next.has(poiId)) next.delete(poiId);
        else next.add(poiId);
        return next;
      });
      return;
    }
    setNotice(
      action === "navigate"
        ? "Directions are the Wayfinding example’s; this one stops at the place."
        : "Sharing is not connected in this example.",
    );
  }

  const actionStates = (
    poiId: string,
  ): Partial<Record<POIAction, POIActionState>> => ({
    favourite: { pressed: favourites.has(poiId) },
    ...(notice
      ? { navigate: { message: notice, messageTone: "status" as const } }
      : {}),
  });

  const topBar = category ? (
    <CategoryField
      label={category.label}
      count={results.length}
      countLabel={(count) => (count === 1 ? "1 place" : `${count} places`)}
      tint={tint(category.tint)}
      icon={<Icon name={category.icon} />}
      clearLabel={`Clear ${category.label}`}
      onClear={() => {
        setCategoryId(undefined);
        setSelectedId(undefined);
      }}
    />
  ) : (
    <SearchBar
      variant="floating"
      aria-label={`Search ${venueName}`}
      placeholder={`Search ${venueName}`}
      value={query}
      onChange={(value) => {
        setQuery(value);
        setSelectedId(undefined);
      }}
      onClear={() => {
        setQuery("");
        setSelectedId(undefined);
      }}
      // The AI search belongs at the end of the search row; the slot keeps
      // the pair on one line (AISearchButton.mdx).
      trailing={
        <AISearchButton
          label="Ask the assistant"
          onClick={() => setAssistantOpen(true)}
        />
      }
    />
  );

  // A place, the categories or the results replace one another in the
  // panel; focus goes into the new one (../focus.ts).
  const panelView = selected
    ? `place ${selected.poi.id}`
    : browsing
      ? "browse"
      : "results";
  const panelFocus = useFocusOnChange(panelView);

  const panel = selected ? (
    <POIDetailPanel
      ref={panelFocus}
      tabIndex={-1}
      className="ex-phone-panel-focus"
      presentation="sheet"
      poi={selected.poi}
      details={selected.details}
      actionLabels={actionLabels}
      actionStates={actionStates(selected.poi.id)}
      onAction={act}
      onClose={() => {
        setSelectedId(undefined);
        setNotice(undefined);
      }}
      closeLabel="Back to the list"
    />
  ) : browsing ? (
    <BrowseCategoriesPanel
      ref={panelFocus}
      tabIndex={-1}
      className="ex-phone-panel-focus"
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
        setCategoryId(id);
        setSelectedId(undefined);
        if (detent === "collapsed") setDetent("medium");
      }}
    />
  ) : (
    <Box className="ex-phone-list">
      <POIResultList
        ref={panelFocus}
        tabIndex={-1}
        className="ex-phone-panel-focus"
        label={category ? category.label : `Results for “${query.trim()}”`}
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
        emptyState="No places match. Try another word, or browse by category."
      />
    </Box>
  );

  const pins = selected
    ? [selected]
    : (browsing ? places : results).filter(
        (place) => place.poi.floorId === floorId,
      );

  const map = (
    <MapView
      mapLabel={`${venueName}, ${floorLabel(floorId)}. Illustrative map`}
    >
      <Box className="ex-phone-layer">
        {pins.map((place) => {
          const index = results.indexOf(place);
          const placeCategory = categoryFor(place.poi.categoryId);
          return (
            <Box
              key={place.poi.id}
              className="ex-phone-pin"
              style={{
                "--pin-x": `${place.position.x}%`,
                "--pin-y": `${place.position.y}%`,
              }}
            >
              <LocationPin
                label={`${place.poi.name}, ${place.poi.floorLabel}`}
                number={
                  !browsing && !selected && index >= 0 ? index + 1 : undefined
                }
                selected={place.poi.id === selectedId}
                tint={placeCategory ? tint(placeCategory.tint) : undefined}
                onClick={() => select(place.poi.id)}
              />
            </Box>
          );
        })}
        {locationState !== "off" && floorId === userLocation.floorId ? (
          <Box
            className="ex-phone-pin ex-phone-user"
            style={{
              "--pin-x": `${userLocation.position.x}%`,
              "--pin-y": `${userLocation.position.y}%`,
            }}
          >
            {/* Turning with the visitor, a map engine rotates the map; this
                stand-in cannot, so the marker shows which way they face. */}
            <UserLocationMarker
              aria-label="You are here"
              heading={0}
              showHeading={locationState === "heading"}
            />
          </Box>
        ) : null}
      </Box>
    </MapView>
  );

  const controls = (
    <Box className="ex-phone-controls">
      <FloorSelector
        label="Floor"
        variant="compact-stepper"
        floors={floors}
        selectedFloor={floorId}
        onFloorSelect={(id) => {
          setFloorId(id);
          if (selected && selected.poi.floorId !== id) setSelectedId(undefined);
          // Another floor than the visitor's: the map stops following them.
          if (id !== userLocation.floorId) setLocationState("off");
        }}
      />
      {/* The SDK's location control (decision 40): icon-only over the map,
          "Focus" over "On" or "Off" for a moment when the mode changes. A
          phone pinches to zoom, so there are no zoom buttons. */}
      <MapControlsGroup
        label="Map controls"
        onMyLocation={() => {
          const next = nextLocationState(locationState);
          setLocationState(next);
          if (next !== "off") setFloorId(userLocation.floorId);
        }}
        locationState={locationState}
        locationLabel="Focus"
        locationStateLabel={locationStateLabel(locationState)}
        locationLabelPlacement="stacked"
        locationRevealOnChange
      />
    </Box>
  );

  return (
    <Box className="ex-phone-stage">
      <Box className="ex-phone-toolbar">
        <SegmentedControl
          label="Sheet"
          size="sm"
          items={detents}
          value={detent}
          onValueChange={(next) => {
            if (isDetent(next)) setDetent(next);
          }}
        />
        <Text size="sm" color="muted" align="center">
          The sheet rests at one of three detents; drag its handle, or set one
          here. It opens to half on its own when there is something to read.
        </Text>
      </Box>
      <Box className="ex-phone">
        <AdaptiveMapShell
          mapLabel={`${venueName} map`}
          map={map}
          topBar={topBar}
          controls={controls}
          panel={panel}
          panelLabel={selected ? selected.poi.name : "Places"}
          panelPresentation="bottom"
          panelDetents={["collapsed", "medium", "large"]}
          panelDetent={detent}
          onPanelDetentChange={(next) => {
            if (isDetent(next as string)) setDetent(next as Detent);
          }}
        />
        {/* Kept mounted and opened with `open`, so it takes focus as it
            opens and hands it back to the AI search button as it closes. It
            covers the frame and leaves the sheet as it was beneath. */}
        <Assistant
          open={assistantOpen}
          places={places}
          currentFloorId={floorId}
          onClose={() => setAssistantOpen(false)}
          onChoosePlace={(poiId) => {
            setAssistantOpen(false);
            select(poiId);
          }}
        />
      </Box>
    </Box>
  );
}
