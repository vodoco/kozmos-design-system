# Kozmos Design System - Token Implementation Guide

> **Purpose:** This document provides complete implementation details for the design token system, including Style Dictionary configuration, token structure, and platform-specific output.

---

## Table of Contents

1. [Token Architecture Overview](#1-token-architecture-overview)
2. [DTCG Token Format](#2-dtcg-token-format)
3. [Token Source Files](#3-token-source-files)
4. [Style Dictionary Configuration](#4-style-dictionary-configuration)
5. [Platform Transforms](#5-platform-transforms)
6. [Generated Output](#6-generated-output)
7. [Figma Variables Sync](#7-figma-variables-sync)
8. [Theming Implementation](#8-theming-implementation)
9. [Token Usage Examples](#9-token-usage-examples)
10. [Validation & Testing](#10-validation--testing)

---

## 1. Token Architecture Overview

### Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIGMA VARIABLES                            │
│  (Source of Truth for Colors, Typography, Spacing)             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TOKENS.JSON (DTCG)                          │
│  packages/tokens/src/tokens.json                                │
│  - Foundation tokens (raw values)                               │
│  - Semantic tokens (references)                                 │
│  - Component tokens (component-scoped)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STYLE DICTIONARY V4                          │
│  packages/tokens/sd.config.js                                   │
│  - Parses DTCG format                                           │
│  - Resolves references                                          │
│  - Applies transforms                                           │
│  - Generates platform output                                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│      WEB        │ │       iOS       │ │    ANDROID      │
│  CSS Variables  │ │  Swift Tokens   │ │  Kotlin Tokens  │
│  + TypeScript   │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Token Categories

| Category       | Description                           | Example                                                   |
| -------------- | ------------------------------------- | --------------------------------------------------------- |
| **Foundation** | Raw values, no references             | `color.blue.500: #2563eb`                                 |
| **Semantic**   | References to foundation, contextual  | `color.text.primary → {color.neutral.900}`                |
| **Component**  | Component-scoped, references semantic | `button.background.primary → {color.interactive.primary}` |

---

## 2. DTCG Token Format

### W3C Design Tokens Community Group Specification

Kozmos uses the DTCG format (W3C Draft Specification) for token definitions.

### Basic Token Structure

```json
{
  "tokenName": {
    "$type": "color",
    "$value": "#2563eb",
    "$description": "Primary brand color"
  }
}
```

### Token Types

| Type          | Description     | Example Value                   |
| ------------- | --------------- | ------------------------------- |
| `color`       | Color value     | `#2563eb`, `oklch(55% 0.2 260)` |
| `dimension`   | Size with unit  | `16px`, `1rem`                  |
| `fontFamily`  | Font stack      | `system-ui, sans-serif`         |
| `fontWeight`  | Font weight     | `400`, `bold`                   |
| `duration`    | Time value      | `200ms`                         |
| `cubicBezier` | Easing curve    | `[0.4, 0, 0.2, 1]`              |
| `number`      | Unitless number | `1.5`, `100`                    |
| `shadow`      | Shadow object   | Complex object                  |
| `typography`  | Composite type  | Font size, weight, line height  |

### Reference Syntax

```json
{
  "color": {
    "text": {
      "primary": {
        "$type": "color",
        "$value": "{color.neutral.900}",
        "$description": "Primary text color"
      }
    }
  }
}
```

---

## 3. Token Source Files

### Directory Structure

```
packages/tokens/
├── src/
│   ├── tokens.json           # Main token file
│   ├── foundations/
│   │   ├── colors.json       # Color palette
│   │   ├── typography.json   # Font tokens
│   │   ├── spacing.json      # Space scale
│   │   ├── radius.json       # Border radius
│   │   ├── shadows.json      # Shadow tokens
│   │   └── motion.json       # Animation tokens
│   ├── semantic/
│   │   ├── colors.json       # Semantic color mappings
│   │   └── typography.json   # Semantic type styles
│   ├── components/
│   │   ├── button.json       # Button-specific tokens
│   │   ├── input.json        # Input-specific tokens
│   │   └── ...
│   └── themes/
│       ├── light.json        # Light mode overrides
│       └── dark.json         # Dark mode overrides
├── build/                    # Generated output
├── sd.config.js              # Style Dictionary config
└── package.json
```

### Main Token File

```json
// packages/tokens/src/tokens.json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "kozmos-tokens",
  "$description": "Kozmos Design System Tokens",

  "color": {
    "$description": "Color tokens",

    "blue": {
      "50": { "$type": "color", "$value": "#eff6ff" },
      "100": { "$type": "color", "$value": "#dbeafe" },
      "200": { "$type": "color", "$value": "#bfdbfe" },
      "300": { "$type": "color", "$value": "#93c5fd" },
      "400": { "$type": "color", "$value": "#60a5fa" },
      "500": { "$type": "color", "$value": "#3b82f6" },
      "600": { "$type": "color", "$value": "#2563eb" },
      "700": { "$type": "color", "$value": "#1d4ed8" },
      "800": { "$type": "color", "$value": "#1e40af" },
      "900": { "$type": "color", "$value": "#1e3a8a" },
      "950": { "$type": "color", "$value": "#172554" }
    },

    "neutral": {
      "0": { "$type": "color", "$value": "#ffffff" },
      "50": { "$type": "color", "$value": "#fafafa" },
      "100": { "$type": "color", "$value": "#f5f5f5" },
      "200": { "$type": "color", "$value": "#e5e5e5" },
      "300": { "$type": "color", "$value": "#d4d4d4" },
      "400": { "$type": "color", "$value": "#a3a3a3" },
      "500": { "$type": "color", "$value": "#737373" },
      "600": { "$type": "color", "$value": "#525252" },
      "700": { "$type": "color", "$value": "#404040" },
      "800": { "$type": "color", "$value": "#262626" },
      "900": { "$type": "color", "$value": "#171717" },
      "950": { "$type": "color", "$value": "#0a0a0a" }
    },

    "status": {
      "error": { "$type": "color", "$value": "#dc2626" },
      "success": { "$type": "color", "$value": "#16a34a" },
      "warning": { "$type": "color", "$value": "#d97706" },
      "info": { "$type": "color", "$value": "#2563eb" }
    }
  },

  "space": {
    "0": { "$type": "dimension", "$value": "0px" },
    "100": { "$type": "dimension", "$value": "4px" },
    "200": { "$type": "dimension", "$value": "8px" },
    "300": { "$type": "dimension", "$value": "12px" },
    "400": { "$type": "dimension", "$value": "16px" },
    "500": { "$type": "dimension", "$value": "20px" },
    "600": { "$type": "dimension", "$value": "24px" },
    "800": { "$type": "dimension", "$value": "32px" },
    "1000": { "$type": "dimension", "$value": "40px" },
    "1200": { "$type": "dimension", "$value": "48px" },
    "1600": { "$type": "dimension", "$value": "64px" }
  },

  "radius": {
    "0": { "$type": "dimension", "$value": "0px" },
    "100": { "$type": "dimension", "$value": "4px" },
    "200": { "$type": "dimension", "$value": "8px" },
    "300": { "$type": "dimension", "$value": "12px" },
    "400": { "$type": "dimension", "$value": "16px" },
    "full": { "$type": "dimension", "$value": "9999px" }
  },

  "fontSize": {
    "100": { "$type": "dimension", "$value": "12px" },
    "200": { "$type": "dimension", "$value": "14px" },
    "300": { "$type": "dimension", "$value": "16px" },
    "400": { "$type": "dimension", "$value": "18px" },
    "500": { "$type": "dimension", "$value": "20px" },
    "600": { "$type": "dimension", "$value": "24px" },
    "700": { "$type": "dimension", "$value": "30px" },
    "800": { "$type": "dimension", "$value": "36px" },
    "900": { "$type": "dimension", "$value": "48px" }
  },

  "fontWeight": {
    "regular": { "$type": "fontWeight", "$value": "400" },
    "medium": { "$type": "fontWeight", "$value": "500" },
    "semibold": { "$type": "fontWeight", "$value": "600" },
    "bold": { "$type": "fontWeight", "$value": "700" }
  },

  "lineHeight": {
    "tight": { "$type": "number", "$value": 1.25 },
    "normal": { "$type": "number", "$value": 1.5 },
    "relaxed": { "$type": "number", "$value": 1.75 }
  },

  "motion": {
    "duration": {
      "instant": { "$type": "duration", "$value": "0ms" },
      "fast": { "$type": "duration", "$value": "100ms" },
      "normal": { "$type": "duration", "$value": "200ms" },
      "slow": { "$type": "duration", "$value": "300ms" },
      "slower": { "$type": "duration", "$value": "500ms" }
    },
    "easing": {
      "linear": { "$type": "cubicBezier", "$value": [0, 0, 1, 1] },
      "ease": { "$type": "cubicBezier", "$value": [0.25, 0.1, 0.25, 1] },
      "easeIn": { "$type": "cubicBezier", "$value": [0.4, 0, 1, 1] },
      "easeOut": { "$type": "cubicBezier", "$value": [0, 0, 0.2, 1] },
      "easeInOut": { "$type": "cubicBezier", "$value": [0.4, 0, 0.2, 1] }
    }
  },

  "shadow": {
    "100": {
      "$type": "shadow",
      "$value": {
        "offsetX": "0px",
        "offsetY": "1px",
        "blur": "2px",
        "spread": "0px",
        "color": "rgba(0, 0, 0, 0.05)"
      }
    },
    "200": {
      "$type": "shadow",
      "$value": {
        "offsetX": "0px",
        "offsetY": "2px",
        "blur": "4px",
        "spread": "-1px",
        "color": "rgba(0, 0, 0, 0.1)"
      }
    },
    "300": {
      "$type": "shadow",
      "$value": {
        "offsetX": "0px",
        "offsetY": "4px",
        "blur": "8px",
        "spread": "-2px",
        "color": "rgba(0, 0, 0, 0.1)"
      }
    }
  },

  "zIndex": {
    "hide": { "$type": "number", "$value": -1 },
    "base": { "$type": "number", "$value": 0 },
    "dropdown": { "$type": "number", "$value": 1000 },
    "sticky": { "$type": "number", "$value": 1100 },
    "overlay": { "$type": "number", "$value": 1200 },
    "modal": { "$type": "number", "$value": 1300 },
    "popover": { "$type": "number", "$value": 1400 },
    "tooltip": { "$type": "number", "$value": 1500 }
  }
}
```

### Semantic Tokens

```json
// packages/tokens/src/semantic/colors.json
{
  "color": {
    "text": {
      "primary": {
        "$type": "color",
        "$value": "{color.neutral.900}",
        "$description": "Primary text color for body content"
      },
      "secondary": {
        "$type": "color",
        "$value": "{color.neutral.600}",
        "$description": "Secondary text color for less emphasis"
      },
      "tertiary": {
        "$type": "color",
        "$value": "{color.neutral.400}",
        "$description": "Tertiary text for placeholders, disabled"
      },
      "inverse": {
        "$type": "color",
        "$value": "{color.neutral.0}",
        "$description": "Text on dark backgrounds"
      },
      "link": {
        "$type": "color",
        "$value": "{color.blue.600}",
        "$description": "Link text color"
      }
    },

    "background": {
      "primary": {
        "$type": "color",
        "$value": "{color.neutral.0}",
        "$description": "Primary background"
      },
      "secondary": {
        "$type": "color",
        "$value": "{color.neutral.50}",
        "$description": "Secondary/subtle background"
      },
      "tertiary": {
        "$type": "color",
        "$value": "{color.neutral.100}",
        "$description": "Tertiary background"
      },
      "inverse": {
        "$type": "color",
        "$value": "{color.neutral.900}",
        "$description": "Inverse/dark background"
      },
      "tooltip": {
        "$type": "color",
        "$value": "{color.neutral.800}",
        "$description": "Tooltip background"
      }
    },

    "border": {
      "default": {
        "$type": "color",
        "$value": "{color.neutral.200}",
        "$description": "Default border color"
      },
      "strong": {
        "$type": "color",
        "$value": "{color.neutral.400}",
        "$description": "Strong/emphasized border"
      },
      "focus": {
        "$type": "color",
        "$value": "{color.blue.500}",
        "$description": "Focus ring color"
      }
    },

    "interactive": {
      "primary": {
        "$type": "color",
        "$value": "{color.blue.600}",
        "$description": "Primary interactive color"
      },
      "primaryHover": {
        "$type": "color",
        "$value": "{color.blue.700}",
        "$description": "Primary interactive hover"
      },
      "primaryActive": {
        "$type": "color",
        "$value": "{color.blue.800}",
        "$description": "Primary interactive active/pressed"
      }
    }
  }
}
```

### Dark Theme Overrides

```json
// packages/tokens/src/themes/dark.json
{
  "color": {
    "text": {
      "primary": { "$type": "color", "$value": "{color.neutral.50}" },
      "secondary": { "$type": "color", "$value": "{color.neutral.300}" },
      "tertiary": { "$type": "color", "$value": "{color.neutral.500}" },
      "inverse": { "$type": "color", "$value": "{color.neutral.900}" }
    },
    "background": {
      "primary": { "$type": "color", "$value": "{color.neutral.900}" },
      "secondary": { "$type": "color", "$value": "{color.neutral.800}" },
      "tertiary": { "$type": "color", "$value": "{color.neutral.700}" },
      "inverse": { "$type": "color", "$value": "{color.neutral.50}" }
    },
    "border": {
      "default": { "$type": "color", "$value": "{color.neutral.700}" },
      "strong": { "$type": "color", "$value": "{color.neutral.500}" }
    }
  }
}
```

---

## 4. Style Dictionary Configuration

### Main Configuration File

```javascript
// packages/tokens/sd.config.js
import StyleDictionary from "style-dictionary";

// ============================================================================
// Custom Transforms
// ============================================================================

// CSS Variable reference transform
StyleDictionary.registerTransform({
  name: "css/variable",
  type: "value",
  transitive: true,
  filter: (token) => token.$type === "color" || token.$type === "dimension",
  transform: (token) => {
    if (token.original.$value?.startsWith("{")) {
      const refPath = token.original.$value.slice(1, -1).replace(/\./g, "-");
      return `var(--kozmos-${refPath})`;
    }
    return token.$value;
  },
});

// Swift Color transform
StyleDictionary.registerTransform({
  name: "swift/color",
  type: "value",
  filter: (token) => token.$type === "color",
  transform: (token) => {
    const hex = token.$value.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return `Color(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)})`;
  },
});

// Kotlin Color transform
StyleDictionary.registerTransform({
  name: "kotlin/color",
  type: "value",
  filter: (token) => token.$type === "color",
  transform: (token) => {
    const hex = token.$value.replace("#", "");
    return `Color(0xFF${hex.toUpperCase()})`;
  },
});

// Dimension to number (for Swift/Kotlin)
StyleDictionary.registerTransform({
  name: "dimension/number",
  type: "value",
  filter: (token) => token.$type === "dimension",
  transform: (token) => parseFloat(token.$value),
});

// ============================================================================
// Custom Formats
// ============================================================================

// TypeScript constants
StyleDictionary.registerFormat({
  name: "typescript/constants",
  format: ({ dictionary }) => {
    const tokens = dictionary.allTokens
      .map((token) => {
        const name = token.path.join("_").toUpperCase();
        const value =
          typeof token.$value === "string" ? `'${token.$value}'` : token.$value;
        return `export const ${name} = ${value};`;
      })
      .join("\n");

    return `// Auto-generated by Style Dictionary\n\n${tokens}\n`;
  },
});

// TypeScript object
StyleDictionary.registerFormat({
  name: "typescript/object",
  format: ({ dictionary }) => {
    const buildObject = (tokens) => {
      const result = {};
      tokens.forEach((token) => {
        let current = result;
        token.path.slice(0, -1).forEach((key) => {
          current[key] = current[key] || {};
          current = current[key];
        });
        current[token.path.slice(-1)[0]] = token.$value;
      });
      return result;
    };

    const obj = buildObject(dictionary.allTokens);
    return `// Auto-generated by Style Dictionary

export const tokens = ${JSON.stringify(obj, null, 2)} as const;

export type Tokens = typeof tokens;
`;
  },
});

// Swift extension
StyleDictionary.registerFormat({
  name: "swift/extension",
  format: ({ dictionary, options }) => {
    const generateSwift = (tokens, indent = "    ") => {
      const groups = {};

      tokens.forEach((token) => {
        const [category, ...rest] = token.path;
        if (!groups[category]) groups[category] = [];
        groups[category].push({ ...token, subPath: rest });
      });

      return Object.entries(groups)
        .map(([category, categoryTokens]) => {
          const properties = categoryTokens
            .map((token) => {
              const name = token.subPath.join("_");
              return `${indent}static let ${name} = ${token.$value}`;
            })
            .join("\n");

          return `    struct ${category} {\n${properties}\n    }`;
        })
        .join("\n\n");
    };

    return `// Auto-generated by Style Dictionary
import SwiftUI

public enum KozmosTokens {
${generateSwift(dictionary.allTokens)}
}
`;
  },
});

// Kotlin object
StyleDictionary.registerFormat({
  name: "kotlin/object",
  format: ({ dictionary }) => {
    const generateKotlin = (tokens) => {
      const groups = {};

      tokens.forEach((token) => {
        const [category, ...rest] = token.path;
        if (!groups[category]) groups[category] = [];
        groups[category].push({ ...token, subPath: rest });
      });

      return Object.entries(groups)
        .map(([category, categoryTokens]) => {
          const properties = categoryTokens
            .map((token) => {
              const name = token.subPath.join("_");
              return `        val ${name} = ${token.$value}`;
            })
            .join("\n");

          return `    object ${category} {\n${properties}\n    }`;
        })
        .join("\n\n");
    };

    return `// Auto-generated by Style Dictionary
package com.kozmos.compose.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object KozmosTokens {
${generateKotlin(dictionary.allTokens)}
}
`;
  },
});

// ============================================================================
// Configuration
// ============================================================================

export default {
  source: ["src/**/*.json"],
  platforms: {
    // CSS Variables
    css: {
      transformGroup: "css",
      transforms: ["attribute/cti", "name/kebab", "css/variable"],
      buildPath: "build/css/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: {
            outputReferences: true,
          },
        },
      ],
      prefix: "kozmos",
    },

    // CSS Dark Theme
    cssDark: {
      transformGroup: "css",
      transforms: ["attribute/cti", "name/kebab"],
      buildPath: "build/css/",
      source: ["src/themes/dark.json"],
      files: [
        {
          destination: "tokens-dark.css",
          format: "css/variables",
          options: {
            selector: '[data-theme="dark"]',
          },
        },
      ],
      prefix: "kozmos",
    },

    // TypeScript/JavaScript
    js: {
      transformGroup: "js",
      buildPath: "build/js/",
      files: [
        {
          destination: "tokens.js",
          format: "javascript/es6",
        },
        {
          destination: "tokens.d.ts",
          format: "typescript/es6-declarations",
        },
        {
          destination: "tokens-object.ts",
          format: "typescript/object",
        },
      ],
    },

    // React Native (JS values, no CSS vars)
    reactNative: {
      transformGroup: "js",
      transforms: ["attribute/cti", "name/camel", "dimension/number"],
      buildPath: "build/react-native/",
      files: [
        {
          destination: "tokens.ts",
          format: "typescript/object",
        },
      ],
    },

    // iOS (Swift)
    ios: {
      transforms: [
        "attribute/cti",
        "name/camel",
        "swift/color",
        "dimension/number",
      ],
      buildPath: "build/ios/",
      files: [
        {
          destination: "KozmosTokens.swift",
          format: "swift/extension",
        },
      ],
    },

    // Android (Kotlin)
    android: {
      transforms: [
        "attribute/cti",
        "name/camel",
        "kotlin/color",
        "dimension/number",
      ],
      buildPath: "build/android/",
      files: [
        {
          destination: "KozmosTokens.kt",
          format: "kotlin/object",
        },
      ],
    },

    // JSON (for tooling, documentation)
    json: {
      transformGroup: "js",
      buildPath: "build/json/",
      files: [
        {
          destination: "tokens.json",
          format: "json/flat",
        },
      ],
    },
  },
};
```

### Package.json Scripts

```json
// packages/tokens/package.json
{
  "name": "@kozmos/tokens",
  "version": "0.0.0",
  "description": "Design tokens for Kozmos Design System",
  "main": "./build/js/tokens.js",
  "module": "./build/js/tokens.js",
  "types": "./build/js/tokens.d.ts",
  "exports": {
    ".": {
      "import": "./build/js/tokens.js",
      "require": "./build/js/tokens.js",
      "types": "./build/js/tokens.d.ts"
    },
    "./css": "./build/css/tokens.css",
    "./css/dark": "./build/css/tokens-dark.css",
    "./react-native": {
      "import": "./build/react-native/tokens.ts",
      "types": "./build/react-native/tokens.ts"
    }
  },
  "files": ["build"],
  "scripts": {
    "build": "style-dictionary build --config sd.config.js",
    "build:watch": "nodemon --watch src -e json --exec 'pnpm build'",
    "clean": "rm -rf build",
    "validate": "node scripts/validate-tokens.js",
    "sync:figma": "node scripts/sync-figma.js"
  },
  "devDependencies": {
    "style-dictionary": "^4.0.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## 5. Platform Transforms

### Transform Summary

| Platform         | Transforms Applied               | Output Format         |
| ---------------- | -------------------------------- | --------------------- |
| **CSS**          | `name/kebab`, `css/variable`     | CSS custom properties |
| **JavaScript**   | `name/camel`                     | ES6 exports           |
| **React Native** | `name/camel`, `dimension/number` | TS object             |
| **iOS**          | `name/camel`, `swift/color`      | Swift extension       |
| **Android**      | `name/camel`, `kotlin/color`     | Kotlin object         |

### CSS Transform Example

```
Input:  { color: { blue: { 500: { $value: "#3b82f6" }}}}
Output: --kozmos-color-blue-500: #3b82f6;
```

### Swift Transform Example

```
Input:  { color: { blue: { 500: { $value: "#3b82f6" }}}}
Output: static let blue_500 = Color(red: 0.231, green: 0.510, blue: 0.965)
```

### Kotlin Transform Example

```
Input:  { color: { blue: { 500: { $value: "#3b82f6" }}}}
Output: val blue_500 = Color(0xFF3B82F6)
```

---

## 6. Generated Output

### CSS Output

```css
/* build/css/tokens.css */
:root {
  /* Colors - Blue */
  --kozmos-color-blue-50: #eff6ff;
  --kozmos-color-blue-100: #dbeafe;
  --kozmos-color-blue-500: #3b82f6;
  --kozmos-color-blue-600: #2563eb;
  /* ... */

  /* Semantic Colors */
  --kozmos-color-text-primary: var(--kozmos-color-neutral-900);
  --kozmos-color-text-secondary: var(--kozmos-color-neutral-600);
  --kozmos-color-background-primary: var(--kozmos-color-neutral-0);
  /* ... */

  /* Spacing */
  --kozmos-space-100: 4px;
  --kozmos-space-200: 8px;
  --kozmos-space-400: 16px;
  /* ... */

  /* Typography */
  --kozmos-font-size-200: 14px;
  --kozmos-font-size-300: 16px;
  --kozmos-font-weight-regular: 400;
  --kozmos-font-weight-medium: 500;
  /* ... */

  /* Motion */
  --kozmos-motion-duration-fast: 100ms;
  --kozmos-motion-duration-normal: 200ms;
  --kozmos-motion-easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  /* ... */
}
```

### CSS Dark Theme

```css
/* build/css/tokens-dark.css */
[data-theme="dark"] {
  --kozmos-color-text-primary: var(--kozmos-color-neutral-50);
  --kozmos-color-text-secondary: var(--kozmos-color-neutral-300);
  --kozmos-color-background-primary: var(--kozmos-color-neutral-900);
  --kozmos-color-background-secondary: var(--kozmos-color-neutral-800);
  --kozmos-color-border-default: var(--kozmos-color-neutral-700);
}
```

### TypeScript Output

```typescript
// build/js/tokens-object.ts
export const tokens = {
  color: {
    blue: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
    },
    text: {
      primary: "var(--kozmos-color-neutral-900)",
      secondary: "var(--kozmos-color-neutral-600)",
    },
    // ...
  },
  space: {
    100: "4px",
    200: "8px",
    400: "16px",
  },
  // ...
} as const;

export type Tokens = typeof tokens;
```

### Swift Output

```swift
// build/ios/KozmosTokens.swift
import SwiftUI

public enum KozmosTokens {
    struct color {
        struct blue {
            static let _50 = Color(red: 0.937, green: 0.965, blue: 1.000)
            static let _500 = Color(red: 0.231, green: 0.510, blue: 0.965)
            static let _600 = Color(red: 0.145, green: 0.388, blue: 0.922)
        }

        struct text {
            static let primary = Color(red: 0.090, green: 0.090, blue: 0.090)
            static let secondary = Color(red: 0.322, green: 0.322, blue: 0.322)
        }
    }

    struct space {
        static let _100: CGFloat = 4
        static let _200: CGFloat = 8
        static let _400: CGFloat = 16
    }

    struct fontSize {
        static let _200: CGFloat = 14
        static let _300: CGFloat = 16
    }
}
```

### Kotlin Output

```kotlin
// build/android/KozmosTokens.kt
package com.kozmos.compose.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object KozmosTokens {
    object color {
        object blue {
            val _50 = Color(0xFFEFF6FF)
            val _500 = Color(0xFF3B82F6)
            val _600 = Color(0xFF2563EB)
        }

        object text {
            val primary = Color(0xFF171717)
            val secondary = Color(0xFF525252)
        }
    }

    object space {
        val _100 = 4.dp
        val _200 = 8.dp
        val _400 = 16.dp
    }

    object fontSize {
        val _200 = 14.sp
        val _300 = 16.sp
    }
}
```

---

## 7. Figma Variables Sync

### Sync Script

```typescript
// scripts/sync-figma.ts
import * as Figma from "figma-api";
import { writeFileSync } from "fs";

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN!;
const FILE_KEY = process.env.FIGMA_FILE_KEY!;

const api = new Figma.Api({ personalAccessToken: FIGMA_TOKEN });

interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING";
  valuesByMode: Record<string, any>;
}

async function syncFigmaVariables() {
  console.log("🔄 Fetching Figma variables...");

  const response = await api.getLocalVariables(FILE_KEY);
  const variables = response.meta.variables;
  const collections = response.meta.variableCollections;

  const tokens: Record<string, any> = {};

  for (const [id, variable] of Object.entries(variables)) {
    const path = variable.name.split("/");
    const value = convertFigmaValue(variable);

    setNestedValue(tokens, path, {
      $type: getTokenType(variable.resolvedType),
      $value: value,
    });
  }

  writeFileSync(
    "packages/tokens/src/figma-sync.json",
    JSON.stringify(tokens, null, 2),
  );

  console.log("✅ Figma variables synced to figma-sync.json");
}

function convertFigmaValue(variable: FigmaVariable): any {
  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  if (variable.resolvedType === "COLOR") {
    const { r, g, b, a } = value;
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  if (variable.resolvedType === "FLOAT") {
    return `${value}px`;
  }

  return value;
}

function getTokenType(figmaType: string): string {
  switch (figmaType) {
    case "COLOR":
      return "color";
    case "FLOAT":
      return "dimension";
    case "STRING":
      return "string";
    default:
      return "string";
  }
}

function setNestedValue(obj: any, path: string[], value: any) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = current[path[i]] || {};
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

syncFigmaVariables().catch(console.error);
```

### Figma Variable Naming Convention

Figma variables should be named to match token paths:

```
Figma Variable Name     →     Token Path
────────────────────────────────────────
color/blue/500          →     color.blue.500
space/400               →     space.400
color/text/primary      →     color.text.primary
```

---

## 8. Theming Implementation

### React ThemeProvider

```tsx
// packages/react/src/theme/ThemeProvider.tsx
import * as React from "react";
import "@kozmos/tokens/css";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "kozmos-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light",
  );

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) setThemeState(stored);
  }, [storageKey]);

  React.useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      const resolved =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

      setResolvedTheme(resolved);
      root.setAttribute("data-theme", resolved);
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);
    },
    [storageKey],
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

### iOS Theme Support

```swift
// packages/ios/Sources/KozmosSwiftUI/Theme/KozmosTheme.swift
import SwiftUI

public enum KozmosColorScheme {
    case light
    case dark
    case system
}

public class KozmosTheme: ObservableObject {
    @Published public var colorScheme: KozmosColorScheme = .system

    public static let shared = KozmosTheme()

    public func color(_ keyPath: KeyPath<KozmosTokens.color.Type, Color>) -> Color {
        KozmosTokens.color[keyPath: keyPath]
    }
}

public struct KozmosThemeProvider<Content: View>: View {
    @ObservedObject private var theme = KozmosTheme.shared
    @Environment(\.colorScheme) private var systemColorScheme

    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .preferredColorScheme(resolvedColorScheme)
            .environmentObject(theme)
    }

    private var resolvedColorScheme: ColorScheme? {
        switch theme.colorScheme {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
}
```

---

## 9. Token Usage Examples

### React Usage

```tsx
import { tokens } from "@kozmos/tokens";
import "@kozmos/tokens/css";

// CSS Variables (recommended)
const styles = {
  color: "var(--kozmos-color-text-primary)",
  padding: "var(--kozmos-space-400)",
  borderRadius: "var(--kozmos-radius-200)",
};

// JavaScript values (for dynamic usage)
const dynamicColor = tokens.color.blue[500];
```

### iOS Usage

```swift
import KozmosSwiftUI

Text("Hello")
    .foregroundColor(KozmosTokens.color.text.primary)
    .padding(KozmosTokens.space._400)
```

### Android Usage

```kotlin
import com.kozmos.compose.tokens.KozmosTokens

Text(
    text = "Hello",
    color = KozmosTokens.color.text.primary,
    modifier = Modifier.padding(KozmosTokens.space._400)
)
```

### React Native Usage

```tsx
import { tokens } from "@kozmos/tokens/react-native";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.background.primary,
    padding: tokens.space[400],
    borderRadius: tokens.radius[200],
  },
});
```

---

## 10. Validation & Testing

### Token Validation Script

No `scripts/validate-tokens.ts` exists and no package has a `validate` script; the sketch below is
not run by anything. What CI checks is under [CI Token Build Test](#ci-token-build-test).

```typescript
// scripts/validate-tokens.ts
import tokens from "../src/tokens.json";

interface ValidationError {
  path: string;
  message: string;
}

const errors: ValidationError[] = [];

function validateToken(path: string, token: any) {
  // Check required fields
  if (!token.$type) {
    errors.push({ path, message: "Missing $type" });
  }

  if (token.$value === undefined) {
    errors.push({ path, message: "Missing $value" });
  }

  // Validate color format
  if (token.$type === "color") {
    const value = token.$value;
    if (typeof value === "string" && !value.startsWith("{")) {
      if (!value.match(/^#[0-9a-fA-F]{6}$/)) {
        errors.push({ path, message: `Invalid color format: ${value}` });
      }
    }
  }

  // Validate dimension format
  if (token.$type === "dimension") {
    const value = token.$value;
    if (typeof value === "string" && !value.startsWith("{")) {
      if (!value.match(/^-?\d+(\.\d+)?(px|rem|em|%)$/)) {
        errors.push({ path, message: `Invalid dimension format: ${value}` });
      }
    }
  }
}

function walkTokens(obj: any, path = "") {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (key.startsWith("$")) continue;

    if (value && typeof value === "object" && "$value" in value) {
      validateToken(currentPath, value);
    } else if (value && typeof value === "object") {
      walkTokens(value, currentPath);
    }
  }
}

walkTokens(tokens);

if (errors.length > 0) {
  console.error("❌ Token validation failed:\n");
  errors.forEach((e) => console.error(`  ${e.path}: ${e.message}`));
  process.exit(1);
} else {
  console.log("✅ All tokens valid");
}
```

### CI Token Build Test

There is no `tokens.yml`. The tokens are built and checked inside `.github/workflows/ci.yml`:

- **`Web Build & Test`** builds them with everything else (`pnpm build`), checks that
  `packages/tokens/dist/css/variables-light.css` came out, and runs the token checks, among them
  `pnpm tokens:contrast:check`, `tokens:radius:check`, `tokens:border:check`,
  `tokens:theme:check`, `tokens:copies:check`, `tokens:elevation:check`, `tokens:raw:check`,
  `tokens:unitless:check`, `tokens:typography:check` and `tokens:motion:check`.
- **`iOS Build`** and **`Android Build`** build them first
  (`pnpm --filter @kozmos-ds/tokens build`) and check that `KozmosColors.swift` and
  `KozmosColors.kt` came out.

Tokens change from Figma through `.github/workflows/figma-tokens.yml`, a manual workflow that opens
a pull request ([ci-cd-configuration.md](./ci-cd-configuration.md)).

---

## Quick Reference

### Build Commands

```bash
pnpm tokens:build            # Build all token outputs (pnpm --filter @kozmos-ds/tokens build)
pnpm tokens:contrast:check   # The contrast contract, light and dark
pnpm tokens:native:copy      # Copy the native token files into packages/ios and packages/android
pnpm tokens:copies:check     # Those copies match the build
pnpm tokens:sync             # Sync from Figma (FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY in the environment)
```

### File Locations

```
Source:         packages/tokens/src/tokens.json, tokens-light.json, tokens-dark.json
CSS Output:     packages/tokens/dist/css/variables-light.css, variables-dark.css
JS Output:      packages/tokens/dist/js/tokens.js (and tokens.mjs, with declarations)
Swift Output:   packages/tokens/dist/ios/KozmosColors.swift and the other Kozmos*.swift files
Kotlin Output:  packages/tokens/dist/android/src/main/java/com/kozmos/tokens/KozmosColors.kt and the rest
```

---

## Version History

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 1.0.0   | 2026-02-07 | Initial token implementation guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
