---
"@kozmos-ds/react": patch
---

`Accordion` opens and closes over its content's height, as it was written to. Its content carried `animate-accordion-down` and `animate-accordion-up` from the start, but no config defined their keyframes, so both compiled to nothing and it opened and closed at once.

- **The keyframes** now run from and to Radix's `--radix-accordion-content-height`.
- **Timing:** they run on the standard motion tokens, `--semantics-motion-duration-standard` (280ms) and `--semantics-motion-easing-standard`, as Kozmos's owned sheet and reveal motion do.
- **The chevron** turns on the same two tokens, so it and the content move together. It turned in 200ms before.
- **Reduced motion:** both snap, whether the browser asks (`prefers-reduced-motion`) or the design config does (`motion: "reduced"` or `accessibility.reduceMotion`). Like the rest of Kozmos's owned motion, they read the tokens directly rather than through the duration scale.

`scripts/check-accordion-motion.mjs` reads the timing and the animation the content runs, and the chevron's turn, in Chromium, Firefox and WebKit. `components:classes:check` no longer lists the two classes as known to compile to nothing.

The props are unchanged.
