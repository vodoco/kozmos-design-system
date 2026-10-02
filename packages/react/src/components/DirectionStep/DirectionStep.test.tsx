import { render, screen } from "@testing-library/react";
import { DirectionStep, DIRECTION_TYPES } from "./DirectionStep";
import { describe, it, expect } from "vitest";

describe("DirectionStep", () => {
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
