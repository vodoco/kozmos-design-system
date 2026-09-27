import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Accessibility,
  Compass01,
  LocationFollowing,
  LocationHeading,
  NavigationPointer01,
  NavigationPointerOff01,
} from "@kozmos-ds/icons";
import type { UserLocationState } from "@kozmos-ds/product-contracts";
import { MapControlsGroup } from "./MapControlsGroup";

/** The outline of every icon drawn inside `element`, one list per svg. */
function drawnIcons(element: Element): (string | null)[][] {
  return Array.from(element.querySelectorAll("svg"), (svg) =>
    Array.from(svg.querySelectorAll("path"), (path) => path.getAttribute("d")),
  );
}

/** The outline an icon draws on its own, to compare a control's against. */
function outlineOf(icon: React.ReactElement): (string | null)[] {
  const { container, unmount } = render(icon);
  const [outline] = drawnIcons(container);
  unmount();
  return outline ?? [];
}

describe("MapControlsGroup", () => {
  it("renders zoom controls and calls handlers", () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();

    render(<MapControlsGroup onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));
    fireEvent.click(screen.getByLabelText("Zoom out"));

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("renders optional compass and location controls", () => {
    const onCompassReset = vi.fn();
    const onMyLocation = vi.fn();

    render(
      <MapControlsGroup
        onCompassReset={onCompassReset}
        onMyLocation={onMyLocation}
        compassBearing={90}
        locationLabel="Locate me"
      />,
    );

    fireEvent.click(screen.getByLabelText("Reset bearing"));
    fireEvent.click(screen.getByLabelText("Locate me"));

    expect(onCompassReset).toHaveBeenCalledTimes(1);
    expect(onMyLocation).toHaveBeenCalledTimes(1);
  });

  it("communicates location-following state without relying on colour", () => {
    render(
      <MapControlsGroup
        onMyLocation={() => undefined}
        locationLabel="Focus"
        locationPresentation="labelled"
        locationState="following"
        locationStateLabel="On"
      />,
    );

    expect(screen.getByRole("button", { name: "Focus, On" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not render controls without corresponding handlers", () => {
    render(<MapControlsGroup />);

    expect(
      screen.getByRole("group", { name: "Map controls" }),
    ).toBeEmptyDOMElement();
  });
  it("lets every control keep the surface, hover and lift MapControlButton gives it", () => {
    render(
      <MapControlsGroup
        onCompassReset={() => undefined}
        onMyLocation={() => undefined}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
        locationLabel="Focus"
        locationState="following"
        locationStateLabel="On"
      />,
    );

    const buttons = [
      screen.getByRole("button", { name: "Zoom in" }),
      screen.getByRole("button", { name: "Zoom out" }),
      screen.getByRole("button", { name: "Reset bearing" }),
      screen.getByRole("button", { name: "Focus, On" }),
    ];

    for (const button of buttons) {
      // A caller class beats the component through tailwind-merge. The group
      // used to restate `bg-background/90` — which compiles to nothing, so the
      // compass stayed see-through between two white controls — and
      // `hover:bg-secondary`, the border grey.
      expect(button.className).not.toContain("bg-background/");
      expect(button.className).not.toContain("hover:bg-secondary");
      expect(button).toHaveClass("bg-background", "hover:bg-muted");
    }

    // `shadow-floating` passed from here used to win over the component's
    // `shadow-raised`, so a following location control never lifted.
    expect(buttons[3]).toHaveClass("shadow-raised");
    expect(buttons[3]).not.toHaveClass("shadow-floating");
  });

  it("lets the product name every control, in its own language", () => {
    // Hard-coded English until row 67: a German device announced "Zoom in"
    // whatever else the product had translated.
    render(
      <MapControlsGroup
        compassResetLabel="Nach Norden ausrichten"
        onCompassReset={() => undefined}
        onMyLocation={() => undefined}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
        zoomInLabel="Vergrößern"
        zoomOutLabel="Verkleinern"
      />,
    );
    expect(screen.getByRole("button", { name: "Vergrößern" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Verkleinern" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Nach Norden ausrichten" }),
    ).toBeVisible();
    // No English left behind for a translated product.
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
  });

  describe("the location control (row 77)", () => {
    // The Location Tracking Buttons revamp (Figma ce7phRJR1sCkH6zT8EMH8I,
    // 1:237) draws a different mark for each mode. Until row 77 the group drew
    // one pointer for all of them, so a board wanting "heading" put
    // MapControlButton on its own with compass-01 standing in.
    const cases: [UserLocationState, React.ReactElement][] = [
      ["off", <NavigationPointer01 key="off" />],
      ["locating", <NavigationPointer01 key="locating" />],
      ["stale", <NavigationPointer01 key="stale" />],
      ["following", <LocationFollowing key="following" />],
      ["heading", <LocationHeading key="heading" />],
      ["permission-denied", <NavigationPointerOff01 key="denied" />],
      ["unavailable", <NavigationPointerOff01 key="unavailable" />],
    ];

    it.each(cases)("draws the %s mark", (state, expected) => {
      const outline = outlineOf(expected);
      render(
        <MapControlsGroup
          locationLabel="Focus"
          locationState={state}
          onMyLocation={() => undefined}
        />,
      );
      const control = screen.getByRole("button", { name: "Focus" });

      expect(outline.length).toBeGreaterThan(0);
      expect(drawnIcons(control)).toContainEqual(outline);
      expect(control).toHaveAttribute("data-location-state", state);
    });

    it("lets the product draw its own mark for a state", () => {
      render(
        <MapControlsGroup
          locationIcons={{ heading: <Compass01 data-testid="own-heading" /> }}
          locationLabel="Focus"
          locationState="heading"
          onMyLocation={() => undefined}
        />,
      );

      const control = screen.getByRole("button", { name: "Focus" });
      expect(within(control).getByTestId("own-heading")).toBeInTheDocument();
      // Only the state it was given: the others keep the group's own marks.
      expect(drawnIcons(control)).not.toContainEqual(
        outlineOf(<LocationHeading />),
      );
    });

    it("reveals its new mode for a moment when asked to, as the SDK's control does", () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(
          <MapControlsGroup
            locationLabel="Focus"
            locationRevealOnChange
            locationState="off"
            locationStateLabel="Off"
            onMyLocation={() => undefined}
          />,
        );
        expect(
          screen.getByRole("button", { name: "Focus, Off" }),
        ).toHaveAttribute("data-presentation", "icon-only");

        rerender(
          <MapControlsGroup
            locationLabel="Focus"
            locationRevealOnChange
            locationState="following"
            locationStateLabel="On"
            onMyLocation={() => undefined}
          />,
        );
        act(() => {
          vi.advanceTimersByTime(10);
        });
        expect(
          screen.getByRole("button", { name: "Focus, On" }),
        ).toHaveAttribute("data-presentation", "labelled");

        act(() => {
          vi.advanceTimersByTime(2600);
        });
        expect(
          screen.getByRole("button", { name: "Focus, On" }),
        ).toHaveAttribute("data-presentation", "icon-only");
      } finally {
        vi.useRealTimers();
      }
    });

    it("sets its state under its name when stacked", () => {
      render(
        <MapControlsGroup
          locationLabel="Focus"
          locationLabelPlacement="stacked"
          locationPresentation="labelled"
          locationState="following"
          locationStateLabel="On"
          onMyLocation={() => undefined}
        />,
      );

      const control = screen.getByRole("button", { name: "Focus, On" });
      expect(within(control).getByText("Focus").parentElement).toHaveClass(
        "flex-col",
      );
    });
  });

  describe("the step-free control", () => {
    // While a route is active, a step-free on/off control takes the location
    // control's place, looking as it does (Olcay, 2026-09-27).
    it("takes the location control's place while a route is active", () => {
      const onStepFreeChange = vi.fn();
      render(
        <MapControlsGroup
          locationLabel="Focus"
          stepFree={false}
          onMyLocation={() => undefined}
          onStepFreeChange={onStepFreeChange}
        />,
      );

      const control = screen.getByRole("button", { name: "Step-free, Off" });
      expect(control).toHaveAttribute("aria-pressed", "false");
      expect(drawnIcons(control)).toContainEqual(outlineOf(<Accessibility />));
      expect(screen.queryByRole("button", { name: /^Focus/ })).toBeNull();

      fireEvent.click(control);
      expect(onStepFreeChange).toHaveBeenCalledWith(true);
    });

    it("says it is on, in the product's language", () => {
      const onStepFreeChange = vi.fn();
      render(
        <MapControlsGroup
          stepFree
          stepFreeLabel="Stufenlos"
          stepFreeOffLabel="Aus"
          stepFreeOnLabel="Ein"
          onStepFreeChange={onStepFreeChange}
        />,
      );

      const control = screen.getByRole("button", { name: "Stufenlos, Ein" });
      expect(control).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(control);
      expect(onStepFreeChange).toHaveBeenCalledWith(false);
    });

    it("reveals and stacks as the location control it replaces is set to", () => {
      vi.useFakeTimers();
      try {
        const props = {
          locationLabelPlacement: "stacked",
          locationRevealOnChange: true,
          onStepFreeChange: () => undefined,
        } as const;
        const { rerender } = render(
          <MapControlsGroup {...props} stepFree={false} />,
        );
        rerender(<MapControlsGroup {...props} stepFree />);
        act(() => {
          vi.advanceTimersByTime(10);
        });

        const control = screen.getByRole("button", { name: "Step-free, On" });
        expect(control).toHaveAttribute("data-presentation", "labelled");
        expect(
          within(control).getByText("Step-free").parentElement,
        ).toHaveClass("flex-col");
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
