---
"@kozmos-ds/react": minor
---

`BottomNavigation` labels are now 11px on 14px lines, wrapping to at most two lines. It keeps its own items rather than reusing the rail's redesigned side-menu items: `compact` remains the default, with a 64px minimum item height and 6px padding; `default` uses a 72px minimum and 8px padding.

This is a visible typography change for bottom navigation. Rail sizing and selection follow the separate side-menu change in this release; the intermediate 72px/64px rail-tile design does not ship.
