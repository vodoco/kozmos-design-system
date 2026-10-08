# Kozmos Design System - Theming & White-labeling Guide

> **Purpose:** how Kozmos themes on its three platforms, React, SwiftUI and Jetpack Compose: its
> light and dark themes, switching between them, and the token overrides the web takes. The
> customer themes planned before the code are kept as a proposal in
> [docs/proposals/theming-plan.md](../docs/proposals/theming-plan.md).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Theme Architecture](#2-theme-architecture)
3. [Token Categories](#3-token-categories)
4. [White-label Configuration](#4-white-label-configuration)
5. [Platform Implementations](#5-platform-implementations)
6. [Dark Mode](#6-dark-mode)
7. [High Contrast Mode](#7-high-contrast-mode)
8. [Runtime Theme Switching](#8-runtime-theme-switching)
9. [Theme Validation](#9-theme-validation)
10. [Customer Onboarding](#10-customer-onboarding)

---

## 1. Overview

### What Kozmos Themes

Kozmos has one palette, Pointr's, in a light and a dark theme, on all three platforms.

|                                     | React                                     | SwiftUI                                     | Compose                                    |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Light, dark, and the system's theme | `ThemeProvider` (`defaultTheme`, `theme`) | `KozmosThemeProvider`, from `selectedTheme` | `KozmosThemeProvider`, from its theme mode |
| The default                         | `"system"`                                | `"system"`                                  | `KozmosThemeMode.SYSTEM`                   |
| Token overrides at run time         | `ThemeProvider`'s `tokens` (§4)           | none                                        | none                                       |
| Customer theme files, a theme build | none                                      | none                                        | none                                       |
| A high-contrast theme               | none (§7)                                 | none                                        | none                                       |

White-labeling goes as far as the web's `tokens` override today: the native packages draw
Kozmos's palette only, so on iOS and Android the theme fill is Pointr's `#135BEC` whatever a
client's base colour is. The customer themes, theme files, build step and onboarding written before
the code are kept in [docs/proposals/theming-plan.md](../docs/proposals/theming-plan.md).

### Key Principles

1. **Roles, not palette steps:** a part reads a role (`bg-primary`, `--semantics-border-subtle`),
   so a theme changes what the role holds, not every part.
2. **Contrast is checked:** `pnpm tokens:contrast:check` holds the colour pairs to their minimums
   in both themes (§9).
3. **The platforms agree:** the parity checks compare each platform's tokens with the others'.
4. **The theme follows the system** unless the product sets it.

---

## 2. Theme Architecture

### Token Hierarchy

The tokens live in `packages/tokens/src/tokens-light.json` and `tokens-dark.json`, in three
collections:

| Collection   | What it holds                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Primitives` | The palettes and scales: `Colors` (theme, emotional, background, foreground, transparent), `Layout`, `Radius`, `Typography`, `Opacity`… |
| `Semantics`  | The roles: `Surface`, `Border`, `Radius`, `Emotion`, `Elevation`, `Overlay`, `Motion`, `Data`, `Category`…                              |
| `Components` | Values for particular parts: `Primary Buttons`, `Secondary Buttons`, `Tertiary Buttons`, `HTML elements`                                |

A semantic token is usually a reference to a primitive: `Semantics.Border.Subtle` is
`{Primitives.Colors.background.200}`. On the web the token stylesheets keep it a reference:
`--semantics-border-subtle` is `var(--primitives-colors-background-200)`, and the themed Button's
fill is `var(--primitives-colors-theme-500)`, so an override of the primitive reaches every token
that names it (§4). The JavaScript module, Swift and Kotlin hold the resolved values (`#c7cad1`),
and Android's resources name the colour they alias. A value a transform changed on the way, an
alpha added or a unit converted, is written as the value on the web too, and so are the elevation
roles: they alias the shadow ramp, whose `--shadow-sm` to `-lg` `DesignConfigProvider` sets as
legacy aliases of its own.

Every themed component colour on the theme ramp is an alias of its step, in each theme: the
outline, ghost and link Buttons' ink
(`--components-secondary-buttons-themed-button-foreground-content-idle`) is theme 700 in both,
`var(--primitives-colors-theme-700)`. What stays a value is not on the ramp: the ink on a filled
Button, white in both themes, and the disabled greys.

### Theme File Structure

```
packages/tokens/src/
├── tokens-light.json          # Every token, light theme
├── tokens-dark.json           # Every token, dark theme
├── raw/                       # Exports of the Figma file's variable collections
├── component-contracts.json   # What the component checks hold the tokens to
└── contrast-contract.json     # The colour pairs and their minimum contrast
```

There are no per-customer theme folders. [token-implementation.md](./token-implementation.md)
has the build and its outputs.

---

## 3. Token Categories

Each category, with a variable of it as the web reads it:

| Category           | Example                                                                                |
| ------------------ | -------------------------------------------------------------------------------------- |
| Brand              | `--primitives-colors-theme-600`, the `primary` and `ring` role                         |
| Theme fill         | `--primitives-colors-theme-500`, the `theme-fill` role                                 |
| Page and text      | `--primitives-colors-background-0`, `--primitives-colors-foreground-0`                 |
| Surfaces           | `--semantics-surface-0` to `--semantics-surface-300`                                   |
| Emotions           | `--semantics-emotion-danger-surface`, `--primitives-colors-emotional-success-600`      |
| Borders            | `--semantics-border-subtle`, `--semantics-border-input`                                |
| Radius (unitless)  | `--semantics-radius-control`, `--semantics-radius-container`                           |
| Spacing (unitless) | `--primitives-layout-spacing-200`                                                      |
| Elevation          | `--semantics-elevation-raised`, `--semantics-elevation-floating`                       |
| Motion             | `--semantics-motion-duration-standard`, `--semantics-motion-easing-standard`           |
| Typography         | `--primitives-typography-font-family-primary`, `--primitives-typography-font-size-100` |
| Data visualisation | `--semantics-data-blue`                                                                |
| Components         | `--components-primary-buttons-themed-button-background-idle`                           |

**The theme fill and the theme as text (decision 59).** A prominent fill is theme 500, the
client's base colour from the Pointr Cloud Dashboard, `#135BEC` in both themes: a filled primary
Button (through `--components-primary-buttons-themed-button-background-idle`, a reference to it), a
checked Checkbox or Switch, Radio's dot, a selected Chip, the default Tag and Badge, the brand
Counter, a filled pin, the UserMessage bubble. What sits on it is the theme foreground,
`--components-primary-buttons-themed-button-foreground-content-idle`, white in both themes; never
`primary-foreground` (`--primitives-colors-foreground-1000`), which is black in the dark and reads
3.74:1 there. The theme as text, an icon, a border or a focus ring on a surface is theme 600
(`primary`, `ring`), `#1051E8` in the light and `#5887F3` in the dark, which reads 4.5:1 on the page
and the sheet in both. Slider, Progress and RouteProgressRail stay on 600 too: a 500 bar fails
against its track. SwiftUI and Compose follow the same rule through the same tokens, but take no
override at run time: their fill is Pointr's `#135BEC` (§10).

The unitless ones are shared with iOS and Android, so a web rule multiplies them:
`calc(var(--semantics-radius-container) * 1px)`. [component-inventory.md](./component-inventory.md)
and the Tailwind configuration in `packages/react/tailwind.config.js` show which roles the parts
read.

---

## 4. White-label Configuration

### 4.1 Overriding Tokens on the Web

`ThemeProvider` takes `tokens`, custom properties it sets on its element and on its portal
container, and that nested providers inherit. The token variables are declared on that same
element, so a reference there resolves against your override: **one override of theme 500 reaches
every prominent fill**: the Button's through its token, a reference to theme 500, and every other
fill by reading theme 500 itself, through the `theme-fill` role (§3) or the variable.
`pnpm test:token-references` proves it in a browser, in both themes.

The filled Button's hover and focus are references to theme 600 and its pressed to theme 700 in
the light theme; in the dark, where the ramp turns over, to 400 and 300. Set those steps and they
follow; leave them and they stay Pointr's blue. Theme 600 is also the theme as text, icons,
borders and focus rings on a surface (`primary`, `ring`), so a brand that changes 500 sets 600
too, at 4.5:1 on the page in each theme. The hover of a selected Chip, a default Tag, a default
Badge and an on ToggleButton is the Button's hover token, so it follows 600 (400) as well. An inline
property outranks the stylesheet's dark theme, so a flat set applies in both themes; pass
`{ light, dark }` instead, and every provider applies the set for its own resolved theme, a nested
one that forces the other theme included (DynamicIsland's island is always dark).

```tsx
import { Button, ThemeProvider } from "@kozmos-ds/react";

const brand = {
  light: {
    // The base colour: every prominent fill. White on it reads 5.31:1.
    "--primitives-colors-theme-500": "#0b7a5c",
    // The filled Button's hover and focus, and the theme as text, borders and
    // rings: 6.94:1 under white, and on the white page.
    "--primitives-colors-theme-600": "#096650",
    // The filled Button's pressed token: 9.30:1 under white. And the
    // outline, ghost and link Buttons' ink: 9.30:1 on the white page.
    "--primitives-colors-theme-700": "#07513f",
  },
  dark: {
    "--primitives-colors-theme-500": "#0b7a5c",
    // The ramp turns over in the dark: the hover and focus name 400, the
    // pressed token 300.
    "--primitives-colors-theme-400": "#096650",
    "--primitives-colors-theme-300": "#07513f",
    // The theme as text on the dark page: 7.52:1 on background 0 (#000000),
    // 6.31:1 on background 100 (#17191c).
    "--primitives-colors-theme-600": "#2fae86",
    // The outline, ghost and link Buttons' ink, 700 in the dark too: 11.06:1
    // on the dark page, 9.27:1 on background 100.
    "--primitives-colors-theme-700": "#5cd0aa",
  },
} as const;

export function BrandedApp() {
  return (
    <ThemeProvider defaultTheme="system" tokens={brand}>
      <Button>Book a visit</Button>
    </ThemeProvider>
  );
}
```

- **The steps your parts read:** the example sets the ones the Buttons read: 500 for the fill,
  600 and 700 for the filled Button's states (400 and 300 in the dark), 700 for the outline, ghost
  and link Buttons' ink and 600 for it hovered. A part that reads another step, a tint from theme
  0 to 200 for one, keeps Pointr's until that step is set too, or the whole ramp.
- **Override on the provider:** a reference resolves on the element that declares it, the
  provider's. Set on a descendant, `--primitives-colors-theme-500` changes the parts that read the
  ramp below it but not the tokens that name it.
- **Contrast is yours:** `pnpm tokens:contrast:check` reads the token files, not your overrides.
  The ratios above are WCAG 2.1's, worked from the hex values.
- **`DesignConfigProvider`** takes `tokens` too, beside its glass, motion and accessibility
  configuration, and passes them to the `ThemeProvider` it renders.

### 4.2 Build-time Themes

None: the token build writes Kozmos's two themes only, and no command generates another.

### 4.3 On iOS and Android

None: `KozmosColors` (SwiftUI) and `KozmosThemeTokens` (Compose) are generated from the token
files with every value resolved, and neither platform takes overrides at run time. The theme fill
there is Pointr's `#135BEC` in both themes, whatever a client's base colour is.

---

## 5. Platform Implementations

### 5.1 React (Web)

`ThemeProvider` is the boundary a theme applies inside: it renders an element with
`data-kozmos-root` and `data-theme` (`light` or `dark`), and `@kozmos-ds/react/style.css` defines
the token variables for each theme on it (troubleshooting.md §3.1). Its props:

| Prop                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `defaultTheme`       | `"light"`, `"dark"` or `"system"` (the default), uncontrolled             |
| `theme`              | The same, controlled: the caller owns the preference and its persistence  |
| `onThemeChange`      | Called with the new preference when `setTheme` is called                  |
| `storageKey`         | Opt-in persistence in `localStorage`, under a key your product owns       |
| `defaultSystemTheme` | What `"system"` renders on the server and in the first render (`"light"`) |
| `dir`                | `"ltr"` or `"rtl"`, for the element and for Radix's `DirectionProvider`   |
| `tokens`             | Token overrides (§4)                                                      |

`useTheme()` returns `theme`, `resolvedTheme` and `setTheme`, and throws outside a provider.

### 5.2 iOS (SwiftUI)

`KozmosThemeProvider { … }` reads the preference from `@AppStorage("selectedTheme")` (`"light"`,
`"dark"` or `"system"`) in its `ThemeManager`, which it provides as an environment object, and
applies it with `.preferredColorScheme`, which sets the scheme of the whole presentation it is in.
`KozmosColors` holds a light and a dark value for each colour, and SwiftUI picks one for the
scheme a view draws in; `.environment(\.colorScheme, …)` sets it for one view.

```swift
import SwiftUI
import Kozmos

@main
struct GuideApp: App {
    var body: some Scene {
        WindowGroup {
            KozmosThemeProvider {
                KozmosButton("Book a visit") {}
            }
        }
    }
}
```

### 5.3 Android (Jetpack Compose)

`KozmosThemeProvider { … }` (`com.kozmos.components.themeprovider`) keeps a `KozmosThemeManager`,
whose mode is `KozmosThemeMode.SYSTEM` until set, provides it as `LocalThemeManager`, and provides
`LocalKozmosUseDarkTokens` and a Material 3 theme to match. The components read
`KozmosThemeTokens`, which follows `LocalKozmosUseDarkTokens`.

```kotlin
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.themeprovider.KozmosThemeMode
import com.kozmos.components.themeprovider.KozmosThemeProvider
import com.kozmos.components.themeprovider.LocalThemeManager

@Composable
fun GuideScreen() {
    KozmosThemeProvider {
        val themeManager = LocalThemeManager.current
        KozmosButton(onClick = { themeManager.setThemeMode(KozmosThemeMode.DARK) }) {
            Text("Dark")
        }
    }
}
```

The mode lives in a `remember`, so it is not persisted.

### 5.4 React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What
this section held, from the original scope, is kept as a proposal in
[docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 6. Dark Mode

### 6.1 How Each Platform Switches

- **Web:** `ThemeProvider` sets `data-theme="dark"`, and the stylesheet redefines every token
  variable for it. The standalone token CSS does the same under `[data-theme="dark"]`
  (`@kozmos-ds/tokens/css/dark.css`).
- **SwiftUI:** each `KozmosColors` colour resolves for the view's colour scheme.
- **Compose:** each `KozmosThemeTokens` colour reads `LocalKozmosUseDarkTokens`, or the system's
  theme without a provider.

### 6.2 Dark Mode Best Practices

1. **Read roles, never a literal:** a hex value, or a Tailwind palette class such as `bg-white`,
   stays the same in the dark theme.
2. **Read `KozmosThemeTokens` in Compose,** not `KozmosColors` or `KozmosColorsDark`, which hold one
   theme each.
3. **Check both themes:** the visual review draws every story in light and dark, and the story
   audit runs axe in both.

---

## 7. High Contrast Mode

### 7.1 High Contrast Tokens

None: the tokens have no high-contrast theme, and `KozmosColors` picks a colour by light or dark
only, not by iOS's Increase Contrast setting.

### 7.2 Windows High Contrast Support

`@kozmos-ds/react/style.css` has no `forced-colors` rules, so in Windows' contrast themes the
browser's own forced colours apply. [accessibility-guide.md](./accessibility-guide.md) §7.4 has
what an app can add.

---

## 8. Runtime Theme Switching

### 8.1 Theme Switcher Component

```tsx
import { SegmentedControl, useTheme, type Theme } from "@kozmos-ds/react";

const choices = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      label="Theme"
      value={theme}
      items={choices}
      onValueChange={(next) => {
        if (next) setTheme(next as Theme);
      }}
    />
  );
}
```

### 8.2 Persisting Theme Preference

Persistence is opt-in: give `ThemeProvider` a `storageKey` your product owns, and it stores the
preference in `localStorage` and reads it back after mounting. A controlled `theme` stores nothing:
keep it where your product keeps its settings.

### 8.3 No Flash on Load

The provider renders `defaultSystemTheme` until it has mounted, so pass the theme you know on the
server as `theme` ([troubleshooting.md](./troubleshooting.md) §3.2).

---

## 9. Theme Validation

### 9.1 Contrast Validation

`pnpm tokens:contrast:check` (`scripts/check-token-contrast.mjs`) holds every pair in
`packages/tokens/src/contrast-contract.json`, and every button emotion in each of its states, to its
minimum contrast, in the light and the dark theme.

### 9.2 CI Validation

CI's `Web Build & Test` runs the contrast check and the parity checks. Among them,
`pnpm tokens:theme:check` keeps every component drawing in the theme it is in: no Compose source
reads a one-theme palette, and only the theme provider sets a window's colour scheme.

---

## 10. Customer Onboarding

There is no onboarding tooling: no theme file, no command that builds a customer theme, and no
theme request process. A customer's brand on the web is a set of `tokens` overrides (§4); on iOS
and Android it is not possible yet. The quick start and request template written before the code
are kept in [docs/proposals/theming-plan.md](../docs/proposals/theming-plan.md).

---

## Related Documents

- [Token Implementation](./token-implementation.md) — the token source, build and outputs
- [Design Philosophy](./design-philosophy.md) — Visual language principles
- [Accessibility Guide](./accessibility-guide.md) — Contrast requirements

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-10-07
