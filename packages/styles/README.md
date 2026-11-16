# @kozmos-ds/styles

The Kozmos design system's stylesheet, shared by every Kozmos web package. It holds the tokens for both themes and
both densities, the owned `.kozmos-*` rules, a preflight scoped to Kozmos's parts, and the utilities those parts
draw with. It ships no JavaScript.

`@kozmos-ds/react` depends on it and ships the same file as `@kozmos-ds/react/style.css`, so a React product keeps
importing that. A Kozmos web package that is not React imports it from here.

## Install

```sh
npm install @kozmos-ds/styles
```

## Use

```css
@import "@kozmos-ds/styles/style.css";
```

Import it once, before your own styles. Kozmos's parts carry their own classes, so nothing outside them is styled:
the preflight is scoped, and the page keeps its own fonts, margins and form controls.

For a page that wants Kozmos's reset on its own elements too, import the opt-in host reset as well. It is
Tailwind's preflight, with nothing scoped:

```css
@import "@kozmos-ds/styles/reset.css";
```

## Dashboard modules

`dashboard.css` is the sheet of Pointr Cloud's Dashboard modules (`@kozmos-ds/react/dashboard`, which ships it as
`@kozmos-ds/react/dashboard.css`). It holds their own rules and nothing else, and reads the tokens `style.css`
declares, so it is imported after it:

```css
@import "@kozmos-ds/styles/style.css";
@import "@kozmos-ds/styles/dashboard.css";
```

`style.css` holds none of the modules' rules: a product that draws none of them does not load this file.

## Themes and density

The light theme is on `:root`; the dark theme is under `[data-theme="dark"]`. Touch density is the default;
compact, for pointer-first desktop tools, is under `[data-kozmos-density="compact"]`. `@kozmos-ds/react`'s
`ThemeProvider` sets both attributes.

## Licence

MIT. `THIRD-PARTY-NOTICES` lists what the stylesheets contain from other projects (Tailwind CSS, its preflight
from modern-normalize, and tailwindcss-animate).
