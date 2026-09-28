import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Itinerary, type ItineraryStep } from "./Itinerary";

const steps: ItineraryStep[] = [
  {
    id: "1",
    instruction: "Take Elevator down to First Floor",
    type: "straight",
  },
  {
    id: "2",
    instruction: "Take Corridor to Garage B",
    type: "straight",
    current: true,
  },
  { id: "3", instruction: "Destination", type: "destination" },
];

describe("Itinerary", () => {
  it("lists the origin, every step and the destination, in order", () => {
    render(
      <Itinerary
        origin="Dunkin'"
        steps={steps}
        destination="Airport Shuttles"
      />,
    );

    expect(
      screen.getByRole("region", { name: "Itinerary" }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "FromDunkin'",
      "Take Elevator down to First Floor",
      "Take Corridor to Garage B",
      "Destination",
      "ToAirport Shuttles",
    ]);
  });

  it("marks the current step alone, and none when there is none", () => {
    const { rerender } = render(
      <Itinerary origin="A" steps={steps} destination="B" />,
    );
    const current = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "step");
    expect(current.map((item) => item.textContent)).toEqual([
      "Take Corridor to Garage B",
    ]);

    rerender(
      <Itinerary
        origin="A"
        steps={steps.map((step) => ({ ...step, current: false }))}
        destination="B"
      />,
    );
    expect(
      screen
        .getAllByRole("listitem")
        .some((item) => item.hasAttribute("aria-current")),
    ).toBe(false);
  });

  it("takes its own endpoint labels", () => {
    render(
      <Itinerary
        origin="A"
        steps={[]}
        destination="B"
        originLabel="Von"
        destinationLabel="Nach"
        label="Wegbeschreibung"
      />,
    );
    expect(
      screen.getByRole("region", { name: "Wegbeschreibung" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Von")).toBeInTheDocument();
    expect(screen.getByText("Nach")).toBeInTheDocument();
  });

  it("draws its captions and its origin muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: inside a glass manoeuvre card,
    // text that is muted elsewhere takes the foreground colour (measured
    // over a saturated map in check-adaptive-edge-cases.mjs). A
    // `text-muted-foreground` beside the class would outrank it. The
    // destination is emphasised, in the foreground colour already.
    render(
      <Itinerary
        origin="Harbour Coffee Co."
        steps={steps}
        destination="Gate 12"
      />,
    );
    for (const text of ["From", "Harbour Coffee Co.", "To"]) {
      const node = screen.getByText(text);
      expect(node.classList.contains("kozmos-muted-text")).toBe(true);
      expect(node.className).not.toMatch(/\btext-muted-foreground\b/);
    }
    expect(screen.getByText("Gate 12").className).toMatch(
      /\btext-foreground\b/,
    );
  });
});
