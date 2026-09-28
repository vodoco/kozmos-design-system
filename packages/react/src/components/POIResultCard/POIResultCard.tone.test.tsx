import { render, screen } from "@testing-library/react";
import type {
  POIPresentation,
  POIResultPresentation,
  TravelTimeBand,
} from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard } from "./POIResultCard";

// The card draws the tone the contract's rule gives, and holds no rule of its
// own (decision 50). Here the contract is made to say 2–5 min is the success
// tone and Nearby is not: a card that kept a copy of the rule would still
// paint Nearby.
vi.mock("@kozmos-ds/product-contracts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@kozmos-ds/product-contracts")>()),
  travelTimeTone: (band: TravelTimeBand) =>
    band === "twoToFiveMinutes" ? "success" : "neutral",
}));

const poi: POIPresentation = {
  id: "gate-12",
  name: "Gate 12",
  floorLabel: "Level 1",
  media: [],
  actions: [],
};

const result = (band: TravelTimeBand): POIResultPresentation => ({
  poiId: poi.id,
  resultIndex: 0,
  selected: false,
  featured: false,
  travelEstimate: { durationSeconds: 45, durationLabel: "1 min", band },
});

describe("POIResultCard's travel-time tone", () => {
  it("is the contract's rule, not a copy of it", () => {
    const { rerender } = render(
      <POIResultCard
        poi={poi}
        result={result("twoToFiveMinutes")}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("2–5 min")).toHaveClass(
      "kozmos-travel-time-success",
    );
    rerender(
      <POIResultCard poi={poi} result={result("nearby")} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Nearby")).toHaveClass("text-foreground");
  });
});
