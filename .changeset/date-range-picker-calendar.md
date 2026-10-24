---
"@kozmos-ds/react": minor
---

`DateRangePicker` opens Kozmos's range `Calendar` (decisions 104 and 105), drawn as Figma's Open variant. Each field keeps the browser's segmented typing, and the value API is unchanged: `value`, `defaultValue`, `onValueChange` and `onRangeChange` on `{ start, end }` strings.

- **One panel for the range.** A button at each field's end, as tall as the field, opens one modal Popover under both fields: two months 12 apart where the window has room, one where it has not (`months` picks), on that field's day. Alt+Down Arrow and F4 in either field open it too, where Chromium would open its own picker. The first day chosen starts a range and clears the end; the days under the pointer or the focus show where it would end; the second closes it with both fields filled, in order. Escape closes it with nothing changed; focus returns to the button it opened from.
- **Where it applies**, as DatePicker's: only where the browser's own picker button can give way, read from the engine's CSS (Chromium, Edge, Safari). In Firefox 146 both fields stay the browser's, untouched, as before.
- **One label for the range (GAP-051).** `hideFieldLabels` reads the start and end labels to a screen reader and shows none, so the range's `label` names it once, for a one-line filter bar.
- **New props**, all optional: `open`, `defaultOpen`, `onOpenChange`, `months`, `chooseDatesLabel` (`"Choose dates"`, each button described by its field's label), `hideFieldLabels`, and for the calendar `previousMonthLabel`, `nextMonthLabel`, `locale`, `isDateUnavailable` and `today`. `min` and `max` bound its days.
- **Kozmos's fields are labelled beside their input**, not around it (a button cannot sit inside a `<label>`); the labels, their names and the layout are as before.
