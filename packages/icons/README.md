# @kozmos-ds/icons

Icon components and the name registry for the Kozmos design system.

## Install

```sh
npm install @kozmos-ds/icons react
```

`react` is the only peer dependency. Every glyph is drawn here - the set was
re-drawn from Pointr's own outlines and `lucide-react` was removed in 0.2.0,
so nothing is pulled in behind it. The wayfinding glyphs (lifts, escalators,
stairs and ramps up, down and without direction, entrance and exit, turns,
security, shuttle and more; `src/owned/navigation-glyphs.json`) are Pointr's
own artwork from the Pointr Maps - Express design: solid shapes in the current
colour rather than outlines, which take `color` and `size` and ignore
`strokeWidth`.

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

A named export brings in that icon alone: 0.4 to 1.9 KB gzip with the code
that draws it. A lookup by name brings in every icon the registry names, about
12 KB gzip today, because any of them could be asked for. That covers
`getIconComponent`, `getIconDefinition`, `isKozmosIconKey`, the registry and
definitions themselves, and `@kozmos-ds/react`'s `Icon`, which takes a `name`.
Import the icon when you know which one you need, and look it up when the name
comes from data.

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

## The walking figure

`Walking` is the figure the SDK's position status draws beside "Walking
improves accuracy", from Pointr's Location Tracking Buttons file: the icon
library has no walking figure. It is a solid mark, not an outline, squared on
the icon grid so it stands 20 of 24 tall, and it draws in `currentColor`.

```tsx
import { Walking } from "@kozmos-ds/icons";

<Walking />; // 24px, in the colour of the text around it
```

Directions draw Pointr Maps - Express's `FollowTheLine` for walking, the same
figure in the wayfinding set's weight; `Walking` stays the position status's mark.

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
