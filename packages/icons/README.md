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

## Location symbols

`LocationFollowing` and `LocationHeading` are the marks the map's location
control draws while it follows the visitor, and while the map turns with them.
They come from Pointr's Location Tracking Buttons revamp rather than the icon
library, which has no heading mark.

They are symbols, not outlines: several tones of one colour on a 36-unit canvas,
with the pointer in the middle 24. Render one at one and a half times the size
of the icons beside it and its pointer lines up with theirs.

```tsx
import { LocationHeading, NavigationPointer01 } from "@kozmos-ds/icons";

<NavigationPointer01 size={20} />;
<LocationHeading size={30} />; // the same 20px pointer, with its cone and arc
```

They draw in `currentColor`, so they take the colour of the text around them.

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
