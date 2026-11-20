---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

A travel time says what it includes (GAP-047, decision 209): "Includes security (about 8 min)" on an after-security board comes from the estimate, where it was hand-written.

- **The contract.** `TravelEstimatePresentation.breakdown` is new and optional: a list of `TravelEstimatePartPresentation`, each a `kind` (`TravelEstimatePartKind`: `"walking"`, `"securityQueue"`, `"liftWait"`, or `"other"` for a part Kozmos has no name for), its `durationSeconds`, and its `label`, already localized with the time in it. The cards draw one line from it: the parts' labels in order, joined by " · ", leaving out empty ones; nothing when no part has words. The contracts gain no runtime export. SwiftUI and Compose have the same shapes (`KozmosTravelEstimatePartPresentation`, `KozmosTravelEstimatePartKind`, and the estimate's `breakdownLabel`, which gives that line), compared by `contracts:parity:check`.
- **POIResultCard** draws the line under the travel time, small, in the secondary text colour, at the row's end and wrapping within 128px, and it is part of the row's words after the time.
- **POIDetailPanel** draws it under its action strip when Navigate carries the estimate, in the card's muted colour (the new owned rule `.kozmos-poi-estimate-breakdown`). Navigate's accessible name says it after its time and distance, and the line is hidden from assistive technology so it is heard once.

Without a breakdown, or with one whose parts have no words, both cards draw and say exactly what they did before.
