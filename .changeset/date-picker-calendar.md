---
"@kozmos-ds/react": minor
---

`DatePicker` opens Kozmos's `Calendar` (decisions 104 and 105), drawn as Figma's Open variant. The field keeps the browser's segmented typing and its value API: `value`, `defaultValue` and `onChange` on a `YYYY-MM-DD` string, unchanged.

- **The button.** A button at the field's end, as tall as the field, opens the calendar in a modal Popover 6 under the field, 12 inside, on the field's day, else today; so do Alt+Down Arrow and F4 in the field, where Chromium would open its own picker. A day chosen there is typed into the field, so `onChange` and a form's change listeners hear it as typing; that or Escape closes it and returns focus to the button, as the WAI-ARIA date picker dialog does.
- **Where it applies.** Only where the browser's own picker button can give way, read from the engine's CSS, never its name: Chromium and Edge hide theirs (`::-webkit-calendar-picker-indicator`), and Safari's segmented editor (`::-webkit-datetime-edit`) draws none. Firefox 146 draws one no page can hide, so there the field stays the browser's, untouched, and the new props do nothing; when Firefox supports the pseudo-element, it takes Kozmos's calendar with no change to a product's code.
- **New props**, all optional: `open`, `defaultOpen` and `onOpenChange`; `chooseDateLabel` names the button and, with no `label`, the calendar (`"Choose date"`); `previousMonthLabel` and `nextMonthLabel`; `locale` for the calendar's names (the browser's still format the typed field); `isDateUnavailable` and `today`. `min` and `max` bound the calendar's days too.
- **Disabled or read only**, the button cannot open it.
