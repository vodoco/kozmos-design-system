import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RouteProgressRail,
  clampProgress,
  discLeading,
} from "./RouteProgressRail";

describe("RouteProgressRail", () => {
  it("describes every valid waypoint even when markers collide, and exposes completed track only when requested", () => {
    render(
      <RouteProgressRail
        progress={0.5}
        type="left"
        label="Journey"
        showCompletedTrack
        waypoints={[
          { id: "a", position: 0.5, type: "left", label: "Gallery entrance" },
          {
            id: "b",
            position: 0.5,
            type: "right",
            label: "Turn right into gallery",
          },
        ]}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAccessibleDescription(
      "Gallery entrance; Turn right into gallery",
    );
    expect(screen.getByTestId("route-completed-track")).toBeInTheDocument();
  });
  it("represents unknown progress without claiming zero or a current position", () => {
    render(
      <RouteProgressRail
        progress={null}
        type="left"
        label="Journey"
        valueText="Position unavailable"
      />,
    );
    const rail = screen.getByRole("progressbar");
    expect(rail).not.toHaveAttribute("aria-valuenow");
    expect(rail).toHaveAttribute("aria-valuetext", "Position unavailable");
    expect(screen.queryByTestId("route-progress-disc")).toBeNull();
  });

  it("uses logical travel placement without mirroring a physical turn", () => {
    render(
      <RouteProgressRail
        progress={0.25}
        type="left"
        label="Journey"
        dir="rtl"
      />,
    );
    const disc = screen.getByTestId("route-progress-disc");
    expect(disc).toHaveStyle({ insetInlineStart: discLeading(0.25) });
    expect(disc.style.left).toBe("");
    expect(disc.style.transform).not.toContain("scaleX");
  });

  it("guards CSS travel in a container narrower than the normal disc and dots", () => {
    expect(discLeading(0.5)).toContain("max(0px,");
  });
  it("keeps progress between the ends of the rail", () => {
    expect(clampProgress(0.5)).toBe(0.5);
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(2)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it("puts the disc just after the start dot, just before the end dot, and between", () => {
    expect(discLeading(0)).toBe(
      "calc(min(10px, 20%) + max(0px, 100% - min(20px, 40%) - min(34px, 60%)) * 0)",
    );
    expect(discLeading(1)).toBe(
      "calc(min(10px, 20%) + max(0px, 100% - min(20px, 40%) - min(34px, 60%)) * 1)",
    );
    expect(discLeading(0.5)).toBe(
      "calc(min(10px, 20%) + max(0px, 100% - min(20px, 40%) - min(34px, 60%)) * 0.5)",
    );
  });

  it("is a progress bar with the label and the percentage", () => {
    render(
      <RouteProgressRail
        progress={0.84}
        type="destination"
        label="Step 4 of 4"
      />,
    );
    const rail = screen.getByRole("progressbar", { name: "Step 4 of 4" });
    expect(rail).toHaveAttribute("aria-valuenow", "84");
    expect(rail).toHaveAttribute("aria-valuemin", "0");
    expect(rail).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByTestId("route-progress-disc")).toHaveStyle({
      insetInlineStart: discLeading(0.84),
    });
  });

  it("reads a progress outside the rail as its nearest end", () => {
    render(
      <RouteProgressRail progress={3} type="straight" label="Step 1 of 1" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
