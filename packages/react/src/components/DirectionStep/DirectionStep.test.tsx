import { render, screen } from "@testing-library/react";
import {
  DirectionStep,
  DIRECTION_TYPES,
  DIRECTION_ICONS,
} from "./DirectionStep";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  LogIn01,
  LogOut01,
  Walking,
  ElevatorUp,
  ElevatorDown,
  EscalatorUp,
  EscalatorDown,
  StairsUp,
  StairsDown,
  RampUp,
  RampDown,
  RouteEnter,
  RouteExit,
} from "@kozmos-ds/icons";
import { describe, it, expect } from "vitest";

describe("DirectionStep", () => {
  it("draws only approved marks by default until the navigation artwork is approved", () => {
    // Olcay, 2026-10-04 (D5): the original lift/escalator/stairs/ramp/entry
    // artwork awaits design review. It ships as named icons for products to
    // opt into; no default draws it.
    for (const type of ["lift-up", "escalator-up", "stairs-up", "level-up"])
      expect(DIRECTION_ICONS[type as keyof typeof DIRECTION_ICONS]).toBe(
        ArrowUp,
      );
    for (const type of [
      "lift-down",
      "escalator-down",
      "stairs-down",
      "level-down",
    ])
      expect(DIRECTION_ICONS[type as keyof typeof DIRECTION_ICONS]).toBe(
        ArrowDown,
      );
    expect(DIRECTION_ICONS.enter).toBe(LogIn01);
    expect(DIRECTION_ICONS.exit).toBe(LogOut01);
    expect(DIRECTION_ICONS["ramp-up"]).toBe(ArrowUpRight);
    expect(DIRECTION_ICONS["ramp-down"]).toBe(ArrowDownRight);
    expect(DIRECTION_ICONS.walking).toBe(Walking);
    const proposed = [
      ElevatorUp,
      ElevatorDown,
      EscalatorUp,
      EscalatorDown,
      StairsUp,
      StairsDown,
      RampUp,
      RampDown,
      RouteEnter,
      RouteExit,
    ];
    for (const icon of Object.values(DIRECTION_ICONS))
      expect(proposed).not.toContain(icon);
    expect(DIRECTION_TYPES).toContain("walking");
    expect(DIRECTION_TYPES).toContain("ramp-up");
    expect(DIRECTION_TYPES).toContain("enter");
  });
  it.each([
    [undefined, "2 min", "2 min"],
    ["50 m", undefined, "50 m"],
    ["50 m", "2 min", "50 m • 2 min"],
    ["", "0 min", "0 min"],
  ])("joins only provided metrics (%s, %s)", (distance, duration, expected) => {
    const { container } = render(
      <DirectionStep
        type="left"
        instruction="Turn left"
        distance={distance}
        duration={duration}
      />,
    );
    expect(container.querySelectorAll("p")[1].textContent?.trim()).toBe(
      expected,
    );
  });

  it("renders instruction and distance", () => {
    render(
      <DirectionStep type="left" instruction="Turn left" distance="50m" />,
    );
    expect(screen.getByText("Turn left")).toBeInTheDocument();
    expect(screen.getByText(/50m/)).toBeInTheDocument();
  });

  it("draws an arrow for every direction, silent to assistive technology", () => {
    for (const type of DIRECTION_TYPES) {
      const { container, unmount } = render(
        <DirectionStep type={type} instruction={type} />,
      );
      const svg = container.querySelector("svg");
      expect(svg, `${type} draws no arrow`).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      unmount();
    }
  });
});
