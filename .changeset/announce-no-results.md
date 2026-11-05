---
"@kozmos-ds/react": patch
---

Combobox's and MultiSelect's `emptyText` ("No results found") is now said aloud whenever the popup shows it: when typing empties the list, or when the list opens with nothing in it. RouteLocationField, built on Combobox, says its own ("No locations found") the same way whenever its list shows it (idle or ready with no suggestion to show). Until now the words arrived inside a live region mounted with them: a `role="status"` box that already held the text, or the listbox turned into one. Screen readers read only a change inside a live region that is already in the page, so VoiceOver on Safari said nothing.

Each field now holds a visually hidden status from its first render, outside the popup and its portal. The status says the empty text while the popup shows it, and is empty otherwise. The popup's copy is plain text, so the message is said once. Nothing changes on screen and no prop changes. Combobox's status stays silent when the field's supporting text already says the same words.
