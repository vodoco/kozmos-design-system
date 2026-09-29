import { fireEvent, render, screen } from "@testing-library/react";
import { LocationPin } from "./LocationPin";
import { describe, expect, it, vi } from "vitest";

describe("LocationPin", () => {
  it("renders a labelled non-interactive marker", () => {
    render(<LocationPin label="Baskin-Robbins" />);
    expect(
      screen.getByRole("img", { name: "Baskin-Robbins" }),
    ).toBeInTheDocument();
  });

  it("supports keyboard activation when interactive", () => {
    const onClick = vi.fn();
    render(<LocationPin label="Open Burger King" onClick={onClick} />);

    const pin = screen.getByRole("button", { name: "Open Burger King" });
    fireEvent.keyDown(pin, { key: "Enter" });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("links a numbered selected pin to its result", () => {
    render(
      <LocationPin
        label="Result 3, Burger King, selected"
        number={3}
        resultId="poi-result-burger-king"
        selected
      />,
    );

    const pin = screen.getByRole("img", {
      name: "Result 3, Burger King, selected",
    });
    expect(pin).toHaveAttribute("aria-controls", "poi-result-burger-king");
    expect(pin).toHaveAttribute("aria-current", "location");
    expect(pin).toHaveTextContent("3");
  });

  it("keeps disabled interactive pins out of the tab order", () => {
    const onClick = vi.fn();
    render(
      <LocationPin disabled label="Unavailable result" onClick={onClick} />,
    );

    const pin = screen.getByRole("button", { name: "Unavailable result" });
    expect(pin).toHaveAttribute("aria-disabled", "true");
    expect(pin).not.toHaveAttribute("tabindex");
    fireEvent.click(pin);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("takes a tint for the marker; a featured pin keeps the alert colour", () => {
    const { rerender } = render(
      <LocationPin
        label="Dining"
        number={3}
        selected
        tint={{
          accent: "var(--semantics-category-accent-red)",
          fill: "var(--semantics-category-fill-red)",
          onFill: "var(--semantics-category-on-fill-red)",
        }}
      />,
    );
    const marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker.style.getPropertyValue("color")).toBe(
      "var(--semantics-category-fill-red)",
    );
    expect(
      (screen.getByText("3") as HTMLElement).style.getPropertyValue("color"),
    ).toBe("var(--semantics-category-on-fill-red)");
    // Selected: solid in the fill, the number inked for it.
    expect(marker).toHaveClass("fill-current");
    expect(marker.style.getPropertyValue("fill")).toBe("");
    rerender(
      <LocationPin
        featured
        label="Dining"
        tint={{
          accent: "var(--semantics-category-accent-red)",
          fill: "var(--semantics-category-fill-red)",
          onFill: "var(--semantics-category-on-fill-red)",
        }}
      />,
    );
    expect(
      (
        screen.getByRole("img").querySelector("svg") as SVGElement
      ).style.getPropertyValue("color"),
    ).toBe("");
  });

  it("inverts off the floor: a hollow marker, the number in the foreground, not dimmed", () => {
    render(
      <LocationPin
        label="Gates, on another floor"
        number={4}
        offFloor
        tint={{
          accent: "var(--semantics-category-accent-yellow)",
          fill: "var(--semantics-category-fill-yellow)",
          onFill: "var(--semantics-category-on-fill-yellow)",
        }}
      />,
    );
    const pin = screen.getByRole("img", { name: "Gates, on another floor" });
    expect(pin).toHaveAttribute("data-off-floor", "true");
    // The yellow fill on white read 1.92:1 as the number's colour; the
    // foreground reads 21 (Olcay, 2026-09-21). The state is the shape.
    expect(pin).not.toHaveClass("opacity-50");
    const marker = pin.querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("fill-background");
    expect(marker).not.toHaveClass("fill-current");
    expect(marker.style.getPropertyValue("color")).toBe(
      "var(--semantics-category-fill-yellow)",
    );
    const number = screen.getByText("4") as HTMLElement;
    expect(number).toHaveClass("text-foreground");
    expect(number.style.getPropertyValue("color")).toBe("");
  });

  it("inks a selected pin's number for its solid marker, and dims only when disabled", () => {
    const { rerender } = render(
      <LocationPin label="Result 1" number={1} selected variant="primary" />,
    );
    let marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("text-primary", "fill-current");
    expect(screen.getByText("1")).toHaveClass("text-primary-foreground");
    rerender(<LocationPin disabled label="Result 1" number={1} selected />);
    expect(screen.getByRole("img")).toHaveClass("opacity-50");
    marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("fill-current");
  });

  // Decision 55 (Olcay, 2026-09-29): the map pin pairs with the result card's
  // number tab. At rest a numbered pin is quiet — the surface, a ring and a
  // number in its colour, as the SDK's map draws its unselected results —
  // and only the selected one is filled, with its ink on the number.
  it("draws a numbered pin at rest quiet, and fills it only when selected", () => {
    const { rerender } = render(<LocationPin label="Result 2" number={2} />);
    let marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    // The surface inside, the ring in the primary colour (the stroke is
    // currentColor), the number in the same colour.
    expect(marker).toHaveClass("fill-background", "text-primary");
    expect(marker).not.toHaveClass("fill-current");
    expect(screen.getByText("2")).toHaveClass("text-primary");
    expect(screen.getByText("2")).not.toHaveClass("text-primary-foreground");
    // A quiet pin is on this floor: its ring is solid.
    expect(marker.className.baseVal).not.toMatch(/stroke-dasharray/);

    rerender(<LocationPin label="Result 2" number={2} selected />);
    marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("fill-current", "text-primary");
    expect(marker).not.toHaveClass("fill-background");
    expect(screen.getByText("2")).toHaveClass("text-primary-foreground");
    // Selection still grows the pin, so it is never told by colour alone.
    expect(screen.getByRole("img")).toHaveClass("scale-110");
  });

  it("keeps every variant's colour in a quiet pin's ring and number, as ink that reads on the surface", () => {
    const { rerender } = render(
      <LocationPin label="Result 1" number={1} variant="default" />,
    );
    const ink = (variant: "default" | "primary" | "secondary" | "accent") => {
      rerender(<LocationPin label="Result 1" number={1} variant={variant} />);
      const marker = screen.getByRole("img").querySelector("svg") as SVGElement;
      const number = screen.getByText("1");
      return { marker, number };
    };
    for (const [variant, colour] of [
      ["default", "text-foreground"],
      ["primary", "text-primary"],
      // Secondary's own colour is a surface grey (background/200), 1.6:1 on
      // the surface: as a ring or a number it takes the muted foreground,
      // the grey native's secondary pin is already drawn in.
      ["secondary", "text-muted-foreground"],
      ["accent", "text-accent"],
    ] as const) {
      const { marker, number } = ink(variant);
      expect(marker, variant).toHaveClass("fill-background", colour);
      expect(number, variant).toHaveClass(colour);
    }
    // Filled, secondary keeps its own grey and the ink made for it.
    rerender(
      <LocationPin label="Result 1" number={1} selected variant="secondary" />,
    );
    expect(screen.getByRole("img").querySelector("svg")).toHaveClass(
      "text-secondary",
      "fill-current",
    );
    expect(screen.getByText("1")).toHaveClass("text-secondary-foreground");
  });

  it("rings a tinted pin at rest in the category's fill, with the number in the foreground", () => {
    const red = {
      accent: "var(--semantics-category-accent-red)",
      fill: "var(--semantics-category-fill-red)",
      onFill: "var(--semantics-category-on-fill-red)",
    };
    render(<LocationPin label="Dining" number={3} tint={red} />);
    const marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("fill-background");
    expect(marker.style.getPropertyValue("color")).toBe(
      "var(--semantics-category-fill-red)",
    );
    // Six of the eight fills fail 4.5:1 as text on the surface (yellow reads
    // 1.92:1), the reason an off-floor pin's number is already in the
    // foreground.
    const number = screen.getByText("3") as HTMLElement;
    expect(number).toHaveClass("text-foreground");
    expect(number.style.getPropertyValue("color")).toBe("");
  });

  it("keeps a featured pin, a logo pin and a pin with no number filled at rest", () => {
    const { rerender } = render(
      <LocationPin featured label="Burger King" number={2} />,
    );
    const marker = () =>
      screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker()).toHaveClass("fill-current");
    rerender(
      <LocationPin
        label="Burger King"
        markerContent={<span data-testid="logo">BK</span>}
        number={2}
      />,
    );
    expect(marker()).toHaveClass("fill-current");
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    rerender(<LocationPin label="Burger King" />);
    expect(marker()).toHaveClass("fill-current");
    // And the quiet pin is the one that changed.
    rerender(<LocationPin label="Burger King" number={2} />);
    expect(marker()).toHaveClass("fill-background");
  });

  it("dashes an off-floor pin's ring, so it is never taken for a quiet pin at rest", () => {
    const { rerender } = render(
      <LocationPin label="Gates, on another floor" number={4} offFloor />,
    );
    let marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    // Still the outlined marker: the surface inside, the ring in the colour,
    // the number in the foreground.
    expect(marker).toHaveClass("fill-background", "text-primary");
    expect(screen.getByText("4")).toHaveClass("text-foreground");
    // The ring is dashed: the shape tells the floor, in forced colours and to
    // any colour vision, where a quiet pin's ring is solid.
    expect(marker).toHaveClass("[&>path:last-child]:[stroke-dasharray:2_4.5]");
    // Selected off the floor: larger, still outlined and dashed, never filled.
    rerender(
      <LocationPin
        label="Gates, on another floor"
        number={4}
        offFloor
        selected
      />,
    );
    marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass(
      "fill-background",
      "[&>path:last-child]:[stroke-dasharray:2_4.5]",
    );
    expect(screen.getByRole("img")).toHaveClass("scale-110");
    // A pin with no number off the floor is dashed too: one look for the state.
    rerender(<LocationPin label="Gates, on another floor" offFloor />);
    marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("[&>path:last-child]:[stroke-dasharray:2_4.5]");
  });

  it("anchors to a physical origin, so a right-to-left map does not shift every pin", () => {
    // GAP-076. The pin is absolute with a physical -50% translate and had no
    // inset, so it fell back to its static position: the container's left edge
    // in LTR — which the translate expects — and its RIGHT edge in Arabic, one
    // pin-width away from the place it marks.
    const { container } = render(
      <LocationPin label="Harbour Coffee Co." onClick={() => undefined} />,
    );
    const pin = container.firstElementChild as HTMLElement;
    expect(pin).toHaveClass("absolute", "left-0", "top-0");
    // Physical, not logical: `start-0` would flip the origin in RTL while the
    // translate beside it stayed physical — the same bug with more steps.
    expect(pin.className).not.toMatch(/\bstart-0\b/);
    expect(pin).toHaveClass("-translate-x-1/2", "-translate-y-full");
  });
});
