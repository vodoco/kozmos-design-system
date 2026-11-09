---
"@kozmos-ds/react": patch
---

Combobox keeps the visitor's typed text when the chosen option's label changes. An uncontrolled
field used to replace what the visitor had typed with the chosen option's label whenever that
label changed, so it emptied as they typed when an async search dropped the chosen option from
`options`, or when the product cleared `value` in `onInputValueChange`. Now a new choice, made by
the visitor or set by the product, still shows its label; a renamed choice still shows the new
label while the field shows the old one; and text the visitor has typed stays as it is. A choice
whose option leaves `options` keeps the text it shows. Controlled `inputValue` is unchanged.
