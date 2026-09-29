---
"@kozmos-ds/react": minor
---

`FloorSelector` gains `variant="collapsible"`, the SDK's level switcher for a control parked in a corner of a map (row 79, GAP-080), as iOS and Android have it. At rest it is one `MapControlButton` showing the current level's short label. Activated, it grows into a column of every level over itself in a `Popover`, in the supplied order: pass floors top-floor-first. The current level is outlined in the theme's primary and a closed level muted; the tile says `aria-expanded`. A choice, Escape or a press outside closes the column, and focus goes back to the tile, which is named by the level now shown, unless the press put focus on another control. The column's level counts sit at their bottom corner.

It also gains `userFloor`, the level the visitor is on by the same id as `selectedFloor`, and `userFloorLabel` (default "your level"). The switcher marks that level with a dot: on the closed tile while it shows that level, and on that level in the open column. It is said with the level's name, "Level 1, your level". Only the switcher draws it; the other variants take the props and ignore them.

Migration: exhaustive switches over React's floor-selector variant union or Android's `KozmosFloorSelectorVariant` must handle the added `collapsible`/`Collapsible` case. The existing variants remain supported.
