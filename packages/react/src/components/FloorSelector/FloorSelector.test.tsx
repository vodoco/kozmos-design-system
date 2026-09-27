import { fireEvent, render, screen } from "@testing-library/react";
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
});
