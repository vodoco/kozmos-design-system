---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": patch
---

**SpriteIcon** (GAP-150, decisions 86 and 219): one cell of a published MapLibre sprite atlas drawn as published, a taxonomy type's full-colour bubble, glyph and marker dot, never tinted. `sprite` is the atlas's version-pinned base URL (`.json`/`.png`, or `@2x` on a 2x screen, are added), `name` the cell, `size` 16, 20 or 24 (default), the cell scaled into it with its aspect ratio kept. Each atlas is read once per URL and scale; while loading, or for a missing cell, an empty box of the same size. Decorative unless `label` names it. `@kozmos-ds/styles` is built from the Vue sources too, whose bridge gains `KozmosSpriteIcon`; its CSS is unchanged.
