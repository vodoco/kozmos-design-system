---
"@kozmos-ds/react": patch
---

Every part at the top of `AdaptiveMapShell`'s panel now keeps the grip's clearance, not only the panel header and the details card (decision 14).

- `BrowseCategoriesPanel`: as the panel's content, its first row (the search row, or the tiles when there is none) tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Its search field sat 33px from the panel's top and 17px from its side; it now sits 21px down under a sheet's grip and 17px down in a side panel or a single-detent sheet. The tiles under a search row keep their 16px, and on its own it is unchanged.
- `POIResultList`: under a grip it keeps the grip's 4px above its first result, which sat inside the grip's 24px target circle (WCAG 2.5.8). It adds nothing anywhere else.

The two custom properties describe the panel's top: a part placed under a row of your own should have both set to `0px`, or its row belongs in `panelHeader`.
