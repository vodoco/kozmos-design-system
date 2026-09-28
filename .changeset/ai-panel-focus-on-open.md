---
"@kozmos-ds/react": minor
---

`AICompanionPanel` takes focus only when the visitor opens it. It gains `open` (`true` when left out): keep the panel mounted and turn `open` on when the visitor opens it, from `AISearchButton` usually, and it takes focus then; turn `open` off, or unmount the panel, and it hands focus back to whatever had it when it opened. Closed, it draws nothing. `onOpenAutoFocus` is called at that open, so a product can still send focus to its field instead.

A panel that is open as it mounts, on screen from the start, no longer takes focus, and `onOpenAutoFocus` is not called for it: the `preventDefault()` a product needed to keep its page's focus is no longer needed. This is a behaviour change for a product that mounts the panel to open it: to the panel that is a panel on screen from the start, so focus now stays on the button beneath. Keep the panel mounted and pass `open` instead, and place the panel itself through its `className`, not a wrapper that would stay over the sheet once it closes.
