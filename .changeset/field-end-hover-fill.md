---
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
---

The buttons at a field's end draw their hover inside themselves (decision 164): Combobox's and MultiSelect's clear and open, Input's `action`, PasswordInput's reveal, and DatePicker's, DateRangePicker's and TimePicker's button. Hovered, each now draws a `background-100` fill 4 px in from its edges (the field's 1 px edge and a 3 px gap): 36 × 36 in touch and 32 × 32 in compact, its corners the control radius less 4 (12 at the default 16), so they follow a product's `--semantics-radius-control`. Until now each filled its whole box, which covered the field's outline at its top, bottom and end. The button itself fills nothing, so the outline stays drawn round it, 3 px clear of the fill on every side the button lies on; there is no fill at rest, on a disabled button, or in forced colours. The fill fades in and out over 150 ms, as Input's, PasswordInput's and the pickers' hover did, and now Combobox's and MultiSelect's do too; the design config's reduced motion makes it a cut. Each button keeps its hit target, as tall as the field, its focus ring and its icon.

MultiSelect's clear and open now lie on the field's edge at its end, as Combobox's do: they sat 1 px inside it, so the open button's fill stood 4 px from the outline there instead of 3. The chips and the typed text keep 9 px clear of the clear button, as Combobox's text does (8 before).

Input's pressed toggle `action` takes the same shape (decision 165): the theme fill 4 px in from the button's edges with the same corners, where it was a 32 px disc. Hovered, it is the themed Button's hover, as before; a disabled pressed toggle no longer changes on hover. In forced colours it stays a Highlight fill when hovered, where hovering used to drop it.

The fill is each button's `::before`, from owned CSS on `.kozmos-field-action` and `.kozmos-combobox-action`; Combobox's and MultiSelect's buttons no longer carry `hover:bg-muted`. No prop changes.
