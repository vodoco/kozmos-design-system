---
"@kozmos-ds/react": patch
---

In forced colours (Windows' high contrast), `MultiSelect`'s text input no longer draws a 2px box of its own inside the field. The input's `outline-none` hides the browser's focus ring, because the field draws the ring for it. That `outline-none` is a transparent outline, which forced colours paint, so the box showed at rest and while typing. Now the field draws the only edge. With the input focused, the field's outline still marks focus, as `Combobox`'s does. With the clear or open button focused, the button's outline alone marks focus. Normal colours are unchanged. `Combobox`'s input and `Select`'s trigger draw no such box, and are unchanged.
