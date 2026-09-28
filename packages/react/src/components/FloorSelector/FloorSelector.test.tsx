import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { ChevronUp } from "@kozmos-ds/icons";
import { AnalyticsProvider } from "../../utils/analytics";
import { FloorSelector } from "./FloorSelector";
import { describe, it, expect, vi } from "vitest";

describe("FloorSelector", () => {
  it("renders floors and handles selection", () => {
    const onSelect = vi.fn();
    render(
      <FloorSelector
        floors={["1", "2", "3"]}
        selectedFloor="1"
        onFloorSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Floor selector" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("supports labelled horizontal floors and disabled options", () => {
    render(
      <FloorSelector
        floors={[
          { id: "g", label: "Ground floor", shortLabel: "GF" },
          { id: "1", label: "First floor", shortLabel: "1F", disabled: true },
        ]}
        selectedFloor="g"
        onFloorSelect={() => undefined}
        variant="horizontal-list"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Ground floor" }),
    ).toHaveTextContent("GF");
    expect(screen.getByRole("button", { name: "First floor" })).toBeDisabled();
  });

  it("steps through available floors in compact mode", () => {
    const onSelect = vi.fn();
    render(
      <FloorSelector
        floors={[
          { id: "2", label: "Second floor", shortLabel: "2F" },
          { id: "1", label: "First floor", shortLabel: "1F", disabled: true },
          { id: "g", label: "Ground floor", shortLabel: "GF" },
        ]}
        selectedFloor="2"
        onFloorSelect={onSelect}
        variant="compact-stepper"
      />,
    );

    // Down from the second floor lands on the ground: the first is closed.
    expect(screen.getByRole("button", { name: "Floor up" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Floor down" }));
    expect(onSelect).toHaveBeenCalledWith("g");
  });

  it("calls the stepper's buttons Floor up and Floor down, as iOS and Android do", () => {
    // One pair of names on all three platforms. The previous level in list
    // order is on the up chevron, so a venue that lists its levels top first,
    // as the native tests do, goes up with "Floor up".
    const onSelect = vi.fn();
    render(
      <FloorSelector
        floors={[
          { id: "2", label: "Second floor", shortLabel: "2F" },
          { id: "1", label: "First floor", shortLabel: "1F" },
          { id: "g", label: "Ground floor", shortLabel: "GF" },
        ]}
        selectedFloor="1"
        onFloorSelect={onSelect}
        variant="compact-stepper"
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    const [up, down] = buttons;
    expect(up).toHaveAccessibleName("Floor up");
    expect(down).toHaveAccessibleName("Floor down");
    // The name sits on the button that draws the up chevron.
    const chevronUp = render(<ChevronUp />)
      .container.querySelector("path")
      ?.getAttribute("d");
    expect(chevronUp).toBeTruthy();
    expect(up.querySelector("path")).toHaveAttribute("d", chevronUp);
    fireEvent.click(up);
    fireEvent.click(down);
    expect(onSelect.mock.calls).toEqual([["2"], ["g"]]);
  });

  it("lets the product name the stepper's two buttons", () => {
    render(
      <FloorSelector
        floors={["1", "2", "3"]}
        nextFloorLabel="Nächste Etage"
        onFloorSelect={() => undefined}
        previousFloorLabel="Vorherige Etage"
        selectedFloor="2"
        variant="compact-stepper"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Vorherige Etage" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Nächste Etage" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Floor up" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Floor down" })).toBeNull();
  });

  it("marks the levels that hold results, and says how many", () => {
    // GAP-070. Only the hollow pins said the answer was upstairs, and only
    // once the map was looked at.
    render(
      <FloorSelector
        floors={[
          { id: "1", label: "Level 1", shortLabel: "1" },
          { id: "2", label: "Level 2", shortLabel: "2", resultCount: 3 },
          { id: "3", label: "Level 3", shortLabel: "3", resultCount: 0 },
        ]}
        onFloorSelect={() => undefined}
        resultCountLabel={(count) => `${count} Ergebnisse`}
        selectedFloor="1"
      />,
    );
    // The count joins the floor's own label, in the product's words.
    expect(
      screen.getByRole("button", { name: "Level 2, 3 Ergebnisse" }),
    ).toBeVisible();
    // Zero is not "unknown", and neither is marked: a level with no results
    // reads as itself.
    expect(screen.getByRole("button", { name: "Level 3" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Level 1" })).toBeVisible();
    // Said once, not twice: the marker is hidden from assistive technology.
    // Scoped to its own button: Level 3's short label is also "3", which is
    // exactly the collision a badge on a numbered control invites.
    const level2 = screen.getByRole("button", {
      name: "Level 2, 3 Ergebnisse",
    });
    expect(within(level2).getByText("3")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("says one result in the singular until the product says otherwise", () => {
    // The default read "1 results". iOS and Android say "1 result".
    render(
      <FloorSelector
        floors={[
          { id: "1", label: "Level 1", shortLabel: "1", resultCount: 1 },
          { id: "2", label: "Level 2", shortLabel: "2", resultCount: 2 },
        ]}
        onFloorSelect={() => undefined}
        selectedFloor="1"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Level 1, 1 result" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Level 2, 2 results" }),
    ).toBeVisible();
  });

  it("marks and says only a count above zero", () => {
    // A negative count is no count: it was drawn as "-2" and said as
    // "-2 results". iOS and Android mark only a count above zero.
    render(
      <FloorSelector
        floors={[
          { id: "1", label: "Level 1", shortLabel: "1", resultCount: -2 },
          { id: "2", label: "Level 2", shortLabel: "2" },
        ]}
        onFloorSelect={() => undefined}
        selectedFloor="2"
      />,
    );
    const level1 = screen.getByRole("button", { name: "Level 1" });
    expect(within(level1).queryByText("-2")).toBeNull();
  });
});

// Row 79 (GAP-080): the SDK's level switcher, as Olcay's board draws it
// (decision 38). At rest one map-control tile showing the current level's
// short label; activated, it grows into a column of every level, top floor
// first (decision 29), the current one outlined; a choice, Escape or a tap
// outside closes it, handing focus back to the tile. The level the visitor is
// on carries a dot.
describe("FloorSelector collapsible", () => {
  const levels = [
    { id: "2", label: "Second floor", shortLabel: "2F" },
    { id: "1", label: "First floor", shortLabel: "1F" },
    { id: "g", label: "Ground floor", shortLabel: "GF" },
  ];

  function Controlled({
    onSelect,
    userFloor,
  }: {
    onSelect?: (floor: string) => void;
    userFloor?: string;
  }) {
    const [floor, setFloor] = useState("1");
    return (
      <FloorSelector
        floors={levels}
        onFloorSelect={(next) => {
          onSelect?.(next);
          setFloor(next);
        }}
        selectedFloor={floor}
        userFloor={userFloor}
        variant="collapsible"
      />
    );
  }

  /** The tile, found in its group: open, the column has a level of that name too. */
  const tileNamed = (name: string) =>
    within(screen.getByRole("group", { name: "Floor selector" })).getByRole(
      "button",
      { name },
    );

  /** Opens the column from the tile and returns both. */
  async function open(name = "First floor") {
    const tile = tileNamed(name);
    fireEvent.click(tile);
    const list = await screen.findByRole("dialog", { name: "Floor selector" });
    return { tile, list };
  }

  const dotsIn = (element: HTMLElement) =>
    element.querySelectorAll("[data-floor-selector-user-level]");

  it("rests as one map-control tile showing the current level's short label", () => {
    render(
      <FloorSelector
        floors={levels}
        onFloorSelect={() => undefined}
        selectedFloor="1"
        variant="collapsible"
      />,
    );
    const group = screen.getByRole("group", { name: "Floor selector" });
    const buttons = within(group).getAllByRole("button");
    // One tile, not a button per level.
    expect(buttons).toHaveLength(1);
    const [tile] = buttons;
    // Named by the level it is on, and closed.
    expect(tile).toHaveAccessibleName("First floor");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(tile).toHaveTextContent("1F");
    // Drawn by the map control itself, so it is styled as one.
    expect(tile).toHaveAttribute("data-presentation", "icon-only");
    // The level alone: no arrows, and no dot without a visitor's level.
    expect(tile.querySelectorAll("svg")).toHaveLength(0);
    expect(dotsIn(tile)).toHaveLength(0);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("grows into a column of every level, says it is open, and moves focus to the current level", async () => {
    render(<Controlled />);
    const { tile, list } = await open();
    expect(tile).toHaveAttribute("aria-expanded", "true");
    const rows = within(list).getAllByRole("button");
    // Top floor first, each level its short label, as the tile shows it.
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Second floor",
      "First floor",
      "Ground floor",
    ]);
    expect(rows.map((row) => row.textContent)).toEqual(["2F", "1F", "GF"]);
    expect(rows.map((row) => row.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    await waitFor(() => expect(rows[1]).toHaveFocus());
  });

  it("sizes the column's levels to the tile, so its bottom level lies over it whatever size the map control takes", async () => {
    // jsdom lays nothing out: the tile says it is 48 square, as the shared
    // map-control surface may make it.
    render(<Controlled />);
    const tile = tileNamed("First floor");
    Object.defineProperty(tile, "offsetWidth", {
      configurable: true,
      value: 48,
    });
    Object.defineProperty(tile, "offsetHeight", {
      configurable: true,
      value: 48,
    });
    fireEvent.click(tile);
    const list = await screen.findByRole("dialog", { name: "Floor selector" });
    for (const level of within(list).getAllByRole("button")) {
      expect(level).toHaveStyle({ height: "48px", minWidth: "48px" });
    }
  });

  it("closes after a choice, hands focus back to the tile, and the tile names the new level", async () => {
    const onSelect = vi.fn();
    render(<Controlled onSelect={onSelect} />);
    const { list } = await open();
    fireEvent.click(within(list).getByRole("button", { name: "Ground floor" }));
    expect(onSelect).toHaveBeenCalledWith("g");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Focus lands on the tile, which is named by the level now shown: that is
    // how a screen reader hears the choice was made.
    const tile = tileNamed("Ground floor");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(tile).toHaveFocus());
  });

  it("closes on Escape without choosing, and hands focus back to the tile", async () => {
    const onSelect = vi.fn();
    render(<Controlled onSelect={onSelect} />);
    const { tile, list } = await open();
    await waitFor(() =>
      expect(
        within(list).getByRole("button", { name: "First floor" }),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onSelect).not.toHaveBeenCalled();
    expect(tile).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(tile).toHaveFocus());
  });

  it("closes on a tap outside, and hands focus back to the tile", async () => {
    const onSelect = vi.fn();
    render(
      <>
        <Controlled onSelect={onSelect} />
        <div data-testid="map" style={{ height: 200, width: 200 }} />
      </>,
    );
    const { tile } = await open();
    // Radix listens for a press outside from the tick after it opens, so the
    // press that opened it does not close it again.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.pointerDown(screen.getByTestId("map"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(tile).toHaveFocus());
  });

  it("leaves focus where a tap outside put it, on another control", async () => {
    // A visitor who taps the search field with the column open is typing
    // next, not choosing a level: taking focus back would close their
    // keyboard.
    render(
      <>
        <Controlled />
        <input aria-label="Search" />
      </>,
    );
    await open();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const search = screen.getByRole("textbox", { name: "Search" });
    fireEvent.pointerDown(search);
    search.focus();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(search).toHaveFocus();
  });

  it("closes when the tile is activated again, as a screen reader can while the column covers it", async () => {
    render(<Controlled />);
    const { tile } = await open();
    fireEvent.click(tile);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(tile).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the levels that hold results in the column, and not on the tile", async () => {
    render(
      <FloorSelector
        floors={[
          { ...levels[0], resultCount: 3 },
          { ...levels[1], resultCount: 1 },
          { ...levels[2], resultCount: 0 },
        ]}
        onFloorSelect={() => undefined}
        selectedFloor="1"
        variant="collapsible"
      />,
    );
    // The tile is the level in view: it marks nothing and says no count.
    const tile = tileNamed("First floor");
    expect(
      tile.querySelectorAll("[data-floor-selector-result-count]"),
    ).toHaveLength(0);
    const { list } = await open();
    const second = within(list).getByRole("button", {
      name: "Second floor, 3 results",
    });
    expect(within(second).getByText("3")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    within(list).getByRole("button", { name: "First floor, 1 result" });
    within(list).getByRole("button", { name: "Ground floor" });
  });

  it("lists a closed level but does not let it be chosen", async () => {
    render(
      <FloorSelector
        floors={[levels[0], { ...levels[1], disabled: true }, levels[2]]}
        onFloorSelect={() => undefined}
        selectedFloor="2"
        variant="collapsible"
      />,
    );
    const { list } = await open("Second floor");
    expect(
      within(list).getByRole("button", { name: "First floor" }),
    ).toBeDisabled();
  });

  it("reports the column opening, as iOS does", async () => {
    const dispatched = vi.fn();
    render(
      <AnalyticsProvider batchDelayMs={0} onDispatch={dispatched}>
        <Controlled />
      </AnalyticsProvider>,
    );
    await open();
    await waitFor(() =>
      expect(dispatched.mock.calls.flat(2)).toContainEqual(
        expect.objectContaining({
          component: "FloorSelector",
          eventName: "floor_selector_expanded",
          properties: { floor: "1" },
        }),
      ),
    );
  });

  // Decision 38: the level the visitor is on carries a dot, as the SDK's
  // switcher marks it, and assistive technology hears it with the level.
  describe("the visitor's level", () => {
    it("marks the visitor's level in the column whichever level is shown, and says so", async () => {
      render(<Controlled userFloor="g" />);
      const { list } = await open();
      const ground = within(list).getByRole("button", {
        name: "Ground floor, your level",
      });
      // Drawn once and said once: the dot itself is hidden.
      const [dot] = [...dotsIn(ground)];
      expect(dot).toBeTruthy();
      expect(dot).toHaveAttribute("aria-hidden", "true");
      // On that level only.
      expect(dotsIn(list)).toHaveLength(1);
      within(list).getByRole("button", { name: "First floor" });
    });

    it("marks the closed tile only while it shows the visitor's level", () => {
      const { rerender } = render(
        <FloorSelector
          floors={levels}
          onFloorSelect={() => undefined}
          selectedFloor="1"
          userFloor="g"
          variant="collapsible"
        />,
      );
      // The tile shows the first floor; the visitor is on the ground.
      const tile = tileNamed("First floor");
      expect(dotsIn(tile)).toHaveLength(0);
      rerender(
        <FloorSelector
          floors={levels}
          onFloorSelect={() => undefined}
          selectedFloor="g"
          userFloor="g"
          variant="collapsible"
        />,
      );
      const onTheirLevel = tileNamed("Ground floor, your level");
      expect(dotsIn(onTheirLevel)).toHaveLength(1);
    });

    it("draws no dot and says nothing without the visitor's level", async () => {
      render(<Controlled />);
      const { list } = await open();
      expect(dotsIn(document.body)).toHaveLength(0);
      expect(
        within(list)
          .getAllByRole("button")
          .map((row) => row.getAttribute("aria-label")),
      ).toEqual(["Second floor", "First floor", "Ground floor"]);
    });

    it("says the visitor's level in the product's words", () => {
      render(
        <FloorSelector
          floors={levels}
          onFloorSelect={() => undefined}
          selectedFloor="1"
          userFloor="1"
          userFloorLabel="Ihre Ebene"
          variant="collapsible"
        />,
      );
      tileNamed("First floor, Ihre Ebene");
    });

    it("keeps the dot and a result count apart on one level", async () => {
      // The dot takes the level's top trailing corner, as on the SDK's board;
      // the count moves to its bottom trailing corner in this column, so
      // neither covers the other.
      render(
        <FloorSelector
          floors={[{ ...levels[0], resultCount: 3 }, levels[1], levels[2]]}
          onFloorSelect={() => undefined}
          selectedFloor="1"
          userFloor="2"
          variant="collapsible"
        />,
      );
      const { list } = await open();
      const second = within(list).getByRole("button", {
        name: "Second floor, your level, 3 results",
      });
      const [dot] = [...dotsIn(second)];
      const count = second.querySelector("[data-floor-selector-result-count]");
      expect(dot).toHaveClass("top-1");
      expect(count).toHaveClass("bottom-0.5");
      expect(count).not.toHaveClass("top-0.5");
    });
  });
});
