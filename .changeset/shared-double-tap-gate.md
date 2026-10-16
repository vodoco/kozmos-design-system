---
"@kozmos-ds/react": patch
---

POIResultCard's double tap and LocationPin's share one gate, so a result's card and its marker open alike: a second press within 300 ms of a touch tap, or a counted double click within 2 s, on the same target, with a quick third tap ignored. POIResultCard behaves as in 0.11.0.
