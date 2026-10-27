---
"@kozmos-ds/react": patch
---

`Accordion` opens and closes over its content's height, as it was written to. Its content carried `animate-accordion-down` and `animate-accordion-up` from the start, but no config defined their keyframes, so both compiled to nothing and it opened and closed at once. The keyframes now run from and to Radix's `--radix-accordion-content-height` in 200ms, eased out, as the chevron turns, scaled by the motion tokens' duration scale.

Under reduced motion it opens and closes at once, whether the browser asks (`prefers-reduced-motion`) or the design config does (`motion: "reduced"` or `accessibility.reduceMotion`). `scripts/check-accordion-motion.mjs` reads the animation the content runs in Chromium, Firefox and WebKit. `components:classes:check` no longer lists the two classes as known to compile to nothing.

The props are unchanged.
