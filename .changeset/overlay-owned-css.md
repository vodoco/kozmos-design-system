---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A Dialog's, a Drawer's and a BottomSheet's overlay and panel are owned CSS (`kozmos-modal-overlay`, `kozmos-dialog-content`, `kozmos-drawer-content` and its sides, `kozmos-bottom-sheet`), so they hold in a host where no `@scope` rule applies. There each overlay was drawn with scoped utilities alone: it had no place, no layer and no scrim, so it covered nothing, and its panel fell into the page's flow with no surface, its close a bare button with its name drawn beside it. Now the overlay covers the window (inline, its box) on layer 50 in the theme's scrim, and the panel sits above it where it is drawn, on the page's surface with the subtle edge, its close in its top end corner. Under `@scope` nothing changes: each owned rule weighs one class and restates the part's utilities, which win the tie on proximity, as a caller's own utilities still do.
