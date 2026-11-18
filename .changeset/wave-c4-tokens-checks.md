---
"@kozmos-ds/tokens": patch
"@kozmos-ds/styles": minor
"@kozmos-ds/react": minor
---

MapEditToolbar's disabled tools and actions can say why with `disabledReason` (decision 217, GAP-284): with a reason, the item stays in the arrow-key order and under the pointer, says it is unavailable with `aria-disabled="true"`, does nothing when pressed, and shows the reason as its tooltip and accessible description, drawn from the disabled pair. Without one, a disabled item is unchanged.

Every component colour that is a primitive's value now refers to that primitive (GAP-281): 198 light and 208 dark Button colours were hex copies. The token stylesheets and Android resources write them as references (`var(--primitives-colors-foreground-1000)`, `@color/…`), so a change to a ramp, or a product's override of one, reaches every Button state drawn from it. Every value resolves to what it did on every platform.

A new primitive, `Primitives.Colors.white` (`--primitives-colors-white`), is `#FFFFFF` in both themes (decision 223). The themed Button's words and marks refer to it rather than to foreground 1000 in light and foreground 0 in dark, so an override of either ramp step no longer reaches a white that is meant never to change.

MapEditToolbar draws its items as Pointr Cloud's live toolbar does (decision 226). No item has a fill at rest. An enabled item's label is foreground 0 over a foreground 400 icon. A chosen tool is the theme's ink (the themed emotion's text) with no fill. A disabled item, with a reason or without, is foreground 600 with no fill: the toolbar is an exception to decision 197's disabled fill. Hovered, an enabled or chosen item takes the hover fill.
