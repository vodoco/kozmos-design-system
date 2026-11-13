---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

`PropertyPicker` (CLOUD-UI-003) joins `@kozmos-ds/react/dashboard`: Pointr Cloud's "+ Add additional field". A full-width subtle Button opens a popup with a labelled search, focused as it opens; Suggested and Others tabs while any property is `suggested`, Others never repeating a suggested one; and a Listbox of the properties, each its name over its type and description. The search is case-insensitive, on the name only, across both tabs at once, its results grouped under Suggested and Others, and says so when nothing matches. ArrowDown moves from the search into the list and ArrowUp from its first row back; Escape empties the search, then closes the popup, giving the focus back to the button. Choosing a property calls `onSelect` and closes; `onCustomField` draws a Custom field action after the list. Properties are data, `{ id, name, type, description?, suggested? }`, in the page's language, and every word is a prop. Its rules are in `dashboard.css`.
