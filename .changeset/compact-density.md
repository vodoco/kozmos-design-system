---
"@kozmos-ds/react": minor
---

`ThemeProvider density` (decision 82): `"touch"`, the default, or `"compact"`, for pointer-first desktop tools such as Pointr Cloud. Touch keeps every size as it was.

- **Compact sizes:**
  - Button: 32 at `sm`, 40 by default, 48 at `lg`.
  - IconButton: 28, 32 and 40.
  - Single-line fields: 40. That covers Input, Select, Combobox, MultiSelect, NumberInput and PasswordInput, with the actions inside a field (clear, open, steppers, show password) as tall as the field.
  - A stacked Dialog footer's buttons: 40.
  - Dialog's and Drawer's close are the icon button's size, 32, and stay centred on the title as touch centres them; the title and Drawer's header leave room for them.
  - Combobox's input and PasswordInput's field leave exactly the room their actions take.
- **Where it applies:**
  - The provider marks its root and its portal root, so popovers and menus follow it.
  - A nested provider inherits the density unless it names its own.
  - `DesignConfigProvider` and `KozmosTheme` take `density` too.
  - Outside any provider the controls draw at touch sizes.
- **`DensityScope`**, new: one region at another density inside a provider, such as a compact tool panel on a touch page. Its controls, the providers nested in it and the popovers it opens take its `density`, and the theme, tokens and design configuration around it carry on. `asChild` marks its one child instead of adding an element. Every element a Kozmos portal renders now carries `data-kozmos-density` for the density where it opened.
- **SDK parts keep the SDK's touch geometry under any density** (Olcay, 15 Oct): an SDK screen previewed in a compact page draws as the apps draw it. Every SDK part's root, all 42, is a touch `DensityScope`, so a provider nested in one and the popovers it opens stay touch too. A product's own content inside an SDK part, such as `AdaptiveMapShell`, is touch as well unless the product wraps it in `DensityScope density="compact"`.
- **Overriding:** a caller's own `h-*`/`w-*` class still wins over a control's density size.
- It needs `@kozmos-ds/tokens` with `css/density.css`, which `style.css` includes.
