---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A chosen RadioGroup card or tile draws its heavier theme 600 edge in Safari 26.0–26.3 too (GAP-292). WebKit draws no box-shadow on a `<button>` it still draws natively, and the box's only rules that made it a styled button were the scoped preflight's and utilities', which those Safari versions do not apply to a form field, so the chosen edge vanished there, in React and in Vue alike. The box now carries the preflight's button reset (`-webkit-appearance: button; background-image: none`) in owned CSS. With `@scope`, and in Chromium and Firefox, nothing drawn changes.
