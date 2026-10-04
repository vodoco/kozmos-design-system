import { render, screen } from "@testing-library/react";
import {
  DirectionStep,
  DIRECTION_TYPES,
  DIRECTION_ICONS,
} from "./DirectionStep";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  HardLeft,
  HardRight,
  TurnBack,
  Arriving,
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
  it("draws Pointr's Express wayfinding artwork for turns, turning back, the destination, lifts, escalators, stairs, ramps, entry and exit", () => {
    // Olcay, 2026-10-04: the original artwork from Pointr Maps - Express
    // (Figma BwtG2COVRqUWGPrIvP4jxr, 29853:51378) replaces the arrows D5
    // drew while the earlier, unapproved artwork was withheld.
    expect(DIRECTION_ICONS["lift-up"]).toBe(ElevatorUp);
    expect(DIRECTION_ICONS["lift-down"]).toBe(ElevatorDown);
    expect(DIRECTION_ICONS["escalator-up"]).toBe(EscalatorUp);
    expect(DIRECTION_ICONS["escalator-down"]).toBe(EscalatorDown);
    expect(DIRECTION_ICONS["stairs-up"]).toBe(StairsUp);
    expect(DIRECTION_ICONS["stairs-down"]).toBe(StairsDown);
    expect(DIRECTION_ICONS["ramp-up"]).toBe(RampUp);
    expect(DIRECTION_ICONS["ramp-down"]).toBe(RampDown);
    expect(DIRECTION_ICONS.enter).toBe(RouteEnter);
    expect(DIRECTION_ICONS.exit).toBe(RouteExit);
    expect(DIRECTION_ICONS.left).toBe(HardLeft);
    expect(DIRECTION_ICONS.right).toBe(HardRight);
    expect(DIRECTION_ICONS["turn-back"]).toBe(TurnBack);
    expect(DIRECTION_ICONS.destination).toBe(Arriving);
    // Straight on, level changes and transitions, which Express has no glyph
    // for, keep the Pointr set's arrows.
    expect(DIRECTION_ICONS.straight).toBe(ArrowUp);
    expect(DIRECTION_ICONS["level-up"]).toBe(ArrowUp);
    expect(DIRECTION_ICONS["level-down"]).toBe(ArrowDown);
    expect(DIRECTION_ICONS.transition).toBe(ArrowRight);
    expect(DIRECTION_ICONS.walking).toBe(Walking);
    expect(DIRECTION_TYPES).toContain("walking");
    expect(DIRECTION_TYPES).toContain("ramp-up");
    expect(DIRECTION_TYPES).toContain("enter");
  });

  it("draws the wayfinding artwork as solid shapes in the current colour", () => {
    const { container } = render(
      <DirectionStep type="escalator-up" instruction="Take the escalator up" />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("stroke")).toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
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
