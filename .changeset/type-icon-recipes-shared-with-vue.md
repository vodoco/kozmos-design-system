---
"@kozmos-ds/react": patch
---

Text's, Heading's, Label's, Icon's, Kbd's, CodeBlock's and SpriteIcon's recipes move into the package's shared `recipes` module (`textVariants`, the heading levels' sizes and tags, `labelVariants`, `iconVariants`, Kbd's cap classes and `kbdKeyName`, CodeBlock's classes and copy rules, SpriteIcon's atlas reading and cell layout), with IconButton's square box, which `@kozmos-ds/vue` builds its own Text, Heading, Label, Icon, Kbd, CodeBlock and SpriteIcon from, so the two draw the same element (wave V1). Nothing changes for a product: every export is as before, `kbdKeyName` included, `dist/index.d.ts` and `style.css` are byte-identical to main's, and the parts' and the recipes' tests pass unchanged. The published files gain `dist/esm/recipes/text.mjs`, `heading.mjs`, `label.mjs`, `icon.mjs`, `icon-button.mjs`, `kbd.mjs`, `code-block.mjs` and `sprite-icon.mjs`.
