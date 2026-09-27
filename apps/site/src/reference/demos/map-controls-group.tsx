import { useState } from "react";
import {
  Box,
  MapControlsGroup,
  SegmentedControl,
  Slider,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

type LocationState =
  | "off"
  | "locating"
  | "following"
  | "heading"
  | "permission-denied"
  | "stale"
  | "unavailable";

const states: readonly LocationState[] = [
  "off",
  "locating",
  "following",
  "heading",
  "permission-denied",
  "stale",
  "unavailable",
];

function Group() {
  const [locationState, setLocationState] = useState<LocationState>("off");
  const [bearing, setBearing] = useState([30]);
  const [zoom, setZoom] = useState(3);
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-row">
        <MapControlsGroup
          onZoomIn={() => setZoom((value) => Math.min(6, value + 1))}
          onZoomOut={() => setZoom((value) => Math.max(1, value - 1))}
          onMyLocation={() =>
            setLocationState((state) =>
              state === "following" ? "off" : "following",
            )
          }
          onCompassReset={() => setBearing([0])}
          compassBearing={bearing[0]}
          locationState={locationState}
          locationLabel="Show my location"
        />
        <Text size="sm" color="muted" aria-live="polite">
          Zoom {zoom} of 6 · bearing {bearing[0]}° · location {locationState}
        </Text>
      </Box>
      <SegmentedControl
        label="Location state"
        size="sm"
        items={states.map((state) => ({ value: state, label: state }))}
        value={locationState}
        onValueChange={(next) => {
          if (states.includes(next as LocationState))
            setLocationState(next as LocationState);
        }}
      />
      <Slider
        label="Compass bearing"
        min={0}
        max={359}
        step={1}
        value={bearing}
        onValueChange={setBearing}
        formatValue={(value) => `${value}°`}
      />
    </Box>
  );
}

function Labelled() {
  return (
    <Box className="site-demo-row">
      <MapControlsGroup
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onMyLocation={() => {}}
        locationState="following"
        locationPresentation="labelled"
        locationLabel="Following"
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Zoom, compass and location",
    description:
      "The compass shows when the bearing is not north; the location button carries one of seven states.",
    Component: Group,
  },
  { title: "With the location button labelled", Component: Labelled },
];
