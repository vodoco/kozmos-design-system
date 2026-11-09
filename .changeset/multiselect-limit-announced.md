---
"@kozmos-ds/react": minor
---

`MultiSelect` tells a screen reader when the selection reaches `maxSelected` (GAP-225). Choosing the last option allowed disables the others, as before, and a polite status now says so once: "Limit of 3 reached" by default. The new `maxSelectedLabel` prop, `(max: number) => string`, returns the words in the product's language. The status is in the field from its first render, only when `maxSelected` is set, and is empty until the limit is reached. A value the host sets that reaches the limit, or goes past it, is said too. It is not said again while the selection stays at the limit, unless the limit or its words change (a new `maxSelected` or `maxSelectedLabel`), nor for a field that mounts already there or is given a limit it already meets. Removing a choice clears it, and reaching the limit again says it again.
