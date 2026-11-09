---
"@kozmos-ds/react": patch
---

Combobox keeps the visitor's typed text when the chosen option's label changes. An uncontrolled
field used to replace what the visitor had typed with the chosen option's label whenever that
label changed, so it emptied as they typed when an async search dropped the chosen option from
`options`, or when the product cleared `value` in `onInputValueChange`. Now the field remembers
whether its text was typed or written by the field itself:

- A new choice, made by the visitor or set by the product, still shows its label, even over
  typed text.
- While the visitor has not typed, a renamed choice shows its new label, options that arrive
  after `value` show the chosen label, and clearing `value` empties the field.
- Once the visitor has typed, a label change or a `value` reset to `""` leaves their text. If
  you reset a form by setting `value` to `""` after the visitor typed, their draft stays: hold
  the text in `inputValue`, or give the field a new `key`, to clear it too.
- A `defaultInputValue` draft is no longer replaced when the chosen option's label first
  arrives in `options`. A blank `defaultInputValue` (`""`) is no draft, so the label still
  shows.
- When the chosen option leaves `options` while the visitor has not typed, the field keeps
  showing its label instead of emptying.

Controlled `inputValue` is unchanged.
