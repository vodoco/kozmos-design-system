---
"@kozmos-ds/react": minor
---

Accordion has a boxed form (decision 149), for a form in steps, as Pointr Cloud's building editor is: `variant="boxed"` on `Accordion` draws each section as a box of its own, 8 apart, with a hairline while closed, `theme-900` while open, and the content in the panel's flow under its header. A header is the density's control height, 40 compact and 44 touch. `AccordionTrigger` takes `label`, the small line over the title, and `icon`, the boxed form's, and `loading`, in either form: a spinner where the chevron is, `aria-busy`, and the item disabled while it is set. `AccordionTriggerProps` is exported. The strings are the product's: there is no built-in step count. Every existing Accordion renders as it did, down to its attributes. The default form's keyframes now carry `overflow: hidden`, which changes nothing there: its content is `overflow-hidden` already. The published stylesheet grows by about 0.22 KB.
