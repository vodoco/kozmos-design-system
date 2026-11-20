import type { TravelEstimatePresentation } from "@kozmos-ds/product-contracts";

// Not in ../utils.ts: that module is `cn`'s, which src/recipes re-exports, and
// recipes import nothing but class-variance-authority, clsx and tailwind-merge
// (recipes.framework-free.test.ts), types included, because Vue's build copies
// them.

/**
 * What a travel time includes, as POIResultCard and POIDetailPanel draw and
 * say it (GAP-047): each part's label, in order, joined by " · ", leaving
 * out empty ones. Undefined when no part has words, and then nothing is
 * drawn. SwiftUI's and Compose's estimates have the same rule as
 * `breakdownLabel`. Internal: the contracts' runtime API stays the
 * travel-time rule alone.
 */
export function travelEstimateBreakdownLabel(
  estimate: Pick<TravelEstimatePresentation, "breakdown"> | undefined,
): string | undefined {
  const labels = (estimate?.breakdown ?? [])
    .map((part) => part.label)
    .filter(Boolean);
  return labels.length ? labels.join(" · ") : undefined;
}
