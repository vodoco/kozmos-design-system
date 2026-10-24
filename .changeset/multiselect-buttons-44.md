---
"@kozmos-ds/react": patch
---

`MultiSelect`'s clear and open buttons are drawn as `Combobox`'s (owner, 24 Oct): each as tall as the field, 44 at touch density and 40 at compact (decision 82), where they were 28 at both. They sit at the field's end, inside its border, in either direction.

- **On one line the field keeps its height**, 44, or 40 at compact. Taller content grows the field as before, and the buttons stay centred on it.
- **Chips wrap sooner.** The field keeps Combobox's room for the buttons at its end: 96, or 48 without the clear, at touch; 88 or 44 at compact. So each line has 16px less room for chips and typing than before (4px less without the clear), and chips wrap 16px sooner.
- **A caller's padding:** `px-*` still sets the field's start. A caller's `p-*` or `pe-*` replaces the room, and the chips and text then run under the buttons, as text does on Combobox.
- **Forced colours** (Windows' high contrast): hovering Combobox's or MultiSelect's clear or open no longer erases the field's edge. Forced colours repaint the hover fill in the page's colour; these buttons now hover with no fill there.
- **Focus:** with its clear or open focused, MultiSelect's field no longer draws its own ring around the button's. The button rings alone, as on Combobox. With the input focused, the field rings as before.

The props and labels are unchanged.
