---
---

The React bridge's boolean props (a bare attribute, `<KozmosNavigationItem disabled>`, is `true` to React, by Vue's rule for a declared Boolean prop and React's types) and `KozmosAnchoredPopover`'s declarations (which now type-check with `skipLibCheck` off) change only `@kozmos-ds/vue`, which is private. Its sources are inputs to `@kozmos-ds/styles`' Tailwind build, but `style.css` and `reset.css` built from this branch are byte-identical to main's, so styles and React have nothing to release. FieldWrapper's and MapControlsGroup's docs pages change only their Vue tabs.
