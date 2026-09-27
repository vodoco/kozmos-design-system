---
"@kozmos-ds/react": minor
---

`AdaptiveMapShell` now tells its panel content how much space it leaves above it, through two custom properties on that content (GAP-083):

- `--kozmos-panel-inset-top`: the grip's row on a sheet, `1rem` in a side panel, `0px` with no grip or under a `panelHeader`;
- `--kozmos-panel-clearance-top`: how far the first control must still sit below that — 4px under a grip, which keeps the grip's target clear (WCAG 2.5.8); `0px` otherwise.

A `POIDetailPanel` hosted there with `presentation="sheet"` pads its header's top to `max(clearance, 16px − inset)` instead of adding 16px to what the panel leaves. Its close button used to sit 33px from the panel's top and 17px from its side; it now sits 17px down in a side panel and 21px down under a sheet's grip. The bordered `panel` and `inline` presentations keep their own padding. Host the card with `presentation="sheet"` in the shell.
