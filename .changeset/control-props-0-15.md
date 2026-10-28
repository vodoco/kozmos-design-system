---
"@kozmos-ds/react": minor
---

Three control props, approved for 0.15.0 (decision 119):

- **`IconButton` `counter`**, **`counterLabel`** and **`counterSeparator`** (GAP-197): a count over the icon's top-end corner (the top-left in right to left), Kozmos's `Counter` in the theme fill, its bottom on the button's centre line and its start 2px past it (on a 28 help button, where the MAP-64 design places it). It is read with the button's name, whether that is `aria-label`, `aria-labelledby` or the content: "Help, 3" by default, or in `counterLabel`'s words (`(count) => string`, in the product's language) after `counterSeparator` (", " by default). The drawn number is hidden from readers so it is not read twice. In forced colours it is outlined. `IconButtonProps` is now an interface of its own, extending `ButtonProps`.
- **`CardHeader` `actions`** (GAP-169): what acts on the card at the header's inline end, after the title and description in reading and Tab order, centred on the title's line, whatever their size, without making the header taller for an icon button. `CardHeaderProps` is exported.
- **`Input` `action`** (GAP-154): a button inside the field's end, drawn as PasswordInput's reveal is. `{ kind: "copy" }` copies the value and says "Copied" (`copiedLabel`) in a polite live region, again on a second copy, with a check in place of the copy icon for two seconds; `{ kind: "toggle" }` is a pressed button with its own name (the Featured star); pressed, it is a 32 disc of the theme fill under the icon in the fill's foreground, as a pressed ToggleButton is, so the state is not a colour alone, and a Highlight disc in forced colours. Giving a field an action, or taking it away, keeps the same input, its focus and its typed value. `InputAction` is exported.
- **`inputVariants` and `InputStatus`** move to a module of their own and are exported as before, so the fields that share Input's recipe (PasswordInput, DatePicker, Search and the rest) no longer bundle Input's action.

Nothing changes for a product that sets none of them.
