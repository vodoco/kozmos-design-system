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
`back`, `close`, `delete`, a taxonomy type such as `boarding-gate` — into its key. Icons with their own outlines are also
named exports, for example `import { Heart } from "@kozmos-ds/icons"`.

`kozmosIconNamesBeyondTheLibrary` lists 29 more names a lookup takes, the ones
SwiftUI's and Compose's `KozmosIcon` draw beyond the registry: the 23 wayfinding
glyphs of Pointr Maps - Express in the kebab case of their export names
(`elevator-up`, `stairs-no-direction`, `security-control`, `shuttle` and the
rest), the outlines `log-in-01`, `log-out-01`, `arrow-up-right` and
`arrow-down-right`, and the map controls' `layers-three-01` (`LayersThree01`)
and `walking` (`Walking`). They are not in `kozmosIconNames` or `kozmosIconDefinitions`,
the set the Figma icons page pairs with the Pointr icon library, so
`getIconDefinition` returns nothing for them.

A named export brings in that icon alone: 0.4 to 1.9 KB gzip with the code
that draws it. A lookup by name brings in every icon a name can reach, the
registry's 72 and the 29, about 23.4 KB gzip today, because any of them could
be asked for. That covers `getIconComponent`, `isKozmosIconKey` and
`@kozmos-ds/react`'s `Icon`, which takes a `name`, so importing `Icon` pays it
even where every use passes `icon`. The registry alone is 14.9 KB, and
`getIconDefinition` and the definitions, which carry each icon's Figma node,
category and description, 16.9 to 17.4 KB.
Import the icon when you know which one you need, and look it up when the name
comes from data.

## Vue

`@kozmos-ds/icons/vue` has every icon, name and lookup the React entry has, as
Vue 3 functional components drawing the same `<svg>`. Vue is an optional peer
dependency, so a React app installs nothing new:

```sh
npm install @kozmos-ds/icons vue
```

```vue
<script setup lang="ts">
import { Calendar, getIconComponent } from "@kozmos-ds/icons/vue";

const Back = getIconComponent("back");
</script>

<template>
  <Calendar :size="20" aria-hidden="true" />
  <component :is="Back" :size="24" :stroke-width="1.5" class="me-2" />
</template>
```

The props are React's: `size`, `color`, `strokeWidth` and `absoluteStrokeWidth`.
`class`, `style`, `aria-*` and the rest fall through to the `<svg>`, and win
over the icon's own, as React's spread does. A named import brings in that icon
alone, as it does in React.

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

## The venue set

Fifteen names for what a visitor looks for in a place, with the aliases a
product already holds (GAP-105, site GAP-79, the product register's decisions
119 and 121). Their definitions say `Venue categories`, `Venue amenities` or
`Venue services`. SwiftUI's and Compose's `KozmosIcon` draw the same names from
the same artwork, and the Figma Icons page follows.

```tsx
import { Icon } from "@kozmos-ds/react";

<Icon name="utensils" />;
<Icon name="food-beverage-space" />; // the same glyph, by its taxonomy type
```

| Group    | Name                  | Aliases                                                   | Where Pointr's quick access asks for it (taxonomy 10.16.0)             |
| -------- | --------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Category | `utensils`            | `food-beverage-space`, `dining`                           | Dining, Food & Drink, Food & Cafés: every sector                       |
| Category | `medical-cross`       | `medical-space`, `first-aid`                              | Emergency (healthcare), Guest Services (hospitality)                   |
| Category | `plane`               | `boarding-gate`                                           | Gates (aviation)                                                       |
| Category | `clapperboard`        | `entertainment-space`, `movie-theater`                    | Entertainment (retail), Relax & Play (hospitality)                     |
| Category | `graduation-hat-01`   | `education-space`                                         | Learning & Study (education)                                           |
| Category | `beaker-01`           | `laboratory`                                              | Research & Labs (education), Diagnostics (healthcare)                  |
| Amenity  | `accessibility`       |                                                           | Accessible Places: every sector                                        |
| Amenity  | `credit-card-01`      | `atm`, `checkout`                                         | Guest Services (hospitality), Checkout (retail)                        |
| Amenity  | `battery-charging-01` | `charging-station`, `device-charging`                     | Guest Services (hospitality)                                           |
| Amenity  | `droplets-01`         | `water-refill-station`, `hydration`                       | none; `equipment/water-refill-station` in aviation, healthcare, retail |
| Service  | `luggage-01`          | `bag-drop-checkin`, `baggage-reclaim`, `baggage-services` | Check-in & Baggage (aviation), Travel Services (public transportation) |
| Service  | `passport`            | `passport-control`, `customs-immigration`                 | Security & Immigration (aviation)                                      |
| Service  | `ticket-01`           | `ticketing`                                               | Tickets & Info (public transportation)                                 |
| Service  | `package`             | `order-collect`                                           | Click & Collect (retail)                                               |
| Service  | `scissors-01`         | `salon`                                                   | Wellness & Spirituality: every sector                                  |

The taxonomy's other everyday types reach names the registry already held:
`retail-space` and `shopping` draw `shopping-bag-02`, `transportation-space` and
`bus-station` `bus`, `amenity-space` and `information` `info-circle`, `wifi-zone`
`wifi`, `shuttle-station` `shuttle`, `security-space` `security-control`,
`entrance-exit`, `entrance` and `exit` the `route-` glyphs, `elevator`,
`escalator`, `stairs` and `ramp` their direction-free wayfinding glyphs, and
`favourite` `heart`.

**How it was chosen.** From the quick-access files Pointr publishes for each
sector, because a quick-access category is what a venue's visitors are offered
first: a category's head (the artwork it publishes) goes in when
`@kozmos-ds/icons` holds the same thing, and a type or service a category only
matches on goes in when it also costs at most 0.25 KB gzip in a lookup. An
amenity is an `equipment` type a visitor uses, on the same price. Every name is
the thing itself, or it is not here: a stand-in says something else. `utensils`
and `accessibility` are this package's own artwork, and the rest Pointr's.
An alias is a taxonomy `mainType` or `subType` as published, a `serviceTypes`
value in kebab case, or a word BrowseCategoriesPanel's stories pass as
`iconName`. A `subType` several `mainType`s share (`desk`, `office`, `kiosk`,
`lounge`) means nothing alone, and has none.

**What was left out, and why.**

- **No glyph exists.** Toilets, parking, prayer rooms, spas and wellness, gyms,
  baby care and children, pets, fashion, hotel rooms, lounges, smoking rooms and
  meeting rooms: neither the names nor the tags of the Pointr library hold them.
  They keep the taxonomy's own `iconUrl`. Toilets and parking are the two a
  venue shows first, and need artwork, which is not this list's to draw.
- **Too dear for how little asks.** `car-01` (Car Rental, `rideshare-pickup`, 0.37
  KB), `printer` (one workplace matcher, 0.39 KB), `gaming-pad-01` (`arcade`, 0.37
  KB) and `bank` (0.41 KB). Each is a named export, and a tag can pass `iconUrl`.
- **Nothing asks.** `coins-swap-01` (Currency Exchange) and `gift-01`: a
  service type no quick-access file matches. `train` and `tram`: the taxonomy has
  no rail type in 10.16.0.
- **UI glyphs.** `copy-01`, `star-01`, `pencil-01`, `help-circle`, `book-open-01`
  and the like stay named imports, `<Icon icon={Copy01} />`, whatever a board
  asks (decision 121). `translate-01` goes with them: the language switch draws
  it.
- **MAP-64.** Its boards ask for no venue name: they draw `Copy01`, `Star01`,
  `HelpCircle` and the like as named imports, and everything else they name was
  already here.

## Category artwork is not here

A venue's own quick-access artwork is the taxonomy's, not the design system's.
Pointr publishes and versions it, and every quick-access category carries its
own `iconUrl`; read it from there rather than importing a component that would
go stale between releases. The venue set above is the design system's glyph for
a place, for a product that has no artwork, or none for that place.

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
the design system's own, and both are in the venue set.

## Licence

MIT
