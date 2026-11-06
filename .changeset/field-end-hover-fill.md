---
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
---

The buttons at a field's end draw their hover inside themselves (decision 164): Combobox's and MultiSelect's clear and open, Input's `action`, PasswordInput's reveal, and DatePicker's, DateRangePicker's and TimePicker's button. Hovered, each now draws a `background-100` fill 4 px in from its edges (the field's 1 px edge and a 3 px gap): 36 × 36 in touch and 32 × 32 in compact, its corners the control radius less 4 (12 at the default 16), so they follow a product's `--semantics-radius-control`. Until now each filled its whole box, which covered the field's outline at its top, bottom and end. The button itself fills nothing, so the outline stays drawn round it; there is no fill at rest, on a disabled button, or in forced colours. Each button keeps its hit target, as tall as the field, its focus ring and its icon.

Input's pressed toggle `action` takes the same shape (decision 165): the theme fill 4 px in from the button's edges with the same corners, where it was a 32 px disc. Hovered, it is the themed Button's hover, as before; a disabled pressed toggle no longer changes on hover. In forced colours it stays a Highlight fill when hovered, where hovering used to drop it.

The fill is each button's `::before`, from owned CSS on `.kozmos-field-action` and `.kozmos-combobox-action`; Combobox's and MultiSelect's buttons no longer carry `hover:bg-muted`. No prop changes.
