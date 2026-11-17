---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

A mixed state on Switch and ToggleButton (decisions 188 to 190), as Input, NumberInput, Select and Combobox have (GAP-153).

- **Switch takes `mixed`, `mixedLabel`, `onResetMixed` and `resetMixedLabel` (decision 189).** A switch that stands for several features whose settings differ is drawn neither on nor off: the track filled with the theme fill as when on, no thumb, and a short white dash in its middle, Checkbox's minus at 16 in the theme foreground (white on the theme fill, 5.6:1); in error the destructive fill, as a checked switch's. `role="switch"` has no mixed state, so it is off to a screen reader with "Multiple values" (`mixedLabel`) as its description, and `showStateLabel` draws those words beside the track. A click turns it on: `onCheckedChange` gets `true`, and the product clears `mixed`. `onResetMixed` draws "Reset to multiple values" (`resetMixedLabel`) under the switch once it is no longer mixed, never while it is disabled; pressed, focus returns to the switch and the product sets `mixed` again.
- **ToggleButton takes `mixed`, `onResetMixed` and `resetMixedLabel` (decision 190).** A mixed toggle is `aria-pressed="mixed"`, which ARIA gives a toggle button, drawn as a dashed edge in the theme fill on the muted fill under the page's ink, in either variant, with Checkbox's minus before its children. A press turns it pressed: `onPressedChange` gets `true`, and the product clears `mixed`. `onResetMixed` draws the reset after the toggle, in the same parent, once it is no longer mixed, never while it is disabled; pressed, focus returns to the toggle.
- **Both always give Radix their state.** An uncontrolled Switch or ToggleButton keeps its state itself, as Switch already did for its state words, so a click on a mixed one turns it on whatever it started from, and it stays on once it is no longer mixed. The looks of every other state are unchanged.
- **Styles:** `.kozmos-toggle-button[aria-pressed="mixed"]` draws the mixed toggle's dashed theme edge and muted fill, holding over the outline variant and its hover.
