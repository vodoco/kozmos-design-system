---
"@kozmos-ds/react": patch
---

`AICompanionPanel` restores 0.5.0's contract for a panel given no `open`: mounting it is opening it, so it takes focus as it mounts, calling `onOpenAutoFocus` first, and hands focus back as it unmounts. 0.5.0 documented "The panel opens when it mounts, and takes focus then"; since `open` arrived (decision 16), a product that mounted the panel as the visitor tapped the AI button left focus on the button the panel covered. A product that passes `open` keeps decision 16: only `open` turning true is an opening, and a panel mounted with `open` already true takes no focus. StrictMode's rehearsal of the mount opens it once.
