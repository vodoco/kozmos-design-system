---
"@kozmos-ds/react": minor
---

The rail takes the dashboard side menu's design. A `NavigationItem` with `placement="rail"` no longer draws a fixed 72px tile (64px compact): it fills the width of its rail, 96px, and grows with its label. It is padded 16px by 8px, with a 24px icon 6px above an 11px regular label on 14px lines that wraps to two lines, so an item is 76px tall, or 90px with two lines. At rest it is the muted foreground, with no fill. Selected, it is primary on the lightest theme tint (theme/0), with a 2px primary bar down its inline end (the right in LTR, the left in RTL), where it was primary on the grey muted fill. It is square, and its focus ring is drawn inside it. `density` still sizes top and side items; a rail item draws the same with `compact` as without it.

`Sidebar`'s `rail` variant is that 96px rail: it was 80px with 8px of inline padding, and its items now fill it. Its background is the surface (`bg-surface-0`, the same colour as before), and its 1px edge is at its inline end (`border-e`) in both variants, so a right-to-left sidebar draws it on the left.

`BottomNavigation` keeps its own items: it no longer renders `NavigationItem` rail tiles, so it does not take the rail's padding, width or selected bar. It preserves the icon-over-label layout, equal-width items and muted selected fill. Labels now use 11px text on 14px lines, as described in the separate typography change. Its items are no longer marked `data-placement="rail"`; they are `data-slot="bottom-navigation-item"`.

This is a visible change: screenshot tests of a rail or a sidebar rail will see it, and a product that sized rail tiles itself (`className="w-24"`) no longer needs to.
