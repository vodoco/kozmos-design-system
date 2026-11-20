import { describe, expect, it } from "vitest";
import type { TravelEstimatePresentation } from "@kozmos-ds/product-contracts";
import { travelEstimateBreakdownLabel } from "../utils/travel-estimate";

/**
 * GAP-047: a travel time says what it includes. The cards draw one line, the
 * parts' labels joined by " · ". The rule is React's own, not a contracts
 * export; SwiftUI's and Compose's `breakdownLabel` hold the same rule,
 * tested with the same cases.
 */
const estimate: TravelEstimatePresentation = {
  durationSeconds: 720,
  durationLabel: "12 min",
};

describe("travelEstimateBreakdownLabel", () => {
  it("is undefined with no breakdown, or an empty one", () => {
    expect(travelEstimateBreakdownLabel(undefined)).toBeUndefined();
    expect(travelEstimateBreakdownLabel(estimate)).toBeUndefined();
    expect(
      travelEstimateBreakdownLabel({ ...estimate, breakdown: [] }),
    ).toBeUndefined();
  });

  it("joins the parts' labels in order, leaving out empty ones", () => {
    expect(
      travelEstimateBreakdownLabel({
        ...estimate,
        breakdown: [
          { kind: "walking", durationSeconds: 240, label: "4 min walk" },
          { kind: "liftWait", durationSeconds: 60, label: "" },
          {
            kind: "securityQueue",
            durationSeconds: 480,
            label: "Includes security (about 8 min)",
          },
        ],
      }),
    ).toBe("4 min walk · Includes security (about 8 min)");
  });

  it("is undefined when no part has words", () => {
    expect(
      travelEstimateBreakdownLabel({
        ...estimate,
        breakdown: [{ kind: "other", durationSeconds: 60, label: "" }],
      }),
    ).toBeUndefined();
  });
});
