import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManoeuvreCard, manoeuvreDescription } from "./ManoeuvreCard";

describe("ManoeuvreCard", () => {
  it("reads the instruction then the detail, and nothing for an absent detail", () => {
    expect(manoeuvreDescription("Turn left", "58 m · 1 min")).toBe(
      "Turn left, 58 m · 1 min",
    );
    expect(manoeuvreDescription("Turn left")).toBe("Turn left");
    expect(manoeuvreDescription("Turn left", "")).toBe("Turn left");
  });

  it("closed, is the manoeuvre as one button that opens the itinerary, with the grab bar silent", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m · 1 min"
        expanded={false}
        onToggle={onToggle}
      >
        <p>FROM Dunkin</p>
      </ManoeuvreCard>,
    );

    expect(
      screen.getByRole("region", { name: "Current manoeuvre" }),
    ).toBeInTheDocument();
    const manoeuvre = screen.getByRole("button", {
      name: "Turn left, 58 m · 1 min",
    });
    expect(manoeuvre).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("FROM Dunkin")).not.toBeInTheDocument();
    // The instruction row already offers the way in; the bar says nothing.
    const bar = container.querySelector('[aria-label="Show itinerary"]');
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveAttribute("tabindex", "-1");

    fireEvent.click(manoeuvre);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("open, shows the itinerary instead of the manoeuvre and the grab bar closes it", () => {
    const onToggle = vi.fn();
    render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m"
        expanded
        onToggle={onToggle}
        maxItineraryHeight={240}
      >
        <p>FROM Dunkin</p>
      </ManoeuvreCard>,
    );

    // No name of its own: the itinerary inside is the named thing.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByText("FROM Dunkin")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Turn left/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("FROM Dunkin").parentElement).toHaveStyle({
      maxHeight: "240px",
    });

    const bar = screen.getByRole("button", { name: "Hide itinerary" });
    expect(bar).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(bar);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("is solid by default and glass on request", () => {
    const { rerender } = render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        expanded={false}
        onToggle={() => {}}
      />,
    );
    const card = screen.getByRole("region", { name: "Current manoeuvre" });
    expect(card).toHaveClass("kozmos-reset", "kozmos-surface-solid");
    rerender(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        expanded={false}
        onToggle={() => {}}
        surface="glass"
      />,
    );
    expect(card).toHaveClass("kozmos-surface-glass");
    expect(card).not.toHaveClass("kozmos-surface-solid");
  });

  it("takes its own labels", () => {
    render(
      <ManoeuvreCard
        type="right"
        instruction="Rechts"
        expanded={false}
        onToggle={() => {}}
        manoeuvreLabel="Aktuelles Manöver"
        expandLabel="Route zeigen"
      >
        <p />
      </ManoeuvreCard>,
    );
    expect(
      screen.getByRole("region", { name: "Aktuelles Manöver" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechts" })).toBeInTheDocument();
  });

  it("draws its detail muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: text that is muted elsewhere
    // takes the foreground colour on glass (owned CSS reads the glass
    // surface's --kozmos-surface-muted-foreground; measured over a
    // saturated map in check-adaptive-edge-cases.mjs). A
    // `text-muted-foreground` beside the class would outrank it.
    render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m · 1 min"
        expanded={false}
        onToggle={() => undefined}
        surface="glass"
      />,
    );
    const detail = screen.getByText("58 m · 1 min");
    expect(detail.classList.contains("kozmos-muted-text")).toBe(true);
    expect(detail.className).not.toMatch(/\btext-muted-foreground\b/);
  });
});
