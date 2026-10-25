---
"@kozmos-ds/react": minor
---

`Calendar`, a month grid to choose a day or a range in, one month or two side by side (decision 104). It is the panel Figma draws open under DatePicker and DateRangePicker; DatePicker is to open it next, in a Popover. Days are `YYYY-MM-DD` strings, as DatePicker's value is.

- **A day or a range.** `mode="single"` (the default) calls `onValueChange` with the day each time one is chosen, the chosen one included. `mode="range"` calls it with `{ start }`, then `{ start, end }` in order; while a range has no end, the day under the pointer or the focus shows where it would end. `value` controls it and `defaultValue` leaves it to the calendar.
- **Months.** `months={2}` shows two side by side, 12 apart, wrapping where they do not fit. The first month shown is the value's, else today's; `month` with `onMonthChange` controls it, `defaultMonth` sets it. `today` names the day drawn as today, by default the reader's.
- **Days that cannot be chosen.** `min` and `max` bound them, and `isDateUnavailable` closes any day a product decides; those are muted, cannot be chosen, and closed days are still reached and read.
- **Drawn as Figma draws it.** 36px days in one month and 40px in a range, 4 apart, with the Control corner; a 32 header with 32 previous- and next-month buttons; the chosen day in the theme fill under the theme foreground (decision 59), today on background/100, a range's days on theme/100, another month's days and the weekdays in ink 400, in both themes. It draws no surface: a Popover's or a Card's is its own. The layout is owned CSS in logical sides only, so it holds in a host without `@scope`.
- **The keyboard** follows the WAI-ARIA date picker dialog's grid, one tab stop after the two buttons: the arrows a day or a week, Home and End the week's ends, Page Up and Page Down a month, with Shift a year, Enter and Space choose. Right to left, the arrows follow the page.
- **The locale.** `locale` names the months and the days and picks the first day of the week, by default the document's language, then the browser's: the locale's short weekdays and its digits, and `Intl.Locale`'s first day, or CLDR's where an engine has none (Firefox).
- **Accessibility.** Each month is a grid named by its title, a polite live region. Each day is named by its full date and says whether it is chosen, today or unavailable; another month's days are drawn for the eye only. `previousMonthLabel` and `nextMonthLabel` name the buttons, `"Previous month"` and `"Next month"` by default. `disabled` and `readOnly` do as a field's do.
