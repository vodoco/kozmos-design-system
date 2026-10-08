---
"@kozmos-ds/react": patch
---

Decision 61: the secondary Button draws the neutral emotion's Primary Buttons tokens in every state, with their ink, as SwiftUI and Compose do. The same goes for IconButton, FloatingActionButton and SplitButton, which render it. It was `bg-secondary text-secondary-foreground` (background/200 under foreground/0), with no hover, focus or pressed colour.

A press shows at once, and an `aria-disabled` secondary keeps its rest colour. The rules are owned, so they hold in a host without `@scope`. An explicit `emotion` still wins.

**What you'll see:**

- **In dark:** the secondary fill is `#464A53` (was `#2E3138`). Hovered and focused it is `#2E3138`, and pressed `#17191C`, under white.
- **In light:** it stays `#C7CAD1` under black, now `#ABAFBA` hovered and focused, and `#9095A2` pressed.
