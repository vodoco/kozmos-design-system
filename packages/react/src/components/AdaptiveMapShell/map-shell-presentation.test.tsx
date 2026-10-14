import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FloorSelector } from "../FloorSelector/FloorSelector";
import { ManoeuvreCard } from "../ManoeuvreCard/ManoeuvreCard";
import { MapShellPresentationContext } from "./map-shell-presentation";

// Decision 75 (GAP-138/139): a scroll region draws no lasting scrollbar on a
// phone presentation, the thin Kozmos one beside the map and alone.
const card = (
  <ManoeuvreCard
    expanded
    instruction="Turn left at the café"
    itineraryLabel="Route"
    onToggle={() => undefined}
    type="left"
  >
    <p>Go straight</p>
  </ManoeuvreCard>
);
const levels = (
  <FloorSelector
    floors={[
      { id: "1", label: "Level 1", shortLabel: "L1" },
      { id: "g", label: "Ground floor", shortLabel: "GF" },
    ]}
    onFloorSelect={() => undefined}
    selectedFloor="g"
    variant="collapsible"
  />
);
const scrollbarOf = (selector: string) =>
  document.querySelector(selector)?.getAttribute("data-kozmos-scrollbar");

describe("scroll regions draw their scrollbar by presentation", () => {
  it.each([
    ["a phone sheet", "bottom", "hidden"],
    ["beside the map", "side", "thin"],
    ["apart from the map", "separated", "thin"],
    ["alone", null, "thin"],
  ] as const)("the direction card's itinerary %s", (_, presentation, want) => {
    render(
      <MapShellPresentationContext.Provider value={presentation}>
        {card}
      </MapShellPresentationContext.Provider>,
    );
    expect(scrollbarOf(".kozmos-manoeuvre-itinerary")).toBe(want);
  });

  it.each([
    ["a phone sheet", "bottom", "hidden"],
    ["beside the map", "side", "thin"],
  ] as const)("the opened level list %s", (_, presentation, want) => {
    render(
      <MapShellPresentationContext.Provider value={presentation}>
        {levels}
      </MapShellPresentationContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Ground floor/ }));
    expect(scrollbarOf(".kozmos-floor-selector-list")).toBe(want);
  });
});
