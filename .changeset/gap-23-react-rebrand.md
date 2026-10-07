---
"@kozmos-ds/react": minor
---

GAP-23: the stylesheet's token variables carry the tokens package's references, declared on each `ThemeProvider` root, so one override of `--primitives-colors-theme-500` in `tokens` re-brands every prominent fill: the filled Button, IconButton, FloatingActionButton, SplitButton, a filled MapControlButton, FloorSelector's selected level and CategoryField's count now follow it, as the Checkbox, Chip and Tag already did. With the ramp's other steps set, the filled Button's hover, focus and pressed and the outline, ghost and link Buttons' ink follow too. Every token computes the value it had, and `DesignConfigProvider`'s `shadow` option still reaches only its legacy `--shadow-*` aliases, not the elevation roles. No props change.

**What you'll see:** nothing without an override. With one on the provider, the Buttons change with the ramp; set it on the provider, not a descendant, since a reference resolves where it is declared.
