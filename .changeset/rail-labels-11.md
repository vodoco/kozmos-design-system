---
"@kozmos-ds/react": minor
---

Every rail tile's label is now 11px on a 14px line, up to two lines, in both densities. `NavigationItem` with `placement="rail"` drew its label at 12px (`text-xs`) on a 16px line, so a label that took two lines made the tile 76px tall instead of 72; it now stays 72px (a compact tile is 64px, and 68px with two lines). Tiles stay 72px wide, 64px compact. `BottomNavigation` reuses the rail tile, so its labels are 11px too.

A web dashboard's rail widens its tiles to 96px with `className="w-24"`, as `BottomNavigation` widens its own: no new prop. A 72px tile leaves its label 56px, and no legible size fits a word as long as "Configuration" in that; at 96px, labels such as "SDK Configuration" and "UI Translation Manager" take two lines at most.

This is a visible change: screenshot tests of a rail or a bottom navigation will see the smaller labels.
