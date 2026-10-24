---
"@kozmos-ds/react": patch
---

`MultiSelect`'s clear and open buttons are drawn as `Combobox`'s (owner, 24 Oct): each as tall as the field, 44 at touch density and 40 at compact (decision 82), where they were 28 at both. They sit at the field's end, inside its border, in either direction. The field keeps its height and leaves Combobox's room for them at its end: 96, or 48 without the clear, at touch; 88 or 44 at compact. A caller's `px-*` still sets the field's start, and a caller's `pe-*` still sets its end. A visual change only: the props, labels and behaviour are the same.
