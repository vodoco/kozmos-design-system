---
"@kozmos-ds/react": patch
---

`SegmentedControl` shows a product's empty choice. `onValueChange` reports a choice taken back as `undefined`, and a product holding the choice passes that back as `value`; Radix read an undefined value as uncontrolled, so the segment stayed pressed while the product held nothing, and Radix warned about the control switching between controlled and uncontrolled. Passed at all, `value` now holds the choice, and `undefined` is nothing chosen. A control given no `value`, or an undefined one beside a `defaultValue`, keeps its own choice as before, and `onValueChange` still reports `undefined` for an empty choice.
