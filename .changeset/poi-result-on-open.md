---
"@kozmos-ds/react": minor
---

`POIResultList`, `POIResultGroup` and `POIResultCard` take `onOpen(poiId)` (decision 72, GAP-143). A double tap or double click on a result, selected or not, a group's member included, opens its details: `onOpen` is called once, and the second tap is not passed on as a second `onSelect`, so the first tap's selection stands. A second press counts when the browser counts it as one (`detail` 2, which follows the OS's double-click setting), or, for a touch browser that reports each tap as 1, within 300 ms. A keyboard press always selects; the action row's details action is the keyboard's way in. Without `onOpen`, every press selects, as before. It is reported as `poi_result_opened`.
