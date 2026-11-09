---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Search clears, NumberInput takes a unit, and Slider's readout stays (GAP-161, GAP-098, GAP-163; decision 132).

`Search` takes `clearable`, `clearLabel` and `onClear`. With `clearable`, a clear button sits at the field's end while the field holds text and is neither disabled nor read-only, drawn as Input's action is: as tall as the field, with no fill at rest and, hovered, a fill 4 in from its edges (decision 164). Pressing it, or Escape in a field that holds text, empties the field through its own `onChange` (so a controlled field's state follows), calls `onClear`, sends the `search_cleared` analytics event with no properties, and puts the focus back in the field. Escape in an empty field is left to what holds it. Inside a Dialog or a Popover, while the field has the focus and holds text, the first Escape clears it and the next closes the dialog; Escape elsewhere in the dialog closes it as before. `clearLabel` names the button in the page's language; it is "Clear search" by default. `clearable` is off by default, so no Search changes until a product asks for it.

`NumberInput` takes `unit` and `unitLabel`. The unit is drawn inside the field after the value, 12 in from its end, which is the left in a right-to-left page; the text keeps 4 clear of it at any length. It is never part of the value: `onValueChange` still sends a number. A screen reader hears it once, after the value, as `unitLabel` ("metres") when one is given and as written when not.

`Slider` takes `showValue`: the value as a readout at the slider's end, beside the track, at rest as well as while it moves, in tabular figures; a range shows its two ends, "20 – 80". `formatValue` words it. The readout is hidden from screen readers, and the thumb now says `formatValue`'s words in place of the bare number (`aria-valuetext`) whenever it returns a string or a number, for the readout and for `showValueTooltip`'s bubble alike. With `showValue`, a `className` sizes the row that holds the slider and its readout.

`@kozmos-ds/styles` carries the owned rules for the unit and the readout.
