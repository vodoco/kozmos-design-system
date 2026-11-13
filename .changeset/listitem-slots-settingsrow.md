---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

`ListItem` takes slots, `ListItemStatus` and `SettingsRow` are new (GAP-195, GAP-040; decision 135).

- **`ListItem` takes slots.** `leading` at the start, centred on the title's line; `title`, with `titleAddon` beside it; `description` and `meta` under it; `trailing`, the row's one control, at the end. Give any of them and the row draws them; give none and the row is its children, as before. `selected` tints the row theme 0, for a row whose box is ticked; it is drawn only. The Get started checklist row and Pointr Cloud's Map Persona Visibility row are this row.
- **`ListItemStatus` is new.** A checklist row's status mark for `leading`: `status` is `"todo"`, `"inProgress"` or `"done"`, drawn as Stepper's step marks at 20 and read in words, "Not started", "In progress" or "Done" (`label` gives the product's own), first in the row, so a screen reader hears the status with the name.
- **`SettingsRow` is new.** One setting, a ListItem with a setting in it: `label`, `description`, the `control` at the end, `state` (`"inherited"` or `"overridden"`, drawn as a tag), Reset to default while overridden (`onReset`, `resetLabel`; pressed, focus goes to the control), and `disabled` with `disabledReason`. The control is named by the label, and the description, the state and the reason are read with it; while the row is disabled, the control is disabled.

On SwiftUI, `KozmosListItem` takes `description`, `meta` and `selected` and `.leading`, `.titleAddon`, `.metaContent` and `.trailing`; `KozmosListItemStatus` and `KozmosSettingsRow` are new. On Compose, `KozmosListItem` takes the same as parameters, and `KozmosListItemStatus` and `KozmosSettingsRow` are new. The Vue bridge has `KozmosListItem`, `KozmosListItemStatus` and `KozmosSettingsRow`. The Figma importer paints two new sets, `ListItem` and `SettingsRow`.
