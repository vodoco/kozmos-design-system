---
"@kozmos-ds/react": patch
---

`SegmentedControl` can hold an empty choice: `value={null}` is nothing chosen. `onValueChange` still reports a choice taken back as `undefined`, so a product that holds the choice passes `value={choice ?? null}`; the segment it took back is no longer left pressed, and Radix no longer warns about the control switching between controlled and uncontrolled. `value={undefined}`, or no `value` at all, leaves the choice to the control, exactly as in 0.5.0, so a wrapper that forwards its own optional `value` keeps working when it is used without one.
