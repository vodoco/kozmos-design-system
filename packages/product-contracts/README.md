# @kozmos-ds/product-contracts

Platform-neutral presentation contracts for Kozmos map, POI, floor and routing
components: TypeScript types describing what a POI card, a result row or a
travel estimate shows, independently of how any platform draws it.

It also defines `MapLayoutRect`, `MapPanelPresentation`, `AdaptiveMapLayout`,
`MapOcclusion` and `AdaptiveMapLayoutSnapshot`. Rectangles are physical and
shell-local; collision padding is relative to the reported renderer bounds.
Units belong to the adapter boundary: CSS pixels on web, points or dp natively.
The React shell implements this geometry contract first; equivalent native
region-aware behavior is not yet implemented.

## Install

```sh
npm install @kozmos-ds/product-contracts
```

## Use

```ts
import type {
  POIPresentation,
  UserLocationState,
} from "@kozmos-ds/product-contracts";
```

Almost all of the package is types, so `import type` is all most of it needs.
Its one rule is how a result list shows a walk (decision 50): `travelTimeBand`
turns the walking time a product already has into the band the list draws, and
`travelTimeTone` says which colour a band is drawn in.

```ts
import {
  travelTimeBand,
  type TravelEstimatePresentation,
} from "@kozmos-ds/product-contracts";

export const walk: TravelEstimatePresentation = {
  durationSeconds: 45,
  // The details card keeps the exact minutes.
  durationLabel: "1 min",
  // "nearby": the result card reads Nearby, in the success colour.
  band: travelTimeBand(45),
};
```

Nearby is under a minute. Every band after it keeps its upper edge, so a place
exactly 2, 5 or 10 minutes away reads "1–2 min", "2–5 min" or "5–10 min", and
one a second further reads the next band; a length below zero, or one that is
not finite, has no band. SwiftUI (`KozmosTravelTimeBand(durationSeconds:)`) and
Compose (`KozmosTravelTimeBand.forDuration`) have the same rule, and all three
are tested against one table, `tests/travel-time-bands.txt`. The words are the
card's, in English until a product passes its own.

## Licence

MIT
