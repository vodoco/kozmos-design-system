---
"@kozmos-ds/react": minor
---

`POIResultList`, `POIResultGroup` and `POIResultCard` take an optional `idPrefix`, and `getPOIResultDomId` an optional second argument, so a page can show the same place in two lists without drawing its ids twice. A card's id came from the place's id alone, and its action row's and unavailable note's from that, so a second list's `aria-controls` and `aria-describedby` resolved into the first list. With `idPrefix`, every id in the list becomes `getPOIResultDomId(poiId, idPrefix)` and its references stay inside it; a map pin names the intended card with the same call, through `LocationPin`'s `resultId`. Without it the ids are exactly what they were, and a card's own `id` still wins.

Give each independent list a distinct, stable prefix when the same POI can appear more than once on a page. Keep that prefix consistent between server rendering and hydration, and use the matching prefix for a pin's result reference; do not change the POI's business identifier.
