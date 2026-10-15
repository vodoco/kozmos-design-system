---
"@kozmos-ds/react": minor
---

`ThemeProvider density` (decision 82): `"touch"`, the default, or `"compact"`, for pointer-first desktop tools such as Pointr Cloud. Touch keeps every size as it was.

- **Compact sizes:**
  - Button: 32 at `sm`, 40 by default, 48 at `lg`.
  - IconButton: 28, 32 and 40.
  - Single-line fields: 40. That covers Input, Select, Combobox, MultiSelect, NumberInput and PasswordInput, with the actions inside a field (clear, open, steppers, show password) as tall as the field.
  - A stacked Dialog footer's buttons: 40.
  - Drawer's close is the icon button's size, 32, as Dialog's already was; its header leaves room for it.
  - Combobox's input and PasswordInput's field leave exactly the room their actions take.
- **Where it applies:**
  - The provider marks its root and its portal root, so popovers and menus follow it.
  - A nested provider inherits the density unless it names its own.
  - `DesignConfigProvider` and `KozmosTheme` take `density` too.
  - Any element marked `data-kozmos-density="touch"` keeps touch sizes for everything inside it.
- **SDK parts keep the SDK's touch geometry under any density** (Olcay, 15 Oct): an SDK screen previewed in a compact page draws as the apps draw it. Every SDK part that renders a Core control marks its root touch. That's 21 parts: the search bar and category field, the assistant panel and input bar, place details and its gallery, result cards, the route panels and fields, the floor selector, map controls, the language switcher, the map info panel, the app banner, the itinerary, the wayfinding card and the save card. AdaptiveMapShell, POICard, POIResultList and UserLocationMarker are marked as well.
- **Overriding:** a caller's own `h-*`/`w-*` class still wins over a control's density size.
- It needs `@kozmos-ds/tokens` with `css/density.css`, which `style.css` includes.
