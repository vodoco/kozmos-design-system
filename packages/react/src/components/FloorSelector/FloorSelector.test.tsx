import { fireEvent, render, screen, within } from "@testing-library/react";
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
          { id: "g", label: "Ground floor", shortLabel: "GF" },
          { id: "1", label: "First floor", shortLabel: "1F", disabled: true },
          { id: "2", label: "Second floor", shortLabel: "2F" },
        ]}
        selectedFloor="g"
        onFloorSelect={onSelect}
        variant="compact-stepper"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous floor" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next floor" }));
    expect(onSelect).toHaveBeenCalledWith("2");
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
    expect(screen.queryByRole("button", { name: "Previous floor" })).toBeNull();
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
});
