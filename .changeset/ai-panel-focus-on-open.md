---
"@kozmos-ds/react": minor
---

`AICompanionPanel` gains an optional `open` prop. With `open` omitted, mounting the panel opens it and takes focus, as in 0.5.0; unmounting returns focus to its opener. Existing consumers that mount the panel to open it do not need to change that pattern.

With `open` supplied, keep the panel mounted and turn it from `false` to `true` when the visitor opens it, usually from `AISearchButton`: that transition takes focus. A panel mounted with `open={true}` is already on screen and does not take focus or call `onOpenAutoFocus`. Closed, it draws nothing. Closing or unmounting returns focus to the opener unless the product has already moved focus outside the panel.

`onOpenAutoFocus` and `onCloseAutoFocus` let the product prevent the default handoff and choose a focus target. Place the panel itself through its `className`, rather than a wrapper that would remain over the sheet after it closes.
