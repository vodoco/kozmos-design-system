---
"@kozmos-ds/react": minor
---

**ChipInput** (GAP-222, decision 216): a field that takes free text and holds each entry as a removable Chip inside it, beside MultiSelect, which picks only from its options. Enter or a comma adds the trimmed text; pasted text with commas or line breaks adds each part; Backspace in the empty field removes the last entry; an entry typed again is not added and its text stays. `value`/`defaultValue`/`onValueChange` for the entries, `inputValue`/`defaultInputValue`/`onInputValueChange` for the text. Each chip's remove is named by `removeLabel(entry)` ("Remove {entry}"), and each change is said in a polite status in the product's words (`addedLabel`, `removedLabel`, `duplicateLabel`). The field is MultiSelect's, with no clear and no open.
