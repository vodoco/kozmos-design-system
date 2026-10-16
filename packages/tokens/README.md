# @kozmos-ds/tokens

The Kozmos design tokens, generated from one source for the web, iOS and
Android.

## Install

```sh
npm install @kozmos-ds/tokens
```

## CSS

```css
@import "@kozmos-ds/tokens/css/light.css";
@import "@kozmos-ds/tokens/css/dark.css";
@import "@kozmos-ds/tokens/css/density.css";
```

The light file defines every variable on `:root`; the dark file redefines them
under `[data-theme="dark"]`, so setting that attribute on `<html>` switches the
theme.

The density file holds the control sizes (decision 82), web only. Touch, the
default, is on `:root` and on `[data-kozmos-density="touch"]`: buttons and text
fields 44, icon buttons 44 and 48. Compact, for pointer-first desktop tools, is
on `[data-kozmos-density="compact"]`: buttons 32, 40 and 48, icon buttons 28,
32 and 40, text fields 40. The sizes are in rem (44 is `2.75rem`), so they follow
the reader's font size. Either attribute sets the sizes for everything inside
the element that carries it. `@kozmos-ds/react`'s `style.css` includes this
file, and `ThemeProvider density` and `DensityScope` set the attribute.

A token that is an alias of another is written as a reference to it:
`--components-primary-buttons-themed-button-background-idle` is
`var(--primitives-colors-theme-500)`. Override the token it names on the same
element and both change. The elevation roles, and any value a transform
changed, are written as their values; the JavaScript, Swift and Kotlin outputs
hold every value resolved.

```css
.panel {
  background: var(--primitives-colors-background-0);
  border-radius: calc(var(--semantics-radius-container) * 1px);
}
```

The semantic radius roles are unitless numbers, so that the web, iOS and Android read one scale — hence the `calc`. The primitive radii, such as `--primitives-radius-sm`, carry units. The files are also reachable by their built paths,
such as `@kozmos-ds/tokens/dist/css/variables-light.css`.

## JavaScript

```ts
import {
  PrimitivesColorsTheme500,
  SemanticsRadiusControl,
} from "@kozmos-ds/tokens";

PrimitivesColorsTheme500; // "#135bec"
SemanticsRadiusControl; // 16
```

Every token is a named export, as ES module or CommonJS. **These are the light
theme's values** — the module has no dark counterpart; use the CSS variables
where the theme can change.

## Swift and Kotlin

Generated sources ship under `dist/ios` and `dist/android`. The Kozmos iOS and Android packages carry copies of these same files: `pnpm tokens:native:copy` copies them over after a build, and `pnpm tokens:copies:check` fails while any copy differs.

## Licence

MIT
