---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

`TabsTrigger` takes an `icon`, and `SelectItem` a `count` (decision 132).

- **`TabsTrigger` `icon`** (GAP-152): the icon is drawn 20px, 4px over the tab's words, both centred and in the words' colour, so a tab of 6 + 20 + 4 + 20 + 6 is 56 tall. The list grows to hold it, 64 where it was 40; a list of words alone keeps its 40. The active tab is still decision 65's raised segment. The icon is `aria-hidden`: the tab is named by its words. The stack is symmetric, so it reads the same right to left. Without an icon a tab renders exactly as before, and an `asChild` tab keeps its one child.
- **`SelectItem` `count`** (GAP-164): a neutral `Counter` at the option's end, before its check. It sits outside the item text, which the closed select repeats, so the closed select shows the option's words alone, and the option is named by its words and then its count ("POI 96"). Without a count an option renders and is named as before.

The stylesheet gains the one rule that lets the tab list grow, `has-[[data-slot=tabs-trigger-icon]]:h-auto`. SwiftUI's `KozmosTabsTrigger(value:title:selection:icon:)` and `KozmosSelectItem(value:label:count:selection:)`, and Compose's `KozmosTabsTrigger(..., icon = { })` and `KozmosSelectItem(..., count = …)`, are the same parts on the other platforms. In Figma, Tabs gains a `Content` axis (`Label`, `Icon Over Label`) and `Tab 1 Icon` to `Tab 4 Icon`, and Select a `Content` axis (`Closed`, `Open`) whose open list shows `Option N Text` with `Option N Count` under `Show Counts`.
