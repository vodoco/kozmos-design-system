---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

A new entry, `@kozmos-ds/react/dashboard`, with its stylesheet, `@kozmos-ds/react/dashboard.css`, for Pointr Cloud's Dashboard modules (decision 183): an SDK or Core product never loads either, and the main entry and `style.css` are byte for byte what they were. Import the sheet after `style.css`, whose tokens it reads. The modules take their Core parts from `@kozmos-ds/react` itself, so a part and its context are the same whichever entry drew them. `@kozmos-ds/styles` builds the sheet and ships it as `@kozmos-ds/styles/dashboard.css` too.

Its first module is `BrandLoader` (CLOUD-UI-008), Pointr Cloud's brand loader: the pin with two rings rippling out from it in the theme's prominent colour (theme 500). It is a status region whose `label` (default "Loading") is announced once; under reduced motion, the reader's or the design config's, it stands still. With `overlay`, it covers the window with the theme's scrim, takes every pointer event, makes the rest of the page inert and busy while it shows, and gives focus back where it was when it goes.
