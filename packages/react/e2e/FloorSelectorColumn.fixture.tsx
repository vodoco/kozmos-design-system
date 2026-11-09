import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { FloorSelector } from "../src/components/FloorSelector/FloorSelector";

const levels = [
  { id: "4", label: "Fourth floor", shortLabel: "4F" },
  { id: "3", label: "Third floor", shortLabel: "3F" },
  { id: "2", label: "Second floor", shortLabel: "2F" },
  { id: "1", label: "First floor", shortLabel: "1F" },
  { id: "g", label: "Ground floor", shortLabel: "GF" },
];

/**
 * The collapsible switcher in a corner of a short window, where its column
 * of five levels overflows the room above the tile, and a button that leaves
 * it two levels, which fit (GAP-233).
 */
export function FloorSelectorColumnFixture() {
  const [floors, setFloors] = React.useState(levels);
  const [floor, setFloor] = React.useState("1");
  return (
    <ThemeProvider theme="light">
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <button type="button" onClick={() => setFloors(levels.slice(3))}>
          Fewer levels
        </button>
        <FloorSelector
          floors={floors}
          onFloorSelect={setFloor}
          selectedFloor={floor}
          variant="collapsible"
        />
      </div>
    </ThemeProvider>
  );
}
