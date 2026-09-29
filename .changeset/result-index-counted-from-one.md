---
"@kozmos-ds/product-contracts": patch
---

`POIResultPresentation.resultIndex` is documented: the result's number, counted from 1, which is the number its map marker shows. A numbered `POIResultList` draws it in the result's tab, and analytics reports it as the result's position. In a numbered list, number the results that are not featured 1, 2, 3 in pin order: a featured result's marker shows its logo, so its number is never drawn. `badge` says it is ignored in a numbered list too, where the number takes its place. The types are unchanged.
