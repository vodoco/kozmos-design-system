---
"@kozmos-ds/react": patch
---

Register open Combobox suggestions with Core overlays' dismissable-layer stack.
Escape closes suggestions first, returns focus to the field, and leaves enclosing
Dialog, Popover or assistant surfaces open until a subsequent Escape. Host-prevented
and IME-composing Escape events retain the popup and parent without cancelling the
browser's IME behavior. Inline and empty-result popups follow the same contract.

The already-used Radix dismissable-layer 1.1.11 is now a direct dependency; no
dependency versions are upgraded. Native platform behavior is unchanged.
