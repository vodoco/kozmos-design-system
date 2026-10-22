---
"@kozmos-ds/react": patch
---

POIDetailPanel falls back to an item's `iconName` icon when its `iconUrl` is unsafe or fails to load, as iOS and Android do (GAP-178, the owner's rule): a service, a group's item and a tag draw the glyph their name draws, and a summary fact its kind's glyph, where they drew no icon at all. With no name Kozmos draws, the label still stands alone. A safe asset that loads draws as before, and root-relative URLs are still accepted on the web.
