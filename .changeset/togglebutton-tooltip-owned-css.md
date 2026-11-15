---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A pressed ToggleButton keeps its pressed fill as a tooltip's trigger (`TooltipTrigger asChild`). The trigger writes the tooltip's `data-state` (`closed`, `delayed-open`) over Toggle's `on`, and the pressed look was read from it; it is now read from `aria-pressed`, which no trigger touches (GAP-261). Switch, Checkbox (checked and indeterminate), RadioGroupItem (every variant), TabsTrigger and AccordionTrigger had the same defect and now read their state looks from `aria-checked`, `aria-selected` and `aria-expanded`. A caller that restyled a ToggleButton's pressed look with `data-[state=on]:` should key it on `aria-pressed` for it to hold in a tooltip.

ToggleButton's look and Backdrop's place and scrim are owned CSS (`kozmos-toggle-button`, `kozmos-backdrop-layer`), so they hold in a host where no `@scope` rule applies: there a pressed ToggleButton drew no fill, ring or disabled look, and a Backdrop, with or without a target, collapsed and drew no scrim (GAP-262). An unpressed ToggleButton is now clear under a host's unlayered `button` background rule too.
