---
"@kozmos-ds/react": minor
---

`ThemeProvider density` (decision 82): `"touch"`, the default, or `"compact"`, for pointer-first desktop tools such as Pointr Cloud. Touch keeps every size as it was.

- **Compact sizes:**
  - Button: 32 at `sm`, 40 by default, 48 at `lg`.
  - IconButton: 28, 32 and 40.
  - Single-line fields: 40. That covers Input, Select, Combobox, MultiSelect, NumberInput and PasswordInput, with the actions inside a field (clear, open, steppers, show password) as tall as the field.
  - A stacked Dialog footer's buttons: 40.
- **Where it applies:**
  - The provider marks its root and its portal root, so popovers and menus follow it.
  - A nested provider inherits the density unless it names its own.
  - Any element marked `data-kozmos-density="touch"` keeps touch sizes for everything inside it.
- **SDK parts:** SearchBar, CategoryField, AIInputBar and AICompanionPanel keep the SDK's touch geometry under any density.
- **Overriding:** a caller's own `h-*`/`w-*` class still wins over a control's density size.
- It needs `@kozmos-ds/tokens` with `css/density.css`, which `style.css` includes.
