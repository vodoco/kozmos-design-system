---
"@kozmos-ds/react": patch
---

The stylesheet no longer declares Tailwind's 51 compiler-variable defaults (`--tw-translate-x`, `--tw-ring-color` and the rest) on every element inside a provider, on its pseudo-elements and on every owned part. It registers the 38 that its utilities read with `@property` and `inherits: false` instead, so an element that sets none starts at its default without carrying its own copy, and no element inherits one from an ancestor. Where a name is registered without an initial value, the reads carry Tailwind 3's default as their fallback. What every utility draws is unchanged.

Re-theming the site's home page now restyles it in 100 ms in WebKit, down from 124. Chromium takes 22 ms, up from 19, and Firefox 11, down from 13.

A registration applies to the whole document. Each name is registered as Tailwind 4 (4.3.3) registers the same name: its syntax, and its initial value or none. A page that also runs Tailwind 4 therefore gets the same registrations whichever stylesheet loads last. Read from script, a registered name now gives its registered initial value on any element where nothing sets it, outside a provider too (`--tw-translate-x` reads `0` where it read an empty string). The names Tailwind 4 registers without an initial value read empty inside a provider: `--tw-skew-x` and `--tw-skew-y`, which read `0` before, and `--tw-ring-color`, which read `rgb(59 130 246 / .5)`.
