# The visual review's font

`Roboto.ttf` is Roboto 3.005 (Google, Apache License 2.0, `LICENSE-Roboto.txt`),
taken from the Android layoutlib that Paparazzi runs, with its width axis
pinned at 100 (`fontTools.varLib.instancer`); its weight (100–900) and italic
axes are kept. `fonts.conf` makes it the face for `system-ui` and
`sans-serif` in the Playwright image, and `playwright.visual.config.ts` hands
that file to Chromium. `tests/visual/environment.visual.ts` fails if the
system stack resolves to anything else, or if bold draws like regular.

Changing this font changes every baseline: re-record them all, in the image.
