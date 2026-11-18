---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Input's `action` takes `{ kind: "edit" }`, a pencil at the field's end that calls `onEdit` (decision 224, GAP-212): for a read-only value whose editor is elsewhere, as Pointr Cloud's Map Personas shows a persona's ID and Map Style. What editing means is the product's, a dialog or making the field editable. The button is named "Edit" by default (`label`, in the product's words), is drawn as the copy is, is never pressed and announces nothing, and only a disabled field disables it. The copy and toggle actions are unchanged.

CodeBlock, new (decision 225, GAP-216): a read-only block of code, such as MAP-619's merged unit's JSON. `code` in the mono family (`--semantics-typography-family-mono`), 14/20 in the foreground on the muted surface, on the control radius, 12 inside; `wrap` (the default) breaks long lines, and `wrap={false}` keeps each line whole and scrolls the block sideways, the scroller then a stop on the keyboard's way. `maxHeight` (a number of pixels or a CSS length, unset by default) caps the block so a long value never pushes the page: past it the code scrolls inside, the scroller again a stop on the keyboard's way. `copyable` adds a copy at the top end that copies the code and says so in a polite live region, in `copyLabel` ("Copy") and `copiedLabel` ("Copied"); `onCopy` receives the code. A region named by `label`; no syntax colouring. The stylesheet adds `.kozmos-code-block` and its parts.
