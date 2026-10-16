---
"@kozmos-ds/react": patch
---

Safari draws every Kozmos field as Chrome and Firefox do (GAP-174). WebKit applies no `@scope` rule to an `<input>` or a `<textarea>`, so a field there took only Kozmos's unscoped CSS and none of its utilities. The fields that relied on utilities now carry owned CSS, and nothing changes in Chrome, Edge or Firefox:

- **OTPInput**'s cells are 44 squares with the digit centred at 18/28, at any density; in Safari they were 53 wide, 40 tall in compact, with 12 of padding and the digit at the start in 14px.
- **ColorPicker**'s swatch sits over the field's start, 32 square with its border, radius and focus ring; in Safari it was a native colour well in the field's row, which pushed the text aside. The text starts 48 in, clear of the swatch, and ends 48 before the open button, in mono capitals; in Safari it started at 12, under the swatch, in the sans face and as typed. The panel's hue and opacity sliders fill its width at 20 tall, and its number and HEX fields are 36 tall with the control radius, border and fill, in light and dark; in Safari those were native.
- **AIInputBar**'s field is bare inside its pill, in the pill's type and colours, and takes the width the pill leaves; in Safari it was a native field with a 2px inset border, a white fill and 11px text, 148 wide.
- **RoutingInputGroup**'s and **FeedbackCard**'s fields sit on their wash with no edge (black at 5 % on light, white at 10 % on dark, more when focused), RoutingInputGroup's 40 tall and FeedbackCard's comment not resizable; in Safari they were the plain field on white with its border, RoutingInputGroup's 44 tall and the comment resizable.
- **WayfindingInputRow**'s fields are 40 tall, raised on half the muted fill with no edge, and keep 64 at the end for the swap button; in Safari they were the plain field, 44 tall, and the text ran under the button.

A utility class a caller passes to a field's `className` still wins in Chrome, Edge and Firefox. In Safari it cannot reach the field, which keeps its own look: style a field there through its props, the provider's `tokens`, an inline `style` or your own CSS, and the layout around it through `wrapperClassName` (the README's "Fields in Safari").
