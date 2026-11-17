---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Lists and records for 0.17.0 (wave B1):

- **DescriptionList** and **DescriptionListItem** (GAP-221, decision 199): a value under each label with no field chrome, a `<dl>` of `<dt>` and `<dd>`. A value is words, tags, `true`/`false` (written "Yes"/"No", or `yesLabel`/`noLabel`), or carries an `action` such as Copy; `layout="stack"` (default) or `"row"`.
- **Tree `rowFill="band"`** (GAP-217, decision 196): the selected and hover fills as full-width bands with no corners, reaching `bleed`, with or without `divided`. `"inset"`, the pill, stays the default. `TreeItemRow` takes `rowFill` too.
- **Tree mixed parents** (GAP-279, decision 211): under `checkRule="independent"` a parent some but not all of whose enabled rows are checked is `aria-checked="mixed"` with Checkbox's dash; checking it checks all its enabled rows, clearing a checked parent clears them. Render slots get `mixed`; `TreeItemRow`'s `checked` takes `"mixed"`. The `"exclusive"` default is unchanged.
- **TableRow `highlight="new"`** (GAP-276): a row just added tints in the informative surface, holds three deliberate durations and fades over a fourth; under reduced motion it clears with no fade.
- **Listbox `embedded`** (GAP-271): no panel of its own (no border, surface, shadow or padding) inside a Dialog, Popover or Card.
