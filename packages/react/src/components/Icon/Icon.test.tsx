import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, it, expect, vi } from "vitest";
import { Icon } from "./Icon";
import * as kozmosIcons from "@kozmos-ds/icons";
import { Home01 as Home, kozmosIconNames } from "@kozmos-ds/icons";

describe("Icon", () => {
  it("renders svg", () => {
    const { container } = render(<Icon icon={Home} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a registry icon by name", () => {
    const { container } = render(<Icon name="home-line" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { container } = render(<Icon icon={Home} size="xl" />);
    expect(container.querySelector("svg")).toHaveClass("h-8");
    expect(container.querySelector("svg")).toHaveClass("w-8");
  });

  it("applies color classes", () => {
    const { container } = render(<Icon icon={Home} color="primary" />);
    expect(container.querySelector("svg")).toHaveClass("text-primary");
  });

  it("renders nothing when no icon source is provided", () => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("Pointr Maps - Express wayfinding glyphs", () => {
  // Solid shapes on the 24 grid in the current colour: a stroke width means
  // nothing to them, so the stroke props every icon takes are accepted and
  // ignored (createFilledIcon).
  it("draw filled in the text colour and ignore the stroke props", () => {
    // A stroke width that reached the svg renders as stroke-width; an
    // absoluteStrokeWidth that reached it makes React warn about a boolean
    // on a DOM attribute, so any console error fails the test. React warns
    // once per attribute in a file: keep this the file's first render that
    // passes absoluteStrokeWidth to a filled glyph.
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { container } = render(
        <kozmosIcons.ElevatorUp strokeWidth={5} absoluteStrokeWidth />,
      );
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg.getAttribute("width")).toBe("24");
      expect(svg.getAttribute("fill")).toBe("currentColor");
      expect(svg.getAttribute("stroke")).toBeNull();
      expect(svg.getAttribute("stroke-width")).toBeNull();
      expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });

  it("reach Icon through its icon prop, which hides them from assistive technology", () => {
    const { container } = render(<Icon icon={kozmosIcons.HardLeft} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.getAttribute("fill")).toBe("currentColor");
  });
});

// The map status pill's marks (decision 39): No Bluetooth's outline by its
// Kozmos name, and Walking improves accuracy's figure, which the icon library
// does not draw.
describe("the map status pill's marks", () => {
  it("names bluetooth-off, and draws it as Pointr's outline", () => {
    expect(kozmosIconNames).toContain("bluetooth-off");
    const { container } = render(<Icon name="bluetooth-off" />);
    expect(container.querySelector("path")?.getAttribute("d")).toBe(
      "M6 17L12 12V22L17.4398 17.4668M12 7V2L18 7L15.0817 9.43194M21 21L3 3",
    );
  });

  it("draws the SDK's walking figure solid, in the text's colour, 20 of 24 tall", () => {
    expect(Object.keys(kozmosIcons)).toContain("Walking");
    const Walking = (
      kozmosIcons as unknown as Record<string, ComponentType<{ size?: number }>>
    ).Walking;
    const svg = render(<Walking />).container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
    // The viewBox squares the figure's own box, 19.92 by 25.667 as Chromium
    // measures it on the SDK's canvas, so its height spans 20 of 24.
    const [, , width, height] = (svg?.getAttribute("viewBox") ?? "")
      .split(" ")
      .map(Number);
    expect(width).toBe(height);
    expect(25.667 / height).toBeCloseTo(20 / 24, 3);
  });
});
