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
});
