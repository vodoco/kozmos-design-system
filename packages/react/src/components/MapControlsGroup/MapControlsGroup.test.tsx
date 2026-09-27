import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MapControlsGroup } from "./MapControlsGroup";

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
});
