---
"@kozmos-ds/react": minor
---

`Stepper` takes `variant="dots"`: a tour's progress, one dot per step and no label shown (GAP-191, MAP-64). `variant` is `"numbered"` by default, the stepper as it was.

- **The dots.** Done and pending dots are 8 by 8 and the current one 20 by 8, 6 apart. Done and current are the theme fill (decision 59), so the current one is told by its shape as well as its colour. Pending ones are foreground 500, 3:1 or more against their surface (WCAG 1.4.11), measured in each engine: 4.24:1 on the light page and popover and 3.34:1 on the muted fill; 5.65:1 on the dark page and popover and 4.74:1 on the muted fill. The theme fill reads 5.62, 4.42, 3.74 and 3.13:1 on the same four. The wireframe's `#D5DAE3` read 1.4:1 on white. In forced colours done and current are the system's Highlight and pending ones an outline in CanvasText. Under reduced motion, the current dot's width does not animate.
- **What a screen reader hears.** The dots are a group named by the position, "Step 2 of 5" by default. `positionLabel` gives it the product's words: a function of the step (from 1) and the count, or a template with `{step}` and `{count}`. Each dot is a list item named by its step, in text that is never drawn, and the current one is `aria-current="step"`, as in the numbered stepper. Once every step is done, none is current and the position is the last step.
- **New types:** `StepperVariant`. `StepperProps` gains `variant` and `positionLabel`.

In Figma, Stepper has a Variant axis, Numbered and Dots, and Count reaches 8 on both, with Step 5 Text to Step 8 Text; Code Connect maps both. The variant is the indicator's style alone, so the later vertical orientation and status per step (GAP-173) sit beside it.
