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
    // Solid in the fill, the number inked for it, the head's dot hidden.
    expect(marker).toHaveClass("fill-current", "[&_circle]:hidden");
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

  it("inks an untinted pin's number for its solid marker, and dims only when disabled", () => {
    const { rerender } = render(
      <LocationPin label="Result 1" number={1} variant="primary" />,
    );
    let marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("text-primary", "fill-current");
    expect(screen.getByText("1")).toHaveClass("text-primary-foreground");
    rerender(<LocationPin disabled label="Result 1" number={1} />);
    expect(screen.getByRole("img")).toHaveClass("opacity-50");
    marker = screen.getByRole("img").querySelector("svg") as SVGElement;
    expect(marker).toHaveClass("fill-current");
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
