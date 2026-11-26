---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A focus ring drawn with an offset gives its gap the canvas's colour token (`ring-offset-background`), where 17 class lists left it at Tailwind's written-in white, so in dark the ring drew a 2px white gap inside it (GAP-290). Affected: AISearchButton, BottomSheet's and Drawer's close buttons, CategoryTile, Chip and its actions, RouteOptionCard, SearchBar, Link, Notice's "more", Tag and owned CSS rules in the components, overlays and temporal fields sheets. Light is unchanged; in dark these focus rings' gaps are the canvas colour.
