---
"@kozmos-ds/react": patch
---

`CardContent` and `CardFooter` pay the top when they are the card's first child (GAP-194). They pad their sides and bottom only, because a header above has already paid the top; with no `CardHeader`, the content (or a footer alone) touched the card's top edge. Now the part that is the card's own first child pads the top as well, by the card's padding: 24, or 16 with `padding="compact"`.

- **A header-led card is drawn as before**, and so is a part that is not the card's first child: under a header, below other content, or inside a wrapper such as a `form` around the card's parts.
- **A caller's own class still wins.** The top is the part's own `pt-*`, so `p-0`, `py-*` or `pt-*` on `CardContent` or `CardFooter` replaces it, through tailwind-merge, as it replaces the sides and bottom.
- **How:** the card sets the custom property `--kozmos-card-lead` on its first child, and the parts read it as their top padding, `0px` unless they are that child. A card nested inside another's content takes nothing from the outer card.

**Migration.** A header-less card that made its own room above the content, with a spacer or a top margin inside `CardContent` or `CardFooter`, now gets that room twice: remove the spacer. A top padding passed to the part (`className="pt-6"`, or `"p-6"`) replaces the new one rather than adding to it, and is now the default, so it can go too. A spacer element placed before the part, as the card's first child, keeps the part from being first: nothing changes until it is removed.

SwiftUI's `KozmosCardContent`/`KozmosCardFooter` and Compose's `KozmosCardContent`/`KozmosCardFooter` have the same gap and are not changed here.
