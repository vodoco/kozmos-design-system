---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Fields, options and uploads (0.17.0 wave C1: GAP-239, GAP-256, GAP-257, GAP-258, GAP-260, GAP-282; decisions 215 and 221).

- **Avatar `size="sm"` (decision 221):** 24, its initials at 12/16, beside `default`, 40; `data-size="sm"` marks it. New type `AvatarProps`.
- **An option's media (decision 215, GAP-282):** `ComboboxOption.media`, `{ src?, initials? }`, draws the `sm` Avatar, 24, before the label in Combobox, Listbox and MultiSelect: the image, or the initials while it loads or when there is none (by default the label's first letters). It is hidden from assistive technology: the label stays the option's name, and a row with media keeps the list's row height. New type `ComboboxOptionMedia`.
- **An option's trailing slot (GAP-260):** `ComboboxOption.trailing` is drawn muted at the option's end, before the check, and is the option's description (`aria-describedby`), so the option's name stays its label.
- **Listbox's controlled active option (GAP-260):** `activeValue` (`string | null`) with `onActiveValueChange`, so a search field can drive the list as a combobox with `aria-activedescendant`, focus staying in the field; the new `listboxOptionId(listboxId, options, value)` gives the option's id. Unset, the list keeps its own active option as before.
- **FileUpload's messages, one-file picking and its input (GAP-258):** `tooManyFilesLabel`, `tooLargeLabel` and `notImageLabel` put the refusals in the product's words, React's English by default. `multiple`, when given, is the picker's own: `multiple={false}` keeps the picker to one file whatever `maxFiles` says (before, `maxFiles` over 1 made it several). `inputRef` reaches the hidden file input; `ref` stays the box. ImageField opens a one-file picker with one slot left, its own count check still speaking.
- **OTPInput (GAP-239):** a digit typed into a filled cell replaces it and moves on, whether the cell was clicked, reached by Tab or given the focus as the digit before was typed, so a full code can be typed over; a focused cell's digit is selected.
- **TimePicker (GAP-256):** with a `step` of whole minutes, Up and Down Arrow step the time by it, carrying into the hour, within `min` and `max` or round midnight. With no `step`, or one in seconds, the arrows stay the browser's.
- **NumberInput (GAP-257):** with `step="any"`, the steppers step by 1 within `min` and `max`, keeping the value's decimals, where the input's own `stepUp()` threw.
