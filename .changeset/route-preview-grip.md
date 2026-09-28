---
"@kozmos-ds/react": patch
---

`RoutePreviewPanel` keeps the grip's clearance at the top of `AdaptiveMapShell`'s panel, as the category browser and the details card do (decision 14). As the panel's content, its destination row tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Under a sheet's grip and in a side panel, "To" sat 33px from the panel's top and 17px from its side; it now sits 21px down under a grip and 17px down in a side panel, as it already did in a single-detent sheet. The options under the row keep their 16px, and on its own it is unchanged.

Placed under a row of your own inside the panel, the preview is not at the panel's top: set both custom properties to `0px` on it, or move that row into `panelHeader`.
