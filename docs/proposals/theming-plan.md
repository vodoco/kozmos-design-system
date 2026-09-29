# Proposal: not built — customer themes and white-labeling

> **Proposal: not built.** This is the theming system written before the code: customer theme
> files, a theme schema, a `defineConfig` in `@kozmos-ds/tokens`, a build step that generates a
> customer's theme, `npx @kozmos-ds/tokens build --theme`, high-contrast tokens, oklch colours,
> and a `KozmosThemeProvider` for React. None of it exists. Kozmos has one palette in a light and
> a dark theme; on the web, `ThemeProvider` takes `tokens`, custom properties that override the
> palette's variables, and the native packages take no overrides. The token files are
> `packages/tokens/src/tokens-light.json` and `tokens-dark.json`, not the folders below. It is
> kept as planning history; the sections below were in `.ai-skills/theming-guide.md` until
> 2026-09-29.

## Proposal: from `.ai-skills/theming-guide.md`

These sections were in [`theming-guide.md`](../../.ai-skills/theming-guide.md), where each heading now says what is built instead.

### Proposal: 1. Overview

#### Proposal: White-labeling Strategy

Kozmos supports three levels of customization:

| Level                  | What's Customizable                | Use Case             |
| ---------------------- | ---------------------------------- | -------------------- |
| **Brand Colors**       | Primary, secondary, accent colors  | All customers        |
| **Full Theme**         | Colors, typography, spacing, radii | Enterprise customers |
| **Component Override** | Individual component styles        | Custom integrations  |

#### Proposal: Key Principles

1. **Token-based theming** — All styles derive from tokens
2. **Semantic tokens** — Use `color-primary`, not `color-blue`
3. **Contrast preservation** — Ensure WCAG AA compliance
4. **Platform consistency** — Same theme works across all platforms
5. **Runtime switching** — Support light/dark/system modes
6. **Minimal footprint** — Only ship what's needed

### Proposal: 2. Theme Architecture

#### Proposal: Token Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Token Hierarchy                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Primitive Tokens (Raw values)                                          │
│  ├── color.blue.500: oklch(0.55 0.22 264)                              │
│  ├── color.neutral.100: oklch(0.97 0 0)                                │
│  └── spacing.4: 16px                                                    │
│                                                                          │
│          ↓ Reference                                                     │
│                                                                          │
│  Semantic Tokens (Purpose-based)                                        │
│  ├── color.primary: {color.blue.500}                                   │
│  ├── color.background.default: {color.neutral.100}                     │
│  └── spacing.component.padding: {spacing.4}                            │
│                                                                          │
│          ↓ Reference                                                     │
│                                                                          │
│  Component Tokens (Component-specific)                                  │
│  ├── button.primary.background: {color.primary}                        │
│  ├── button.primary.text: {color.on-primary}                           │
│  └── button.padding: {spacing.component.padding}                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Proposal: Theme File Structure

```
packages/tokens/
├── src/
│   ├── primitives/
│   │   ├── colors.json          # Raw color palette (Display P3)
│   │   ├── typography.json      # Font families, sizes, weights
│   │   ├── spacing.json         # Spacing scale
│   │   └── radii.json           # Border radius scale
│   │
│   ├── semantic/
│   │   ├── colors.light.json    # Light mode semantic colors
│   │   ├── colors.dark.json     # Dark mode semantic colors
│   │   ├── typography.json      # Semantic type styles
│   │   └── spacing.json         # Semantic spacing
│   │
│   ├── components/
│   │   ├── button.json          # Button-specific tokens
│   │   ├── input.json           # Input-specific tokens
│   │   └── ...
│   │
│   └── themes/
│       ├── default/
│       │   └── theme.json       # Default Pointr theme
│       ├── customer-a/
│       │   └── theme.json       # Customer A overrides
│       └── customer-b/
│           └── theme.json       # Customer B overrides
```

### Proposal: 3. Token Categories

#### Proposal: 3.1 Brand Colors (Always Customizable)

```json
// themes/customer-a/theme.json
{
  "$schema": "../../schemas/theme.schema.json",
  "name": "Customer A",
  "brand": {
    "primary": {
      "$value": "oklch(0.65 0.18 145)",
      "$description": "Customer A brand green"
    },
    "secondary": {
      "$value": "oklch(0.55 0.12 280)",
      "$description": "Customer A accent purple"
    },
    "accent": {
      "$value": "oklch(0.70 0.20 45)",
      "$description": "Customer A highlight orange"
    }
  }
}
```

#### Proposal: 3.2 Semantic Colors (Derived from Brand)

```json
{
  "color": {
    "primary": { "$value": "{brand.primary}" },
    "primary-hover": {
      "$value": "oklch(from {brand.primary} calc(l - 0.05) c h)"
    },
    "primary-active": {
      "$value": "oklch(from {brand.primary} calc(l - 0.10) c h)"
    },
    "on-primary": { "$value": "#ffffff" },

    "secondary": { "$value": "{brand.secondary}" },
    "on-secondary": { "$value": "#ffffff" },

    "background": {
      "default": { "$value": "{primitive.neutral.50}" },
      "subtle": { "$value": "{primitive.neutral.100}" },
      "muted": { "$value": "{primitive.neutral.200}" }
    },

    "foreground": {
      "default": { "$value": "{primitive.neutral.900}" },
      "muted": { "$value": "{primitive.neutral.600}" },
      "subtle": { "$value": "{primitive.neutral.400}" }
    },

    "border": {
      "default": { "$value": "{primitive.neutral.200}" },
      "strong": { "$value": "{primitive.neutral.300}" }
    },

    "success": { "$value": "{primitive.green.500}" },
    "warning": { "$value": "{primitive.yellow.500}" },
    "error": { "$value": "{primitive.red.500}" },
    "info": { "$value": "{primitive.blue.500}" }
  }
}
```

#### Proposal: 3.3 Emotional Colors (Customer Configurable)

```json
{
  "emotional": {
    "wayfinding": {
      "$value": "{brand.primary}",
      "$description": "Color for navigation paths and waypoints"
    },
    "destination": {
      "$value": "{brand.accent}",
      "$description": "Color for destination markers"
    },
    "poi-default": {
      "$value": "{primitive.neutral.500}",
      "$description": "Default POI marker color"
    },
    "poi-highlight": {
      "$value": "{brand.secondary}",
      "$description": "Highlighted POI color"
    },
    "route-primary": {
      "$value": "{brand.primary}",
      "$description": "Primary navigation route"
    },
    "route-alternative": {
      "$value": "{primitive.neutral.400}",
      "$description": "Alternative route options"
    }
  }
}
```

#### Proposal: 3.4 Typography

```json
{
  "typography": {
    "fontFamily": {
      "sans": {
        "$value": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      },
      "mono": { "$value": "'JetBrains Mono', monospace" }
    },
    "fontSize": {
      "xs": { "$value": "0.75rem" },
      "sm": { "$value": "0.875rem" },
      "base": { "$value": "1rem" },
      "lg": { "$value": "1.125rem" },
      "xl": { "$value": "1.25rem" },
      "2xl": { "$value": "1.5rem" },
      "3xl": { "$value": "1.875rem" }
    },
    "fontWeight": {
      "normal": { "$value": "400" },
      "medium": { "$value": "500" },
      "semibold": { "$value": "600" },
      "bold": { "$value": "700" }
    },
    "lineHeight": {
      "tight": { "$value": "1.25" },
      "normal": { "$value": "1.5" },
      "relaxed": { "$value": "1.75" }
    }
  }
}
```

#### Proposal: 3.5 Spacing & Layout

```json
{
  "spacing": {
    "0": { "$value": "0" },
    "1": { "$value": "4px" },
    "2": { "$value": "8px" },
    "3": { "$value": "12px" },
    "4": { "$value": "16px" },
    "5": { "$value": "20px" },
    "6": { "$value": "24px" },
    "8": { "$value": "32px" },
    "10": { "$value": "40px" },
    "12": { "$value": "48px" },
    "16": { "$value": "64px" }
  },
  "radius": {
    "none": { "$value": "0" },
    "sm": { "$value": "4px" },
    "md": { "$value": "8px" },
    "lg": { "$value": "12px" },
    "xl": { "$value": "16px" },
    "full": { "$value": "9999px" }
  }
}
```

### Proposal: 4. White-label Configuration

#### Proposal: 4.1 Theme Configuration File

```typescript
// kozmos.config.ts
import { defineConfig } from "@kozmos-ds/tokens";

export default defineConfig({
  // Customer identification
  customer: "customer-a",

  // Theme overrides
  theme: {
    brand: {
      primary: "oklch(0.65 0.18 145)", // Customer green
      secondary: "oklch(0.55 0.12 280)", // Customer purple
      accent: "oklch(0.70 0.20 45)", // Customer orange
    },

    // Optional: Override specific semantic tokens
    semantic: {
      "color.success": "oklch(0.60 0.20 150)",
    },

    // Optional: Override typography
    typography: {
      fontFamily: {
        sans: "'Roboto', sans-serif",
      },
    },

    // Optional: Override radius scale
    radius: {
      md: "4px", // Sharper corners
    },
  },

  // Feature flags
  features: {
    darkMode: true,
    highContrast: true,
    rtl: true,
  },

  // Output configuration
  output: {
    css: true,
    swift: true,
    kotlin: true,
    reactNative: true,
  },
});
```

#### Proposal: 4.2 Build-time Theme Generation

```typescript
// scripts/build-theme.ts
import StyleDictionary from "style-dictionary";
import { loadConfig } from "./config-loader";

async function buildCustomerTheme(customerId: string) {
  const config = await loadConfig(customerId);

  const sd = new StyleDictionary({
    source: [
      "src/primitives/**/*.json",
      "src/semantic/**/*.json",
      `src/themes/${customerId}/**/*.json`,
    ],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: `dist/${customerId}/`,
        files: [
          {
            destination: "tokens.css",
            format: "css/variables",
            options: {
              selector: `:root, [data-theme="${customerId}"]`,
            },
          },
        ],
      },
      swift: {
        transformGroup: "swift",
        buildPath: `dist/${customerId}/ios/`,
        files: [
          {
            destination: "KozmosTokens.swift",
            format: "ios-swift/class.swift",
            className: "KozmosTokens",
          },
        ],
      },
      kotlin: {
        transformGroup: "compose",
        buildPath: `dist/${customerId}/android/`,
        files: [
          {
            destination: "KozmosTokens.kt",
            format: "compose/object",
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();
}
```

#### Proposal: 4.3 Runtime Theme Override

```typescript
// For dynamic theming at runtime
interface ThemeOverrides {
  brand?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  radius?: {
    md?: string;
  };
}

function applyThemeOverrides(overrides: ThemeOverrides) {
  const root = document.documentElement;

  if (overrides.brand?.primary) {
    root.style.setProperty("--kozmos-color-primary", overrides.brand.primary);
    // Also update derived colors
    root.style.setProperty(
      "--kozmos-color-primary-hover",
      adjustLightness(overrides.brand.primary, -0.05),
    );
  }

  if (overrides.radius?.md) {
    root.style.setProperty("--kozmos-radius-md", overrides.radius.md);
  }
}
```

### Proposal: 5. Platform Implementations

#### Proposal: 5.1 React (Web) - CSS Variables

```tsx
// ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  customTokens?: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function KozmosThemeProvider({
  children,
  defaultTheme = "system",
  customTokens,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  customTokens?: Record<string, string>;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

  useEffect(() => {
    // Apply custom tokens
    if (customTokens) {
      const root = document.documentElement;
      Object.entries(customTokens).forEach(([key, value]) => {
        root.style.setProperty(`--kozmos-${key}`, value);
      });
    }
  }, [customTokens]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateColorScheme = () => {
      const resolvedScheme =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

      setColorScheme(resolvedScheme as ColorScheme);
      document.documentElement.setAttribute(
        "data-color-scheme",
        resolvedScheme,
      );
    };

    updateColorScheme();
    mediaQuery.addEventListener("change", updateColorScheme);
    return () => mediaQuery.removeEventListener("change", updateColorScheme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, colorScheme, setTheme, customTokens }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme must be used within KozmosThemeProvider");
  return context;
}
```

```css
/* tokens.css - Generated by Style Dictionary */
:root,
[data-color-scheme="light"] {
  --kozmos-color-primary: oklch(0.55 0.22 264);
  --kozmos-color-primary-hover: oklch(0.5 0.22 264);
  --kozmos-color-primary-active: oklch(0.45 0.22 264);
  --kozmos-color-on-primary: #ffffff;

  --kozmos-color-background-default: oklch(0.99 0 0);
  --kozmos-color-background-subtle: oklch(0.97 0 0);
  --kozmos-color-foreground-default: oklch(0.15 0 0);
  --kozmos-color-foreground-muted: oklch(0.4 0 0);

  --kozmos-color-border-default: oklch(0.9 0 0);

  --kozmos-radius-md: 8px;
  --kozmos-spacing-4: 16px;
}

[data-color-scheme="dark"] {
  --kozmos-color-primary: oklch(0.65 0.2 264);
  --kozmos-color-primary-hover: oklch(0.7 0.2 264);
  --kozmos-color-on-primary: #000000;

  --kozmos-color-background-default: oklch(0.15 0 0);
  --kozmos-color-background-subtle: oklch(0.2 0 0);
  --kozmos-color-foreground-default: oklch(0.95 0 0);
  --kozmos-color-foreground-muted: oklch(0.7 0 0);

  --kozmos-color-border-default: oklch(0.3 0 0);
}

/* Customer theme override example */
[data-theme="customer-a"] {
  --kozmos-color-primary: oklch(0.65 0.18 145);
  --kozmos-color-primary-hover: oklch(0.6 0.18 145);
}
```

#### Proposal: 5.2 iOS (SwiftUI)

```swift
// KozmosTheme.swift
import SwiftUI

public struct KozmosTheme {
    public enum ColorScheme {
        case light
        case dark
        case system
    }

    // Brand colors (customizable)
    public var primary: Color
    public var secondary: Color
    public var accent: Color

    // Semantic colors (derived)
    public var background: Color
    public var foreground: Color
    public var border: Color

    // Status colors
    public var success: Color
    public var warning: Color
    public var error: Color

    public static let `default` = KozmosTheme(
        primary: Color("Primary", bundle: .kozmos),
        secondary: Color("Secondary", bundle: .kozmos),
        accent: Color("Accent", bundle: .kozmos),
        background: Color("Background", bundle: .kozmos),
        foreground: Color("Foreground", bundle: .kozmos),
        border: Color("Border", bundle: .kozmos),
        success: Color("Success", bundle: .kozmos),
        warning: Color("Warning", bundle: .kozmos),
        error: Color("Error", bundle: .kozmos)
    )

    public static func custom(
        primary: Color,
        secondary: Color? = nil,
        accent: Color? = nil
    ) -> KozmosTheme {
        var theme = KozmosTheme.default
        theme.primary = primary
        theme.secondary = secondary ?? theme.secondary
        theme.accent = accent ?? theme.accent
        return theme
    }
}

// Environment key
struct KozmosThemeKey: EnvironmentKey {
    static let defaultValue = KozmosTheme.default
}

extension EnvironmentValues {
    public var kozmosTheme: KozmosTheme {
        get { self[KozmosThemeKey.self] }
        set { self[KozmosThemeKey.self] = newValue }
    }
}

// Theme provider
public struct KozmosThemeProvider<Content: View>: View {
    let theme: KozmosTheme
    let colorScheme: KozmosTheme.ColorScheme
    let content: Content

    @Environment(\.colorScheme) private var systemColorScheme

    public init(
        theme: KozmosTheme = .default,
        colorScheme: KozmosTheme.ColorScheme = .system,
        @ViewBuilder content: () -> Content
    ) {
        self.theme = theme
        self.colorScheme = colorScheme
        self.content = content()
    }

    public var body: some View {
        content
            .environment(\.kozmosTheme, theme)
            .preferredColorScheme(resolvedColorScheme)
    }

    private var resolvedColorScheme: SwiftUI.ColorScheme? {
        switch colorScheme {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
}

// Usage in components
struct KozmosButton: View {
    @Environment(\.kozmosTheme) var theme

    var body: some View {
        Button("Navigate") {}
            .foregroundColor(theme.primary)
    }
}
```

#### Proposal: 5.3 Android (Jetpack Compose)

```kotlin
// KozmosTheme.kt
package com.pointr.kozmos.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color

@Immutable
data class KozmosColors(
    val primary: Color,
    val primaryHover: Color,
    val onPrimary: Color,
    val secondary: Color,
    val onSecondary: Color,
    val background: Color,
    val backgroundSubtle: Color,
    val foreground: Color,
    val foregroundMuted: Color,
    val border: Color,
    val success: Color,
    val warning: Color,
    val error: Color,
    val isDark: Boolean
)

val LocalKozmosColors = staticCompositionLocalOf { lightKozmosColors() }

fun lightKozmosColors(
    primary: Color = Color(0xFF2563EB),
    secondary: Color = Color(0xFF7C3AED)
) = KozmosColors(
    primary = primary,
    primaryHover = primary.copy(alpha = 0.9f),
    onPrimary = Color.White,
    secondary = secondary,
    onSecondary = Color.White,
    background = Color(0xFFFAFAFA),
    backgroundSubtle = Color(0xFFF5F5F5),
    foreground = Color(0xFF171717),
    foregroundMuted = Color(0xFF737373),
    border = Color(0xFFE5E5E5),
    success = Color(0xFF22C55E),
    warning = Color(0xFFF59E0B),
    error = Color(0xFFEF4444),
    isDark = false
)

fun darkKozmosColors(
    primary: Color = Color(0xFF60A5FA),
    secondary: Color = Color(0xFFA78BFA)
) = KozmosColors(
    primary = primary,
    primaryHover = primary.copy(alpha = 0.9f),
    onPrimary = Color.Black,
    secondary = secondary,
    onSecondary = Color.Black,
    background = Color(0xFF171717),
    backgroundSubtle = Color(0xFF262626),
    foreground = Color(0xFFFAFAFA),
    foregroundMuted = Color(0xFFA3A3A3),
    border = Color(0xFF404040),
    success = Color(0xFF4ADE80),
    warning = Color(0xFFFBBF24),
    error = Color(0xFFF87171),
    isDark = true
)

@Composable
fun KozmosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    customPrimary: Color? = null,
    customSecondary: Color? = null,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        darkKozmosColors(
            primary = customPrimary ?: Color(0xFF60A5FA),
            secondary = customSecondary ?: Color(0xFFA78BFA)
        )
    } else {
        lightKozmosColors(
            primary = customPrimary ?: Color(0xFF2563EB),
            secondary = customSecondary ?: Color(0xFF7C3AED)
        )
    }

    CompositionLocalProvider(LocalKozmosColors provides colors) {
        content()
    }
}

// Extension for easy access
object KozmosTheme {
    val colors: KozmosColors
        @Composable
        @ReadOnlyComposable
        get() = LocalKozmosColors.current
}

// Usage
@Composable
fun KozmosButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            containerColor = KozmosTheme.colors.primary,
            contentColor = KozmosTheme.colors.onPrimary
        )
    ) {
        Text(text)
    }
}
```

#### Proposal: 5.4 React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

### Proposal: 6. Dark Mode

#### Proposal: 6.1 Color Adjustments for Dark Mode

```json
// semantic/colors.dark.json
{
  "color": {
    "primary": {
      "$value": "oklch(0.70 0.18 264)",
      "$description": "Lighter primary for dark backgrounds"
    },
    "primary-hover": {
      "$value": "oklch(0.75 0.18 264)"
    },
    "on-primary": {
      "$value": "#000000",
      "$description": "Dark text on light primary"
    },

    "background": {
      "default": { "$value": "oklch(0.15 0 0)" },
      "subtle": { "$value": "oklch(0.18 0 0)" },
      "elevated": { "$value": "oklch(0.22 0 0)" }
    },

    "foreground": {
      "default": { "$value": "oklch(0.95 0 0)" },
      "muted": { "$value": "oklch(0.70 0 0)" }
    },

    "border": {
      "default": { "$value": "oklch(0.30 0.01 0)" }
    }
  }
}
```

#### Proposal: 6.2 Dark Mode Best Practices

```css
/* Elevation through brightness, not shadows */
[data-color-scheme="dark"] {
  /* Level 0: Base */
  --kozmos-surface-0: oklch(0.15 0 0);

  /* Level 1: Cards */
  --kozmos-surface-1: oklch(0.18 0 0);

  /* Level 2: Popovers */
  --kozmos-surface-2: oklch(0.22 0 0);

  /* Level 3: Modals */
  --kozmos-surface-3: oklch(0.25 0 0);

  /* Shadows are subtle in dark mode */
  --kozmos-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Images and media */
[data-color-scheme="dark"] img {
  filter: brightness(0.9) contrast(1.1);
}

/* Reduce pure white */
[data-color-scheme="dark"] {
  --kozmos-color-white: oklch(0.95 0 0);
}
```

### Proposal: 7. High Contrast Mode

#### Proposal: 7.1 High Contrast Tokens

```json
// semantic/colors.high-contrast.json
{
  "color": {
    "primary": {
      "$value": "oklch(0.45 0.30 264)",
      "$description": "Higher saturation for visibility"
    },
    "foreground": {
      "default": { "$value": "#000000" }
    },
    "background": {
      "default": { "$value": "#ffffff" }
    },
    "border": {
      "default": { "$value": "#000000" }
    },
    "focus-ring": {
      "$value": "#000000",
      "$description": "Maximum contrast focus"
    }
  }
}
```

#### Proposal: 7.2 Windows High Contrast Support

```css
@media (forced-colors: active) {
  .kozmos-button {
    border: 2px solid ButtonText;
    background: ButtonFace;
    color: ButtonText;
  }

  .kozmos-button:hover {
    border-color: Highlight;
  }

  .kozmos-button:focus {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  .kozmos-button:disabled {
    border-color: GrayText;
    color: GrayText;
  }

  .kozmos-input {
    border: 2px solid ButtonText;
    background: Field;
    color: FieldText;
  }

  .kozmos-link {
    color: LinkText;
  }

  .kozmos-link:visited {
    color: VisitedText;
  }
}
```

### Proposal: 8. Runtime Theme Switching

#### Proposal: 8.1 Theme Switcher Component

```tsx
// ThemeSwitcher.tsx
import { useTheme } from "@kozmos-ds/react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <KozmosSegmentedControl
      value={theme}
      onChange={setTheme}
      options={[
        { value: "light", label: "Light", icon: <SunIcon /> },
        { value: "dark", label: "Dark", icon: <MoonIcon /> },
        { value: "system", label: "System", icon: <MonitorIcon /> },
      ]}
      aria-label="Color theme"
    />
  );
}
```

#### Proposal: 8.2 Persisting Theme Preference

```typescript
// hooks/usePersistedTheme.ts
import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "kozmos-theme-preference";

export function usePersistedTheme(defaultTheme: Theme = "system") {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(STORAGE_KEY) as Theme) || defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
```

#### Proposal: 8.3 No Flash on Load

```html
<!-- Add to <head> before any stylesheets -->
<script>
  (function () {
    const theme = localStorage.getItem("kozmos-theme-preference");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const colorScheme =
      theme === "system" || !theme ? (prefersDark ? "dark" : "light") : theme;
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
  })();
</script>
```

### Proposal: 9. Theme Validation

#### Proposal: 9.1 Contrast Validation

```typescript
// scripts/validate-theme.ts
import { oklch, wcagContrast } from "culori";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateTheme(theme: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check text contrast
  const textOnBackground = wcagContrast(
    theme["color-foreground-default"],
    theme["color-background-default"],
  );

  if (textOnBackground < 4.5) {
    errors.push(
      `Text contrast too low: ${textOnBackground.toFixed(2)} (needs 4.5:1)`,
    );
  }

  // Check primary button contrast
  const textOnPrimary = wcagContrast(
    theme["color-on-primary"],
    theme["color-primary"],
  );

  if (textOnPrimary < 4.5) {
    errors.push(`Primary button contrast too low: ${textOnPrimary.toFixed(2)}`);
  }

  // Check focus ring contrast
  const focusOnBackground = wcagContrast(
    theme["color-focus-ring"],
    theme["color-background-default"],
  );

  if (focusOnBackground < 3) {
    warnings.push(
      `Focus ring contrast could be improved: ${focusOnBackground.toFixed(2)}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

#### Proposal: 9.2 CI Validation

There is no theme-validation workflow and no `validate:themes` or `check:contrast` script. CI's
`Web Build & Test` job (`.github/workflows/ci.yml`) checks themes on every pull request with these:

```bash
# Every contrast pair in packages/tokens/src/contrast-contract.json, in light and dark
pnpm tokens:contrast:check

# The native palettes follow the theme: Compose reads its generated themed accessor
pnpm tokens:theme:check

# Themes and stylesheets stay scoped to their module, in a browser
pnpm test:themes
```

### Proposal: 10. Customer Onboarding

#### Proposal: 10.1 Quick Start Guide

````markdown
# Setting Up Your Brand Theme

## Step 1: Prepare Your Colors

Provide your brand colors in any format:

- Hex: #2563EB
- RGB: rgb(37, 99, 235)
- HSL: hsl(220, 83%, 53%)
- oklch: oklch(0.55 0.22 264) (recommended)

We need:

- **Primary**: Main brand color (buttons, links)
- **Secondary**: Accent color (optional)
- **Accent**: Highlight color (optional)

## Step 2: Create Theme File

```json
// themes/your-company/theme.json
{
  "name": "Your Company",
  "brand": {
    "primary": "#YOUR_PRIMARY_COLOR",
    "secondary": "#YOUR_SECONDARY_COLOR"
  }
}
```

## Step 3: Generate Theme

```bash
npx @kozmos-ds/tokens build --theme your-company
```

## Step 4: Use in Your App

```tsx
import "@kozmos-ds/tokens/themes/your-company.css";

<KozmosThemeProvider theme="your-company">
  <App />
</KozmosThemeProvider>;
```
````

#### Proposal: 10.2 Theme Request Template

```yaml
# Customer Theme Request

## Company Information
- Company Name:
- Contact Email:
- SDK Platforms: [ ] Web [ ] iOS [ ] Android

## Brand Colors
- Primary Color:
- Secondary Color (optional):
- Accent Color (optional):

## Design Assets
- [ ] Logo (SVG preferred)
- [ ] Brand Guidelines PDF
- [ ] Figma link (if available)

## Requirements
- [ ] Dark mode support needed
- [ ] High contrast mode needed
- [ ] RTL language support needed
- [ ] Custom typography needed

## Notes
Additional requirements or preferences:
```
