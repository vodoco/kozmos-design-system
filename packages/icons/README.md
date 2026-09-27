# @kozmos-ds/icons

Icon components and the name registry for the Kozmos design system.

## Install

```sh
npm install @kozmos-ds/icons react
```

`react` is the only peer dependency. Every glyph is drawn here - the set was
re-drawn from Pointr's own outlines and `lucide-react` was removed in 0.2.0,
so nothing is pulled in behind it.

## Use

Most apps reach icons through `@kozmos-ds/react`, by name:

```tsx
import { Icon } from "@kozmos-ds/react";

<Icon name="calendar" />;
```

Or directly:

```tsx
import { getIconComponent, resolveIconName } from "@kozmos-ds/icons";

const Calendar = getIconComponent("calendar");
resolveIconName("back"); // "arrow-left"
```

Names are stable keys such as `arrow-left`, `bell-01` and `calendar`.
`kozmosIconNames` lists every one, and `resolveIconName` turns an alias — `add`,
`back`, `close`, `delete` — into its key. Icons with their own outlines are also
named exports, for example `import { Heart } from "@kozmos-ds/icons"`.

## Category symbols are not here

A venue's quick-access category artwork is the taxonomy's, not the design
system's. Pointr publishes and versions it, and every quick-access category
carries its own `iconUrl`; read it from there rather than importing a
component that would go stale between releases.

```tsx
import { BrowseCategoriesPanel } from "@kozmos-ds/react";
import type { CategoryPresentation } from "@kozmos-ds/product-contracts";

const categories: CategoryPresentation[] = [
  {
    id: "dining",
    label: "Dining",
    selected: false,
    iconUrl: "https://example.com/taxonomy/food-beverage-space-orange.png",
  },
];

<BrowseCategoriesPanel
  categories={categories}
  onSelect={() => {}}
  renderIcon={(category) => <img src={category.iconUrl} alt="" aria-hidden />}
/>;
```

The eight `Taxonomy*` components that shipped in 0.2.0 were removed for this
reason. `Accessibility` and `Utensils` are drawn here and stay: those are
the design system's own.

## Licence

MIT
