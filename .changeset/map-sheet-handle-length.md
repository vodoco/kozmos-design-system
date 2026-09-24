---
"@kozmos/react": patch
---

The map sheet's drag handle is a 16px row again, with a 40 × 4 grip (GAP-38).
Its three declarations read layout tokens straight — `height:
var(--primitives-layout-spacing-200)` — and those tokens are bare numbers
(`16`, `6`, `40`). A bare number is not a length, so every browser dropped all
three: the handle rendered 4px tall, the grip 0px wide, in every engine since
`AdaptiveMapShell` shipped. Each now converts with `calc(var(…) * 1px)`, the
conversion the owned blur and slide rules already make, and iOS's grabber row
and Android's `SheetHandle` already matched.

`pnpm tokens:unitless:check` is new and fails on any owned length that reads a
bare-number token without converting it.
