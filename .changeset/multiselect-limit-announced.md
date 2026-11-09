---
"@kozmos-ds/react": minor
---

`MultiSelect` tells a screen reader when the selection reaches `maxSelected` (GAP-225). Choosing the last option allowed disables the others, as before, and a polite status now says so once: "Limit of 3 reached" by default. The new `maxSelectedLabel` prop, `(max: number) => string`, returns the words in the product's language. The status is in the field from its first render, only when `maxSelected` is set, and is empty until the limit is reached. It is not said again while the selection stays at the limit, nor for a field that mounts already there. Removing a choice clears it, and reaching the limit again says it again.
