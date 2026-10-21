---
"@kozmos-ds/react": patch
---

The list rows of `Combobox`, `MultiSelect`, `Select` and `Listbox` follow Figma (owner, 21 Oct): 44 tall, the density's control height, so 40 at compact density (decision 82), where they were 36 at both; 12 at the sides, the Marker corner, 2 between rows (the standalone `Listbox` keeps its 4); the words 14/20 regular in full ink, where they were medium.

- **The active row**, under the pointer or the keyboard, is a light row, background/50, in full ink, where it was filled with the theme's 600 under white. Reached by the keyboard it also draws a 2px inset ring in theme 600 (decision 26), 4.9:1 or more against the row in both themes, so the keyboard's place meets WCAG 1.4.11; under the pointer it draws none. The list reads which hand moved last from the events themselves, not `:focus-visible`, so it holds for Select's Radix items, which take focus under the pointer too, and for Combobox's, which never take it. A modifier pressed alone (Shift, Control, Alt, Meta, as for a Shift- or Cmd-click) is not the keyboard; a modifier with another key is.
- **The chosen row** is background/100, its check at the end in theme 600; it had no fill. `Select`'s check moves from the start of its item to the end, as Combobox's is, and its items and labels lose the start indent the check kept.
- No API changes: the same parts, props and states.
