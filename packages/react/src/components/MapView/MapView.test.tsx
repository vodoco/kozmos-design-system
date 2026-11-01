import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapView } from "./MapView";

describe("MapView", () => {
  it("renders an accessible map host and its renderer content", () => {
    render(
      <MapView mapLabel="Ground floor map">
        <div>Map renderer</div>
      </MapView>,
    );

    expect(
      screen.getByRole("region", { name: "Ground floor map" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Map renderer")).toBeInTheDocument();
  });

  it("fills its shell without drawing a frame of its own, or a second region", () => {
    // Inside AdaptiveMapShell the map covers the screen edge to edge. A border,
    // a rounded corner and a 400px floor are all wrong there — the shell is the
    // frame — and the shell has already named the map area a region, so naming
    // it again has a screen reader announce the same surface twice.
    const { container, rerender } = render(<MapView mapLabel="Venue map" />);
    const framed = container.firstElementChild as HTMLElement;
    // The control radius, 16, as SwiftUI's and Compose's MapView: a framed map
    // is a control-sized surface in page flow (the owner, 21 Oct). It was the
    // container radius, 20, on the web only.
    expect(framed).toHaveClass("rounded-control", "border", "min-h-[400px]");
    expect(framed).not.toHaveClass("rounded-container");
    expect(framed).toHaveAttribute("role", "region");

    rerender(<MapView mapLabel="Venue map" variant="fill" />);
    const filled = container.firstElementChild as HTMLElement;
    expect(filled).not.toHaveClass("rounded-container");
    expect(filled).not.toHaveClass("rounded-control");
    expect(filled).not.toHaveClass("border");
    expect(filled).not.toHaveClass("min-h-[400px]");
    expect(filled).toHaveAttribute("role", "group");
    expect(filled).toHaveAttribute("aria-label", "Venue map");

    // A caller's own role still wins, as Alert's and Notice's do.
    rerender(
      <MapView mapLabel="Venue map" role="application" variant="fill" />,
    );
    expect(container.firstElementChild).toHaveAttribute("role", "application");
  });

  it("is its own stacking context, framed or filling (site GAP-40)", () => {
    // MapOverlay is z-index 50, as a sticky Navbar is, and a map engine's
    // layers take z-indexes of their own: isolated, they stack inside the
    // map and never over the page's header or the shell's chrome.
    // scripts/check-site-gaps.mjs reads what draws on top in every engine.
    const { container, rerender } = render(<MapView mapLabel="Venue map" />);
    expect(container.firstElementChild).toHaveClass("isolate");
    rerender(<MapView mapLabel="Venue map" variant="fill" />);
    expect(container.firstElementChild).toHaveClass("isolate");
  });
});
