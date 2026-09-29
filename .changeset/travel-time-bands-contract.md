---
"@kozmos-ds/product-contracts": minor
---

A result list can show a walk as a band (decision 50, GAP-088). `TravelEstimatePresentation` gains `band`, a `TravelTimeBand`: `"nearby"`, `"oneToTwoMinutes"`, `"twoToFiveMinutes"`, `"fiveToTenMinutes"` or `"moreThanTenMinutes"`. The product passes the walking time it already has, and `travelTimeBand(durationSeconds)` gives its band, so every product draws the edges in the same place. `travelTimeTone(band)` says the colour it is drawn in: `"success"` for Nearby, `"neutral"` for the rest. These two functions are the package's first runtime code; everything else is still types.

Nearby is under a minute. Every band after it keeps its upper edge, so a place exactly 2, 5 or 10 minutes away reads 1–2, 2–5 or 5–10 min, and one a second further reads the next band; past the first minute that is the walk rounded up to whole minutes. A length below zero, or one that is not finite, has no band. The estimate keeps `durationLabel`, the exact minutes, for the details card.

iOS has the same rule as `KozmosTravelTimeBand(durationSeconds:)` and Android as `KozmosTravelTimeBand.forDuration`, with a band's `tone` and the same wire values; the three are tested against one table of cases. It releases with `@kozmos-ds/react`, which draws the band: react pins its siblings exactly, so the two go out together.
