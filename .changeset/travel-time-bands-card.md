---
"@kozmos-ds/react": minor
---

`POIResultCard` draws a walk as a band when the product sets `result.travelEstimate.band` (decision 50, GAP-088): **Nearby**, **1–2 min**, **2–5 min**, **5–10 min** or **More than 10 min**, in place of the exact minutes. Nearby is drawn in the success colour, the success emotion's Text role, which reads at 7.1:1 on the card in the light theme and 17.7:1 in the dark; the other bands keep the card's text colour. The word itself says Nearby, so the tone is never carried by colour alone. The colour is an owned rule, so it holds in a browser without `@scope`.

The words are English until the product passes its own as `travelTimeBandLabels`, for one band or all five; `POIResultList` and `POIResultGroup` take the same prop and hand it to every result. A result with no band shows `durationLabel` as before, and `POIDetailPanel` keeps the exact minutes from the same estimate.
