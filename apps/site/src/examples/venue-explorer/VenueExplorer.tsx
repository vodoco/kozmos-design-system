import "./VenueExplorer.css";
import { useMemo, useState } from "react";
import {
  AdaptiveMapShell,
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
  UserLocationMarker,
  type POIActionState,
} from "@kozmos-ds/react";
import { useControlsEdge } from "../controls-edge";
import { useFocusOnChange } from "../focus";
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

function matches(place: Place, query: string) {
  const words = query.trim().toLowerCase();
  if (!words) return true;
  return [
    place.poi.name,
    place.poi.categoryLabel ?? "",
    place.poi.description ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(words);
}

export default function VenueExplorer() {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [floorId, setFloorId] = useState("g");
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [locationState, setLocationState] = useState<UserLocationState>("off");
  const [favourites, setFavourites] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [notice, setNotice] = useState<{ poiId: string; action: POIAction }>();
  const controlsEdge = useControlsEdge();

  const category = categoryFor(categoryId);
  const browsing = !category && !query.trim();

  const results = useMemo(
    () =>
      places
        .filter((place) => !category || place.poi.categoryId === category.id)
        .filter((place) => matches(place, query))
        .sort((a, b) => a.minutes - b.minutes),
    [category, query],
  );

  const selected = places.find((place) => place.poi.id === selectedId);

  // On the map: the selected place, or the results on this floor; while
  // browsing, every place on this floor.
  const pins = selected
    ? [selected]
    : (browsing ? places : results).filter(
        (place) => place.poi.floorId === floorId,
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
  }

  function clearCategory() {
    setCategoryId(undefined);
    setSelectedId(undefined);
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
    setNotice({ poiId, action });
  }

  function actionStates(
    poiId: string,
  ): Partial<Record<POIAction, POIActionState>> {
    const states: Partial<Record<POIAction, POIActionState>> = {
      favourite: { pressed: favourites.has(poiId) },
    };
    if (notice?.poiId === poiId) {
      states[notice.action] = {
        message:
          notice.action === "navigate"
            ? "Directions need a routing service, which this example does not have."
            : "Sharing is not connected in this example.",
        messageTone: "status",
      };
    }
    return states;
  }

  const topBar = category ? (
    <CategoryField
      label={category.label}
      count={results.length}
      countLabel={(count) => (count === 1 ? "1 place" : `${count} places`)}
      tint={tint(category.tint)}
      icon={<Icon name={category.icon} />}
      clearLabel={`Clear ${category.label}`}
      onClear={clearCategory}
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
    // "sheet" paints no surface of its own: it sits on the shell's panel, as
    // the browse panel does (POIDetailPanel.mdx).
    <POIDetailPanel
      ref={panelFocus}
      tabIndex={-1}
      className="ex-venue-panel-focus"
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
      className="ex-venue-panel-focus"
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
      }}
    />
  ) : (
    <Box className="ex-venue-list">
      <POIResultList
        ref={panelFocus}
        tabIndex={-1}
        className="ex-venue-panel-focus"
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

  const map = (
    <MapView
      mapLabel={`${venueName}, ${floorLabel(floorId)}. Illustrative map`}
    >
      <Box className="ex-venue-layer" style={{ "--zoom": zoom }}>
        {pins.map((place) => {
          const index = results.indexOf(place);
          const placeCategory = categoryFor(place.poi.categoryId);
          return (
            <Box
              key={place.poi.id}
              className="ex-venue-pin"
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
            className="ex-venue-pin ex-venue-user"
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
    <Box className="ex-venue-controls" data-edge={controlsEdge.edge}>
      <FloorSelector
        label="Floor"
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
          "Focus" over "On" or "Off" for a moment when the mode changes. */}
      <MapControlsGroup
        label="Map controls"
        onZoomIn={() =>
          setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))
        }
        onZoomOut={() =>
          setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))
        }
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
    <Box className="ex-venue">
      <AdaptiveMapShell
        mapLabel={`${venueName} map`}
        map={map}
        topBar={topBar}
        controls={controls}
        panel={panel}
        panelLabel={selected ? selected.poi.name : "Places"}
        onLayoutChange={controlsEdge.onLayoutChange}
      />
    </Box>
  );
}
