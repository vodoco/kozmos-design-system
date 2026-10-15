import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("the opened level list", () => {
    // jsdom measures nothing: the list overflows here because these say so.
    const overflow = (overflows: boolean) => {
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(
            private readonly callback: (
              entries: ResizeObserverEntry[],
              observer: unknown,
            ) => void,
          ) {}
          observe() {
            this.callback([], this);
          }
          disconnect() {}
        },
      );
      const list = (node: HTMLElement, value: number) =>
        node.classList?.contains("kozmos-floor-selector-scroll") ? value : 0;
      vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
        function (this: HTMLElement) {
          return list(this, overflows ? 500 : 100);
        },
      );
      vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
        function (this: HTMLElement) {
          return list(this, 200);
        },
      );
    };
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it.each([
      ["in a phone sheet", "bottom", "hidden"],
      ["beside the map", "side", "thin"],
    ] as const)("%s, while it scrolls", async (_, presentation, want) => {
      overflow(true);
      render(
        <MapShellPresentationContext.Provider value={presentation}>
          {levels}
        </MapShellPresentationContext.Provider>,
      );
      fireEvent.click(screen.getByRole("button", { name: /Ground floor/ }));
      await waitFor(() =>
        expect(scrollbarOf(".kozmos-floor-selector-scroll")).toBe(want),
      );
    });

    it("carries no mark while it fits, so its hints are not clipped", () => {
      overflow(false);
      render(
        <MapShellPresentationContext.Provider value="side">
          {levels}
        </MapShellPresentationContext.Provider>,
      );
      fireEvent.click(screen.getByRole("button", { name: /Ground floor/ }));
      expect(scrollbarOf(".kozmos-floor-selector-scroll")).toBeNull();
    });
  });
});
