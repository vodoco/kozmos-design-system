import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteProgressRail } from "./RouteProgressRail";

const elevator = {
  id: "elevator",
  position: 0.4,
  type: "lift-up" as const,
  label: "Elevator to Level 2",
};
const base = {
  type: "walking" as const,
  label: "Journey",
  activeLeg: { start: 0, end: 0.4 },
  appearance: "gradient" as const,
  waypoints: [elevator],
};

describe("RouteProgressRail route presentation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("prioritizes the host's next waypoint when transitions share one position", () => {
    const width = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(320);
    const { container } = render(
      <RouteProgressRail
        {...base}
        progress={0.4}
        activeWaypointId="elevator"
        waypoints={[
          { ...elevator, id: "turn", type: "right", label: "Turn right" },
          elevator,
        ]}
      />,
    );
    expect(
      container.querySelector('[data-waypoint-id="elevator"]'),
    ).not.toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAccessibleDescription(
      "Turn right; Elevator to Level 2",
    );
    width.mockRestore();
  });
  it("colours only the selected static section without a location or numerical progress", () => {
    render(
      <RouteProgressRail
        {...base}
        activeLeg={{ start: 0.2, end: 0.4 }}
        positionMode="static"
        progress={0.3}
        motion="directional"
      />,
    );
    const active = screen.getByTestId("progress-active-range");
    expect(active).toHaveStyle({ insetInlineStart: "20%", width: "20%" });
    expect(active).toHaveAttribute("data-appearance", "gradient");
    expect(screen.queryByTestId("route-user-location")).toBeNull();
    expect(screen.getByRole("img", { name: "Journey" })).not.toHaveAttribute(
      "aria-valuenow",
    );
    expect(screen.getByTestId("progress-directional-flow")).toHaveStyle({
      insetInlineStart: "20%",
      width: "20%",
    });
  });

  it("grows the live gradient from journey start to the dot, never resetting at transitions", () => {
    const { rerender } = render(
      <RouteProgressRail {...base} progress={0.1} motion="directional" />,
    );
    expect(screen.getByTestId("progress-active-range")).toHaveStyle({
      insetInlineStart: "0%",
      width: "10%",
    });
    expect(screen.getByTestId("progress-directional-flow")).toHaveStyle({
      insetInlineStart: "10%",
    });
    rerender(
      <RouteProgressRail
        {...base}
        activeLeg={{ start: 0.4, end: 1 }}
        progress={0.6}
        motion="directional"
      />,
    );
    expect(screen.getByTestId("progress-active-range")).toHaveStyle({
      insetInlineStart: "0%",
      width: "60%",
    });
    expect(screen.getByTestId("route-user-location")).toHaveAttribute(
      "data-position",
      "0.6",
    );
    expect(screen.queryByTestId("route-progress-disc")).toBeNull();
  });

  it("shows zero as a real dot without painting distance, and disables flow at the next transition", () => {
    const { rerender } = render(
      <RouteProgressRail {...base} progress={0} motion="directional" />,
    );
    expect(screen.queryByTestId("progress-active-range")).toBeNull();
    expect(screen.getByTestId("route-user-location")).toHaveAttribute(
      "data-position",
      "0",
    );
    expect(screen.getByTestId("progress-directional-flow")).toHaveStyle({
      width: "40%",
    });
    rerender(
      <RouteProgressRail {...base} progress={0.4} motion="directional" />,
    );
    expect(screen.queryByTestId("progress-directional-flow")).toBeNull();
  });

  it("allows the host to stop guidance motion without changing supplied progress", () => {
    render(<RouteProgressRail {...base} progress={0.2} motion="none" />);
    expect(screen.queryByTestId("progress-directional-flow")).toBeNull();
    expect(screen.getByTestId("route-user-location")).toHaveAttribute(
      "data-position",
      "0.2",
    );
  });

  it("suspends the decorative flow when hidden without moving the position", () => {
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");
    render(<RouteProgressRail {...base} progress={0.2} motion="directional" />);
    expect(screen.getByTestId("progress-directional-flow")).not.toBeNull();
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByTestId("progress-directional-flow")).toBeNull();
    expect(screen.getByTestId("route-user-location")).toHaveAttribute(
      "data-position",
      "0.2",
    );
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByTestId("progress-directional-flow")).not.toBeNull();
  });

  it("describes a static section without progress-only ARIA attributes", () => {
    render(
      <RouteProgressRail
        {...base}
        progress={null}
        positionMode="static"
        valueText="Entrance to elevator"
      />,
    );
    const image = screen.getByRole("img");
    expect(image).not.toHaveAttribute("aria-valuetext");
    expect(image).not.toHaveAttribute("aria-valuemin");
    expect(image).toHaveAccessibleName("Journey: Entrance to elevator");
  });

  it("retains the next transition when the user reaches it, without advancing the leg", () => {
    const width = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(320);
    const { container } = render(
      <RouteProgressRail {...base} progress={0.4} />,
    );
    expect(
      container.querySelector('[data-waypoint-id="elevator"]'),
    ).not.toBeNull();
    expect(screen.getByTestId("progress-active-range")).toHaveStyle({
      width: "40%",
    });
    expect(screen.getByRole("progressbar")).toHaveAccessibleDescription(
      "Elevator to Level 2",
    );
    width.mockRestore();
  });

  it.each([null, Number.NaN, Infinity, 0.8])(
    "does not invent a current location for unavailable or inconsistent progress %s",
    (progress) => {
      render(
        <RouteProgressRail
          {...base}
          progress={progress}
          valueText="Position unavailable"
          motion="directional"
        />,
      );
      expect(screen.getByRole("progressbar")).not.toHaveAttribute(
        "aria-valuenow",
      );
      expect(screen.queryByTestId("route-user-location")).toBeNull();
      expect(screen.queryByTestId("progress-travelled-range")).toBeNull();
      expect(screen.queryByTestId("progress-active-range")).toBeNull();
      expect(screen.queryByTestId("progress-directional-flow")).toBeNull();
    },
  );

  it("does not paint an invalid host range as a valid route", () => {
    render(
      <RouteProgressRail
        {...base}
        activeLeg={{ start: 0.6, end: 0.2 }}
        progress={0.3}
      />,
    );
    expect(screen.queryByTestId("progress-active-range")).toBeNull();
    expect(screen.queryByTestId("route-user-location")).toBeNull();
  });
});
