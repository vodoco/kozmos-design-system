import { useState } from "react";
import {
  Box,
  POIResultGroup,
  POIResultList,
  Text,
  type POIResultGroupItem,
} from "@kozmos-ds/react";
import { floors, results } from "../sample-data";
import type { DemoModule } from "../types";

/**
 * The same place on four levels. Nearest first, which is the product's
 * decision: the group draws its members in the order it is given.
 */
const walk = [
  { floorId: "1", seconds: 60, durationLabel: "1 min", distanceLabel: "40 m" },
  {
    floorId: "g",
    seconds: 180,
    durationLabel: "3 min",
    distanceLabel: "180 m",
  },
  {
    floorId: "2",
    seconds: 240,
    durationLabel: "4 min",
    distanceLabel: "220 m",
  },
  {
    floorId: "-1",
    seconds: 360,
    durationLabel: "6 min",
    distanceLabel: "340 m",
  },
];

const toilets = walk.map((step, index): POIResultGroupItem => {
  const id = `toilets-${step.floorId}`;
  return {
    poi: {
      id,
      name: "Toilets",
      categoryLabel: "Facilities",
      floorId: step.floorId,
      floorLabel: floors.find((floor) => floor.id === step.floorId)?.label,
      buildingLabel: "Riverside Centre",
      media: [],
      availability: "open",
      availabilityLabel: "Open",
      actions: ["navigate"],
    },
    result: {
      poiId: id,
      resultIndex: index + 1,
      selected: false,
      featured: false,
      floorId: step.floorId,
      travelEstimate: {
        durationSeconds: step.seconds,
        durationLabel: step.durationLabel,
        distanceLabel: step.distanceLabel,
      },
    },
  };
});

function OneNameFourFloors() {
  const [opened, setOpened] = useState<string>();
  return (
    <Box className="site-demo-column">
      <POIResultGroup
        label="Toilets, 4 places"
        items={toilets}
        currentFloorId="1"
        onSelect={setOpened}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {opened
          ? `Opened ${opened}: a grouped result reports the same id an ungrouped one would.`
          : "One member stands for the group and the rest fold behind a count of what is hidden, so four places read “Show 3 more”. The container draws the border and its members draw none."}
      </Text>
    </Box>
  );
}

function InsideAList() {
  const [selected, setSelected] = useState("toilets-1");
  return (
    <Box className="site-demo-column">
      <POIResultList
        label="Results for “toilets”"
        resultCountLabel="6 places"
        currentFloorId="1"
        selectedPoiId={selected}
        onSelect={setSelected}
        items={[
          {
            id: "toilets",
            label: "Toilets, 4 places, inside a list",
            items: toilets,
            collapsedCount: 2,
          },
          results[1],
          results[2],
        ]}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {`Selected ${selected}. The list decides selection for a grouped member exactly as it does for a row.`}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One name, four floors",
    description:
      "items are the members, representative first; the group never reorders them. collapsedCount is how many show while it is folded, and the count on the control is of what is hidden, not of the group.",
    Component: OneNameFourFloors,
  },
  {
    title: "In a list, beside ordinary rows",
    description:
      "A POIResultList entry with an items array is drawn as a group. Its label makes it a region landmark, so two groups on one page need different names. A group’s own wording and its expansion are not among what the list passes on, so one reached this way keeps the built-in “Show 2 more” and “Hide”: render POIResultGroup yourself when that wording has to be translated or the state remembered.",
    Component: InsideAList,
  },
];
