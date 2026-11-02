---
"@kozmos-ds/react": minor
---

`CardTitle` takes `as`, `h2` to `h6`, as `Heading` does, and is an `h3` without it (GAP-205, decision 129). It was always an `h3`, so a card under a page titled with an `h1` skipped a level, and axe reported heading-order. The level follows the page's outline: under an `h1`, a card's title is `as="h2"`. There is no `h1`, the page's own title.

- **It changes what a screen reader hears, not the title's look:** every level is drawn as the `h3` was.
- **Its ref is typed `HTMLHeadingElement`;** it was `HTMLParagraphElement`. A ref of either type still fits, and it lands on the heading element as before.
- **Nothing to migrate.** A title without `as` is the `h3` it was. A card that set `aria-level` on its title to work round this can drop it and pass `as`.

SwiftUI's `KozmosCardTitle` and Compose's are now headings as well, with no level and no new API: see `packages/ios/CHANGELOG.md` and `packages/android/CHANGELOG.md`.
