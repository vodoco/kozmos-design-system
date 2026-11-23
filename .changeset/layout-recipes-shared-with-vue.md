---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

Stack's, Grid's, Container's and Surface's classes move into the package's shared `recipes` module (`stackVariants`, `gridVariants` and the window a virtualized Grid draws, `containerClasses`, and `SURFACE_CLASSES` and `surfaceClass`, which leave `components/Surface/surface-class`), which `@kozmos-ds/vue` builds its own Stack, Grid, Container and Surface from, so the two draw the same element (wave V1). Nothing changes for a product: `Box`, `Stack`, `Grid`, `GridVirtualRange`, `Container`, `ContainerBlock`, `ContainerBlockInset`, `Surface`, `SurfaceVariant`, `SURFACE_CLASSES` and `surfaceClass` are exported as before, `dist/index.d.ts` and `style.css` are byte-identical to main's, and the parts' tests pass unchanged. The published files gain `dist/esm/recipes/container.mjs`, `grid.mjs`, `stack.mjs` and `surface.mjs`, and lose `dist/esm/components/Surface/surface-class.mjs`. `@kozmos-ds/styles`, built from React's and Vue's sources, ships a byte-identical `style.css`: the classes moved, and Vue's Box, Stack, Grid, Container and Surface draw only the recipes' classes.
