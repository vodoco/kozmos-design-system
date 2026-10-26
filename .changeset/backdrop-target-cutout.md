---
"@kozmos-ds/react": minor
---

`Backdrop` takes `target`, and lights it: a tour dims the page and lifts the one control its step points at (GAP-189, MAP-64). `target` is an element, a React ref to one, a virtual element (anything with `getBoundingClientRect()`), a rect in the viewport's coordinates, or a list of them lit as the one box round them all.

- **The cut-out.** The dim covers everything else. The cut-out is the target padded by `targetPadding` and rounded by `targetRadius`, in pixels, which default to the tokens layout.spacing.100 (8) and radius.control (16), read where the backdrop is drawn. It is ringed 2px outside in the focus colour (`ring`, theme 600), with a border that forced colours keep and draw in the system's Highlight.
- **Pointer events pass through the cut-out**, so the control can be pressed; the dim catches them everywhere else. The scrim's clip-path leaves the cut-out out of both what it draws and what it hits.
- **The target stays where it is.** Nothing re-parents it or changes its z-index or style. The cut-out follows it as it resizes (a ResizeObserver), as anything that scrolls it scrolls, and as the window resizes; each render reads the target again, so a ref filled later is lit. An element that draws no box of its own (`display: contents`) is lit by its children's box.
- **Motion.** A new target is glided to from where the cut-out was, over the standard duration and easing; under reduced motion (the media query, or the config's) it moves at once. A cut-out that has not yet been painted is never glided from.
- **With no target**, or one that is not there (a ref to nothing, an element with no box, an empty list), the whole page is dimmed, as Backdrop did. Without `target` the backdrop draws exactly what it drew.

Nothing in the dim is focusable and the ring is hidden from assistive technology: saying what is lit is the step's job. The backdrop's element carries `kozmos-backdrop`, and `data-lit` while it cuts a target out. The new types are `BackdropProps`, `BackdropTarget`, `BackdropTargetItem`, `BackdropRect` and `BackdropVirtualElement`. In Figma, Backdrop has a Target axis: `Cut-out` lights an example control; Code Connect maps it to `target`.
