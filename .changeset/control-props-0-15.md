---
"@kozmos-ds/react": minor
---

Three control props, approved for 0.15.0 (decision 119):

- **`IconButton` `counter`** and **`counterLabel`** (GAP-197): a count over the icon's top-end corner (the top-left in right to left), Kozmos's `Counter` in the theme fill. It is read with the button's name, "Help, 3" by default or in `counterLabel`'s words (`(count) => string`, in the product's language); the drawn number is hidden from readers so it is not read twice. In forced colours it is outlined. `IconButtonProps` is now an interface of its own, extending `ButtonProps`.
- **`CardHeader` `actions`** (GAP-169): what acts on the card at the header's inline end, after the title and description in reading and Tab order, centred on the title's line without making the header taller for an icon button. `CardHeaderProps` is exported.
- **`Input` `action`** (GAP-154): a button inside the field's end, drawn as PasswordInput's reveal is. `{ kind: "copy" }` copies the value and says "Copied" (`copiedLabel`) in a polite live region, again on a second copy, with a check in place of the copy icon for two seconds; `{ kind: "toggle" }` is a pressed button with its own name (the Featured star), drawn in the theme's colour when pressed, Highlight in forced colours. `InputAction` is exported.

Nothing changes for a product that sets none of them.
