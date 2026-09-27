---
"@kozmos-ds/react": minor
"@kozmos-ds/product-contracts": minor
---

A result says more of what it knows, and the search field stops fighting the product.

**The result card draws the whole contract.** `unitLabel` and `nameLanguage` have been in the
contract since 0.4.0, and `POIResultCard` drew neither. The unit now leads the location line
(`Unit 214 · Level 2 · Building A`), and the name carries its own `lang`, so a screen reader reads an
authored Japanese name in Japanese. `POIResultPresentation` gains `summary`: one generated line,
already localised, clamped to two lines so a long one can't push the cards below it around.

**The current result is current, not a button stuck unpressed.** The selected card says
`aria-current="location"` — the word `LocationPin` uses for the same state — instead of
`aria-pressed`: a second tap never released the selection, so "not pressed" described a toggle that
was never there. A test that queries `{ pressed: true }` should query `{ current: "location" }`.

**It moves between its states on owned rules.** Selecting a card transitions its border,
background and shadow; its action row grows open and leaves when the selection does. It has no
closing move on purpose: collapsed actions must not stay tabbable. Both honour reduced motion.

**The list carries its notice, and speaks the product's words.** `POIResultList` gains a `header`
slot inside its own region, so a notice that qualifies the results goes when they go. A grouped list
now passes its two words on — `showMoreLabel` and `hideLabel`, set once on the list — and a group's
`expanded` state can live in the product through `onGroupExpandedChange`, so it survives the panel
closing.

```tsx
<POIResultList
  header={allergenNotice}
  showMoreLabel={(hidden) => t("results.showMore", { count: hidden })}
  hideLabel={t("results.hide")}
  onGroupExpandedChange={(groupId, expanded) => setExpanded(groupId, expanded)}
/>
```

**The selected result comes into view.** `scrollSelectedIntoView` is on by default: a result
selected from the map scrolls into the list, even at a sheet detent where a finger can't scroll. A
product that scrolled the panel itself should pass `false`.

**The browser's own clear is gone.** A `type="search"` field drew a second, unlabelled × in
Chrome, Edge and Safari that emptied the field behind the product's back: the DOM cleared, the
product's state didn't, and the next render put the text back. `SearchBar`, `Search` and the inputs
built on `.kozmos-input` hide it; the component's own clear, which calls `onClear`, stays.

**A search response says what it was limited to.** `SearchResponsePresentation` gains
`appliedScope`, a `SearchScopePresentation` with `kind` (`SearchScopeKind`: `"building"` or
`"area"`), `id`, `label` and an optional `queryWithoutScope`. Absent means the whole venue. The React
parts draw nothing from it yet; the iOS and Android contracts carry the same fields.
