---
"@kozmos-ds/react": patch
---

`RouteOptionCard`: the chosen option's 5% tint of the theme now sits on the option's own background colour (the owned `kozmos-route-option` class). It was `bg-primary/5` over nothing, so on a glass sheet the map showed through the chosen option while the others stood opaque; it now reads like them. On a solid sheet it looks as it did, the tint over the sheet's background colour being the same mix.
