---
"@kozmos-ds/react": patch
---

The list rows of `Combobox`, `MultiSelect`, `Select` and `Listbox` follow Figma (owner, 21 Oct): 44 tall, the density's control height, so 40 at compact density (decision 82), where they were 36 at both; 12 at the sides, the Marker corner, 2 between rows (the standalone `Listbox` keeps its 4); the words 14/20 regular in full ink, where they were medium.

- **The active row**, under the pointer or the keyboard, is a light row, background/50, in full ink, where it was filled with the theme's 600 under white.
- **The chosen row** is background/100, its check at the end in theme 600; it had no fill. `Select`'s check moves from the start of its item to the end, as Combobox's is, and its items and labels lose the start indent the check kept.
- No API changes: the same parts, props and states.
