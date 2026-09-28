import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteOptionCard } from "./RouteOptionCard";

const option = {
  id: "quickest",
  label: "Quickest",
  durationSeconds: 240,
  durationLabel: "4 min",
  distanceMetres: 150,
  distanceLabel: "150 m",
  preference: "quickest" as const,
  selected: true,
  available: true,
};

describe("RouteOptionCard", () => {
  it("exposes selected state and emits the stable route ID", () => {
    const onSelect = vi.fn();
    render(<RouteOptionCard onSelect={onSelect} option={option} />);
    const button = screen.getByRole("button", { name: /Quickest/ });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith("quickest");
  });

  it("keeps unavailable routes readable but disabled", () => {
    render(
      <RouteOptionCard
        onSelect={() => undefined}
        option={{
          ...option,
          available: false,
          selected: false,
          warning: "This route is temporarily unavailable.",
        }}
      />,
    );
    expect(screen.getByRole("button", { name: /Quickest/ })).toBeDisabled();
    expect(
      screen.getByText("This route is temporarily unavailable."),
    ).toBeVisible();
  });

  it("paints its fill, and the chosen option's tint, through the owned class", () => {
    // The chosen option's 5% tint was `bg-primary/5`, over nothing: on a
    // glass sheet the map showed through it while the others stood opaque.
    // The owned class paints the background colour, and the tint on it;
    // a `bg-*` utility beside it would outrank it (measured on glass in
    // check-adaptive-edge-cases.mjs).
    for (const selected of [true, false]) {
      const { unmount } = render(
        <RouteOptionCard
          option={{ ...option, selected }}
          onSelect={() => undefined}
        />,
      );
      const card = screen.getByRole("button", { name: /Quickest/ });
      expect(card.classList.contains("kozmos-route-option")).toBe(true);
      expect(card.className).not.toMatch(/(^|\s)bg-/);
      unmount();
    }
  });
});
