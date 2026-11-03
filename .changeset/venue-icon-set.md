---
"@kozmos-ds/icons": minor
"@kozmos-ds/react": minor
---

`Icon` and `getIconComponent` take a curated venue set by name (GAP-105, decisions 119 and 121): the categories, amenities and services a visitor looks for, 15 names from artwork the package already holds, on React, SwiftUI and Compose.

- **Categories:** `utensils`, `medical-cross`, `plane`, `clapperboard`, `graduation-hat-01`, `beaker-01`.
- **Amenities:** `accessibility`, `credit-card-01`, `battery-charging-01`, `droplets-01`.
- **Services:** `luggage-01`, `passport`, `ticket-01`, `package`, `scissors-01`.

Their definitions carry the categories `Venue categories`, `Venue amenities` and `Venue services`, and 40 new aliases take the names a product already holds: a taxonomy type (`food-beverage-space`, `boarding-gate`, `atm`, `charging-station`, `entrance-exit`), a service type in kebab case (`first-aid`, `ticketing`), or a word (`dining`, `shopping`, `information`, `favourite`). An alias can now stand for a name beyond the library, so `kozmosIconAliases` reaches `security-control` and `route-entrance-exit`.

```tsx
<Icon name="utensils" />
<Icon name="food-beverage-space" /> // the same glyph, by its taxonomy type
```

`Icon` names grow only by this set: a UI icon stays a named import, `<Icon icon={Copy01} />`, and `copy-01`, `star-01` and `pencil-01` are not names. Toilets and parking have no glyph, so they have no name or alias; draw them with the taxonomy's `iconUrl`. The package README lists the set, how it was chosen and what was left out.

**What it costs.** A lookup by name, which `Icon`, `getIconComponent`, `isKozmosIconKey` and POIDetailPanel all do, goes from 19.84 to 23.44 KB gzip, 101 icons where it was 86. It would be 24.93: a lookup no longer carries each definition's Figma node, category and description, so `kozmosIconRegistry` is built from a list of its own rather than from `kozmosIconDefinitions`, with the same names and components. A named import costs what it did.

`kozmosIconRegistry` and `kozmosIconDefinitions` keep their shapes. `KozmosIconDefinition` gains the `KozmosOwnedIconDefinition` arm, `source: "owned"`, for `utensils` and `accessibility`, which have no `figmaNodeId` because the Pointr Icon Library has no such outline. A consumer that reads `figmaNodeId` from every definition narrows on `source` first, as it already had to for `KozmosTaxonomyIconDefinition`.
