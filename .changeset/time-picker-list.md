---
"@kozmos-ds/react": minor
---

`TimePicker` opens a Kozmos list of times (decision 104), Combobox's list as Figma's Open variant draws it, in every engine. The field keeps the browser's segmented typing and its value API: `value`, `defaultValue` and `onChange` on an `HH:MM` string, unchanged.

- **The list** draws Combobox's rows (decision 115) with Figma's 2 between the times (`TimePicker/listbox/gap`), where the standalone `Listbox` keeps its 4.
- **The button.** A button at the field's end, as tall as the field, opens the list under the field, as wide as it, on the field's time; so do Alt+Down Arrow and F4 in the field, where Chromium would open its own picker. The list takes focus; the arrows, Home and End move in it; a time chosen by Enter, Space or the pointer is typed into the field, so `onChange` and a form's change listeners hear it as typing; that or Escape closes it and returns focus to the button.
- **Every engine.** Chromium's own clock button gives way to Kozmos's (hidden with `::-webkit-calendar-picker-indicator`), and Safari and Firefox draw none, so they offer a list for the first time.
- **The times** run from `min` to `max` (the input's own, `00:00` to `23:59` by default) every `step` seconds, or every 30 minutes when `step` asks for less than a minute or nothing, in the locale's own short time.
- **New props**, all optional: `open`, `defaultOpen`, `onOpenChange`; `chooseTimeLabel` names the button and, with no `label`, the list (`"Choose time"`); `hourCycle` (`"h12"` or `"h23"`, by default the locale's) and `locale` for the list (the browser's still format the typed field). Disabled or read only, the button cannot open it.
- **`Listbox` starts on its chosen option**, as the WAI-ARIA listbox does, where it started on the first; with nothing chosen it still starts on the first.
