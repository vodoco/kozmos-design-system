import { fireEvent, render, screen } from "@testing-library/react";
import { LocationPin } from "./LocationPin";
import { describe, expect, it, vi } from "vitest";

// The SDK's map result markers (decision 71, GAP-120). Their shape, colours
// and anchors are owned CSS, read in a real browser by
// scripts/check-location-pin.mjs; these read what assistive technology meets
// and what a press does.

// A click with its own count and time, as a browser stamps them.
const pressAt = (detail: number, timeStamp: number) => {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    detail,
  });
  Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
};

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

  it("links a numbered selected result to its card", () => {
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

  it("draws a result as a pill with its number, or a dot without one", () => {
    const { container, rerender } = render(
      <LocationPin label="Result 12" number={12} />,
    );
    const pin = container.firstElementChild as HTMLElement;
    expect(pin).toHaveAttribute("data-kind", "result");
    expect(pin.querySelector(".kozmos-location-pin-pill")).toHaveTextContent(
      "12",
    );
    expect(pin.querySelector(".kozmos-location-pin-pointer")).not.toBeNull();
    expect(pin.querySelector(".kozmos-location-pin-pill-dot")).toBeNull();

    rerender(<LocationPin label="A result" />);
    expect(pin.querySelector(".kozmos-location-pin-pill-dot")).not.toBeNull();
    expect(pin.querySelector(".kozmos-location-pin-pill")).toHaveTextContent(
      "",
    );
  });

  it("draws a featured place as its logo in a tile, never its number, and says so (decision 81)", () => {
    const { container } = render(
      <LocationPin
        featured
        featuredLabel="Öne çıkan"
        label="Burger King"
        markerContent={
          <img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        }
        number={2}
      />,
    );
    const pin = screen.getByRole("img", { name: "Burger King, Öne çıkan" });
    expect(pin).toHaveAttribute("data-kind", "featured");
    expect(pin.querySelector(".kozmos-location-pin-tile img")).not.toBeNull();
    expect(pin.querySelector(".kozmos-location-pin-dot")).not.toBeNull();
    expect(container).not.toHaveTextContent("2");
  });

  it("draws a place on its own as the green pin, over featured and a number", () => {
    const { container } = render(
      <LocationPin featured label="Harbour Coffee Co." number={4} place />,
    );
    const pin = screen.getByRole("img", { name: "Harbour Coffee Co." });
    expect(pin).toHaveAttribute("data-kind", "place");
    expect(pin).toHaveAttribute("aria-current", "location");
    expect(pin.querySelector(".kozmos-location-pin-teardrop")).not.toBeNull();
    expect(pin.querySelector(".kozmos-location-pin-tile")).toBeNull();
    expect(container).not.toHaveTextContent("4");
  });

  it("takes no variant, size, tint or offFloor any more (decisions 79, 80)", () => {
    const removedProps: Record<string, unknown> = {
      offFloor: true,
      size: "lg",
      variant: "accent",
    };
    const { container } = render(
      // The removed props, as a caller on 0.11.0 still passes them: no longer
      // LocationPin's, they draw nothing of their own.
      <LocationPin label="Result 1" number={1} {...removedProps} />,
    );
    const pin = container.firstElementChild as HTMLElement;
    expect(pin).not.toHaveAttribute("data-off-floor");
    expect(pin).toHaveAttribute("data-kind", "result");
  });

  it("opens on a double tap: one press, then one open (decision 71)", () => {
    const onClick = vi.fn();
    const onOpen = vi.fn();
    render(
      <LocationPin
        label="Result 1"
        number={1}
        onClick={onClick}
        onOpen={onOpen}
      />,
    );
    const pin = screen.getByRole("button", { name: "Result 1" });
    fireEvent(pin, pressAt(1, 1_000));
    fireEvent(pin, pressAt(2, 1_200));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    // A quick third tap does nothing, as on SwiftUI and Compose.
    fireEvent(pin, pressAt(1, 1_300));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is a button with onOpen alone, and a keyboard press never opens", () => {
    const onOpen = vi.fn();
    render(<LocationPin label="Result 2" number={2} onOpen={onOpen} />);
    const pin = screen.getByRole("button", { name: "Result 2" });
    fireEvent.keyDown(pin, { key: "Enter" });
    fireEvent.keyDown(pin, { key: "Enter" });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("presses on every tap without onOpen, as before", () => {
    const onClick = vi.fn();
    render(<LocationPin label="Result 3" number={3} onClick={onClick} />);
    const pin = screen.getByRole("button", { name: "Result 3" });
    fireEvent(pin, pressAt(1, 1_000));
    fireEvent(pin, pressAt(2, 1_100));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
