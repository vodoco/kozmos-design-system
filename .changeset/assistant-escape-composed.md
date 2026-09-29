---
"@kozmos-ds/react": patch
---

`AICompanionPanel` composes Escape with the product's own key handler. A product's `onKeyDown` replaced the panel's handler, so adding analytics or a shortcut stopped Escape from closing the panel; and an Escape a part inside had already handled, and marked with `preventDefault()`, closed the panel anyway. The product's `onKeyDown` now runs first, and Escape closes the panel after it unless the event has been default-prevented, by the product's handler or by a part inside. It still closes this panel only, and other keys never close it.
