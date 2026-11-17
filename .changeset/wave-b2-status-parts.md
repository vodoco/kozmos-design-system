---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

EmptyState takes a tone, Chip takes Tag's six emotions, PageHeader takes a title addon, FileUpload takes a button form, and SelectTrigger takes a ghost variant (0.17.0, wave B2).

- **`EmptyState` `tone`** (GAP-213, decision 194): one of Tag's six emotions (`themed`, `neutral`, `success`, `danger`, `informative`, `alert`). Set, the empty state is a card of its own: the emotion's surface, edged 1px in the emotion's text colour at the container's radius, its words in the ink that pairs with the surface and its icon in the emotion's text on a disc of the page's colour. Unset, it draws as before.
- **`Chip` `emotion`** (GAP-170, decision 200): Tag's six emotions, selectable and removable. At rest the emotion's surface and ink, edged in its text colour, the tint a tenth deeper under the pointer; selected, filled with the emotion's text, inked in the page's colour; 4.5:1 in both themes. It decides the colour whatever the `variant`; the variants keep their drawing and read as emotions: `neutral` is neutral, `brand` is `themed`, `destructive` is `danger`.
- **Chip's remove hover** (GAP-251, decision 173): the remove button hovers on the hover fill, where it took ink at a tenth, and while it is hovered the chip goes back to its fill at rest, so the button's hover shows on a hovered chip in both themes.
- **`PageHeader` `titleAddon`** (decision 210): a node beside the title, before `info`, such as a status Tag, as ListItem's `titleAddon`. It is outside the `h1`, centred on the title's line, and wraps under the title where the line has no room.
- **`FileUpload` `variant="button"`** (GAP-274): an outline Button with the upload icon and `browseLabel` ("Choose file" by default; "Add logo" for a client's logo) in place of the drop area, picking and validating as the drop area does.
- **`SelectTrigger` `variant="ghost"`** (decision 151, CLOUD-UI-009): no edge and no fill at rest, as wide as its value, the hover fill under the pointer and while open; the map's level control.
