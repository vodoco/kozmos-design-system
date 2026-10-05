import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserLocationMarker } from "./UserLocationMarker";

describe("UserLocationMarker", () => {
  it("keeps SVG paint references local to each instance", () => {
    const { container } = render(
      <>
        <UserLocationMarker />
        <UserLocationMarker />
      </>,
    );
    const gradients = [...container.querySelectorAll("radialGradient")];
    expect(new Set(gradients.map((el) => el.id)).size).toBe(2);
    container.querySelectorAll("svg").forEach((svg) => {
      expect(svg.querySelector("path")).toHaveAttribute(
        "fill",
        `url(#${svg.querySelector("radialGradient")!.id})`,
      );
    });
  });
  it("renders as an accessible location marker", () => {
    render(<UserLocationMarker heading={45} />);

    expect(
      screen.getByRole("img", { name: "User location" }),
    ).toBeInTheDocument();
  });

  it("can hide the heading cone", () => {
    const { container } = render(<UserLocationMarker showHeading={false} />);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("is the prototype's marker: an 18 dot with a 3 border, a 48 pulsing ring, a 64 halo", () => {
    const { container } = render(<UserLocationMarker showHeading={false} />);
    const layers = Array.from(container.querySelectorAll("div > div")).map(
      (n) => n.className,
    );
    expect(
      layers.some(
        (c) => c.includes("h-16 w-16") && c.includes("opacity-[0.14]"),
      ),
    ).toBe(true);
    expect(
      layers.some((c) => c.includes("h-12 w-12") && c.includes("animate-ping")),
    ).toBe(true);
    expect(
      layers.some(
        (c) => c.includes("h-[18px] w-[18px]") && c.includes("border-[3px]"),
      ),
    ).toBe(true);
  });

  it("lets the product name the marker", () => {
    render(<UserLocationMarker label="Ihr Standort" />);
    expect(screen.getByRole("img", { name: "Ihr Standort" })).toBeVisible();
    expect(screen.queryByRole("img", { name: "User location" })).toBeNull();
  });

  it("goes hollow on another level, rather than looking the same everywhere", () => {
    // GAP-069. The marker looked identical whatever level was in view, so the
    // map page hid it and the visitor lost their position. Hollow, as
    // LocationPin's offFloor is: shape carries the state, not colour alone.
    const { container, rerender } = render(<UserLocationMarker />);
    const dot = () => container.querySelector(".z-10.rounded-pill");
    expect(container.firstElementChild).not.toHaveAttribute("data-off-floor");
    expect(container.innerHTML).toContain("bg-map-marker-dot");

    rerender(
      <UserLocationMarker
        offFloor
        offFloorLabel="Ihr Standort, auf einer anderen Ebene"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-off-floor", "true");
    expect(root).toHaveAttribute(
      "aria-label",
      "Ihr Standort, auf einer anderen Ebene",
    );
    // The ping says "here, now" and the cone says "facing this way". Neither
    // is true of a level you are not looking at.
    expect(container.querySelector(".animate-ping")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(dot()).toHaveClass("border-map-marker-dot", "bg-background");
  });

  // Olcay, 2026-10-05: the marker is drawn as SwiftUI and Compose draw it.
  it("rings the dot in the map marker's white and casts no shadow, as native does", () => {
    const { container, rerender } = render(<UserLocationMarker />);
    const dot = () => container.querySelector(".z-10.rounded-pill")!;
    expect(dot()).toHaveClass("border-map-marker-ring", "bg-map-marker-dot");
    expect(dot().className).not.toMatch(/shadow/);
    // The compact dot rings in the surface it sits on, as native's does.
    rerender(<UserLocationMarker compact />);
    expect(dot()).toHaveClass("border-background", "bg-map-marker-dot");
    expect(dot().className).not.toMatch(/shadow/);
  });

  it("draws native's heading cone: 64, from the centre to the top, fading out 32 away", () => {
    const { container } = render(<UserLocationMarker heading={90} />);
    const svg = container.querySelector("svg")!;
    expect(svg.parentElement).toHaveClass("h-16", "w-16");
    expect(svg.parentElement!.style.transform).toBe("rotate(90deg)");
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64");
    expect(svg).toHaveAttribute("overflow", "visible");
    expect(svg.querySelector("path")).toHaveAttribute(
      "d",
      "M32 32 L9.6 0 Q32 -6.4 54.4 0 Z",
    );
    const gradient = svg.querySelector("radialGradient")!;
    expect(gradient).toHaveAttribute("gradientUnits", "userSpaceOnUse");
    expect(gradient).toHaveAttribute("cx", "32");
    expect(gradient).toHaveAttribute("cy", "32");
    expect(gradient).toHaveAttribute("r", "32");
  });
});
