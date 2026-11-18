---
"@kozmos-ds/tokens": patch
"@kozmos-ds/styles": minor
"@kozmos-ds/react": minor
---

MapEditToolbar's disabled tools and actions can say why with `disabledReason` (decision 217, GAP-284): with a reason, the item stays in the arrow-key order and under the pointer, says it is unavailable with `aria-disabled="true"`, does nothing when pressed, and shows the reason as its tooltip and accessible description, drawn from the disabled pair. Without one, a disabled item is unchanged.

Every component colour that is a primitive's value now refers to that primitive (GAP-281): 198 light and 208 dark Button colours were hex copies. The token stylesheets and Android resources write them as references (`var(--primitives-colors-foreground-1000)`, `@color/…`), so a change to a ramp, or a product's override of one, reaches every Button state drawn from it. Every value resolves to what it did on every platform.
