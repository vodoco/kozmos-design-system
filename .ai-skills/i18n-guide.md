# Kozmos Design System - Internationalization (i18n) Implementation Guide

> **Purpose:** This document provides comprehensive internationalization guidelines for implementing multi-language support on the Kozmos Design System's three platforms, React, SwiftUI and Jetpack Compose, including RTL support for Arabic and Hebrew.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Supported Languages](#2-supported-languages)
3. [Translation Architecture](#3-translation-architecture)
4. [Platform Implementations](#4-platform-implementations)
5. [RTL (Right-to-Left) Support](#5-rtl-right-to-left-support)
6. [Date, Time & Number Formatting](#6-date-time--number-formatting)
7. [Pluralization](#7-pluralization)
8. [Translation Workflow](#8-translation-workflow)
9. [Testing i18n](#9-testing-i18n)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

### i18n Strategy

Kozmos ships no translation catalogue or i18n library. Components accept many visible and
accessible labels through props, often with an English default (POIResultCard's `featuredLabel`
defaults to "Featured"). An app passes in the text produced by its own translation system.
This is not a claim that every string on every platform is overridable: inspect the relevant
component API and record any hardcoded text as a localization gap. Native Chip now accepts
`removeLabel` for the complete localized removal action name in both SwiftUI initializers and
the Compose localized overload. Its default remains English (`Remove <text>`); the app must
pass its translation. Existing Compose positional calls and trailing click lambdas remain supported.

AdaptiveMapShell accepts `controlsLabel` (default "Map controls") and
`bottomControlsLabel` (default "Map corner controls") on React, SwiftUI and Compose.
Pass distinct, non-empty translated names when both slots are present. These name
containers, not their child buttons, which retain their own localized labels and actions.

| What              | Who does it                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Translations**  | The app, with its own library and files; Kozmos takes the translated words as props          |
| **Direction**     | `ThemeProvider dir="rtl"` on the web; the platform's layout direction on SwiftUI and Compose |
| **Formatting**    | The app: `Intl` on the web, the platform's formatters natively                               |
| **Pluralization** | The app's message format                                                                     |

A plan for Kozmos's own translation files and provider, written before the code, is kept as a
proposal in [docs/proposals/i18n-plan.md](../docs/proposals/i18n-plan.md).

### Key Principles

1. **Externalize all strings** — No hardcoded text in components
2. **Use semantic keys** — `button.submit`, not `Submit`
3. **Support interpolation** — `Hello, {name}!`
4. **Handle plurals** — ICU MessageFormat syntax
5. **Design for text expansion** — German ~30% longer than English
6. **Use logical CSS properties** — `margin-inline-start`, not `margin-left`

---

## 2. Supported Languages

Kozmos does not certify a list of fully translated languages: it has English defaults, many
overridable labels and remaining localization gaps. The app owns its locale catalogue and must
test its chosen languages, text expansion, accessible labels and RTL layouts. The language matrix planned before the code is kept in
[docs/proposals/i18n-plan.md](../docs/proposals/i18n-plan.md).

---

## 3. Translation Architecture

There is no `packages/locales` and no `@kozmos-ds/locales`: an app keeps its translations where its
own i18n library wants them. The architecture planned before the code is kept in
[docs/proposals/i18n-plan.md](../docs/proposals/i18n-plan.md).

---

## 4. Platform Implementations

### 4.1 React (Web)

Translate with the app's own library and hand Kozmos the words. `ThemeProvider`'s `dir` sets the
direction for everything inside it, Radix's keyboard handling included:

```tsx
import { Button, Input, ThemeProvider } from "@kozmos-ds/react";

// t is the app's own translation function.
export function Destination({
  t,
  dir,
}: {
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}) {
  return (
    <ThemeProvider defaultTheme="light" dir={dir}>
      <Input
        label={t("destination.label")}
        helperText={t("destination.hint")}
      />
      <Button>{t("navigation.start")}</Button>
    </ThemeProvider>
  );
}
```

### 4.2 iOS (SwiftUI)

The app's strings live in its own String Catalog or `Localizable.strings`, and Kozmos's views take
the localized text as their parameters (`KozmosButton("Save", variant: .default) { … }`). They
follow the environment's `layoutDirection`, so a right-to-left locale lays them out right to left.

### 4.3 Android (Jetpack Compose)

The app's strings live in its own `strings.xml`, read with `stringResource`, and Kozmos's
composables take the text as their content or parameters. They follow `LocalLayoutDirection`, so a
right-to-left locale lays them out right to left.

### 4.4 React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 5. RTL (Right-to-Left) Support

### 5.1 CSS Logical Properties

```css
/* ❌ Physical properties (LTR-only) */
.card {
  margin-left: 16px;
  padding-right: 24px;
  text-align: left;
  border-left: 2px solid blue;
}

/* ✅ Logical properties (LTR + RTL) */
.card {
  margin-inline-start: 16px;
  padding-inline-end: 24px;
  text-align: start;
  border-inline-start: 2px solid blue;
}
```

### 5.2 Logical Property Reference

| Physical (LTR)     | Logical                | RTL Equivalent      |
| ------------------ | ---------------------- | ------------------- |
| `left`             | `inset-inline-start`   | `right`             |
| `right`            | `inset-inline-end`     | `left`              |
| `margin-left`      | `margin-inline-start`  | `margin-right`      |
| `margin-right`     | `margin-inline-end`    | `margin-left`       |
| `padding-left`     | `padding-inline-start` | `padding-right`     |
| `padding-right`    | `padding-inline-end`   | `padding-left`      |
| `border-left`      | `border-inline-start`  | `border-right`      |
| `text-align: left` | `text-align: start`    | `text-align: right` |
| `float: left`      | `float: inline-start`  | `float: right`      |

### 5.3 Directional Icons

Icons that point somewhere flip right to left; icons of things (a check, a clock, a phone) do not. A
physical direction is the exception: a left turn is a left turn in every language, so wayfinding
marks (DirectionStep's `HardLeft`, `HardRight`, `TurnBack` and the rest) never mirror, on any
platform.
With Kozmos's `Icon`, taking the direction the app already knows:

```tsx
import { Icon } from "@kozmos-ds/react";
import type { ComponentProps } from "react";

// Icons that should flip in RTL
const MIRRORED = new Set([
  "arrow-left",
  "arrow-right",
  "chevron-left",
  "chevron-right",
  "back",
  "next",
]);

export function DirectionalIcon({
  dir,
  ...props
}: ComponentProps<typeof Icon> & { dir: "ltr" | "rtl" }) {
  const mirror =
    dir === "rtl" && props.name !== undefined && MIRRORED.has(props.name);
  return (
    <Icon
      {...props}
      style={mirror ? { ...props.style, transform: "scaleX(-1)" } : props.style}
    />
  );
}
```

`check`, `close`, `search`, `home`, `phone` and `clock` stay as they are.

### 5.4 RTL Layout Patterns

```tsx
// kozmos-skills: template — a fragment of a render; BackButton, Title and MenuButton are the app's
// Flexbox follows the direction ThemeProvider (or the page) sets: no rule of its own
<header style={{ display: "flex" }}>
  <BackButton />
  <Title>Navigation</Title>
  <MenuButton />
</header>
```

```css
/* Grid with RTL: columns follow the dir attribute */
.navigation-grid {
  display: grid;
  grid-template-columns: 1fr auto;
}

/* Absolute positioning with logical properties */
.floating-button {
  position: absolute;
  inset-block-end: 16px; /* bottom in both LTR and RTL */
  inset-inline-end: 16px; /* right in LTR, left in RTL */
}
```

### 5.5 RTL Testing Checklist

```markdown
## RTL Layout Verification

- [ ] Text alignment follows reading direction
- [ ] Navigation arrows point correctly
- [ ] Progress indicators fill correctly (right to left)
- [ ] Sliders move in correct direction
- [ ] Lists items align correctly
- [ ] Cards and containers flip appropriately
- [ ] Icons that should mirror are mirrored
- [ ] Icons that shouldn't mirror are not
- [ ] Shadows and gradients follow direction
- [ ] Animations move in correct direction
```

---

## 6. Date, Time & Number Formatting

### 6.1 Date Formatting

```tsx
export function DateDisplay({ date, locale }: { date: Date; locale: string }) {
  const text = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return <span>{text}</span>;
}

// Output by locale:
// en: "February 8, 2026"
// de: "8. Februar 2026"
// ar: "٨ فبراير ٢٠٢٦"
// ja: "2026年2月8日"
```

### 6.2 Time Formatting

```tsx
// Time in the locale's own clock: 12-hour for en-US, 24-hour for de
export function TimeDisplay({ date, locale }: { date: Date; locale: string }) {
  const text = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
  return <time dateTime={date.toISOString()}>{text}</time>;
}

// Output by locale:
// en-US: "2:30 PM"
// en-GB: "14:30"
// de: "14:30"
// ar: "٢:٣٠ م"
```

### 6.3 Relative Time

```tsx
export function RelativeTime({ date, locale }: { date: Date; locale: string }) {
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return <span>{format.format(minutes, "minute")}</span>;
}

// Output by locale, five minutes ago:
// en: "5 minutes ago"
// de: "vor 5 Minuten"
// ar: "قبل ٥ دقائق"
```

### 6.4 Number Formatting

```tsx
// Distance: metric for most locales, imperial for en-US
export function DistanceDisplay({
  meters,
  locale,
}: {
  meters: number;
  locale: string;
}) {
  const imperial = locale === "en-US";
  const text = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: imperial ? "foot" : "meter",
    maximumFractionDigits: 0,
  }).format(imperial ? meters * 3.28084 : meters);
  return <span>{text}</span>;
}

// Currency (if needed)
export function PriceDisplay({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: string;
  locale: string;
}) {
  const text = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
  return <span>{text}</span>;
}

// Output:
// en-US: "$19.99"
// de: "19,99 €"
// ja: "¥1,999"
```

---

## 7. Pluralization

### 7.1 ICU MessageFormat Syntax

```json
{
  "items": {
    "count": "{count, plural, =0 {No items} one {# item} other {# items}}"
  },
  "floors": {
    "remaining": "{count, plural, =0 {You're on the destination floor} one {# floor to go} other {# floors to go}}"
  },
  "steps": {
    "remaining": "{count, plural, =0 {Arrived!} one {# step remaining} other {# steps remaining}}"
  }
}
```

### 7.2 Complex Pluralization (Arabic)

Arabic has 6 plural forms: zero, one, two, few, many, other

```json
{
  "steps": {
    "count": "{count, plural, zero {لا توجد خطوات} one {خطوة واحدة} two {خطوتان} few {# خطوات} many {# خطوة} other {# خطوة}}"
  }
}
```

### 7.3 Gender-Specific Messages

```json
{
  "greeting": {
    "welcome": "{gender, select, male {مرحباً بك} female {مرحباً بكِ} other {مرحباً}}"
  }
}
```

### 7.4 Ordinal Numbers

```json
{
  "floor": {
    "ordinal": "{floor, selectordinal, one {#st floor} two {#nd floor} few {#rd floor} other {#th floor}}"
  }
}

// Output:
// 1 → "1st floor"
// 2 → "2nd floor"
// 3 → "3rd floor"
// 4 → "4th floor"
```

---

## 8. Translation Workflow

Kozmos has none: there is no `packages/locales`, no translation-management service is connected,
and no workflow or script extracts, syncs or validates translations. The workflow planned before
the code is kept in [docs/proposals/i18n-plan.md](../docs/proposals/i18n-plan.md).

---

## 9. Testing i18n

### 9.1 Unit Tests

An app tests its own translations with its own i18n library: Kozmos adds none to test. To check a
layout right to left, render it inside `ThemeProvider dir="rtl"`.

### 9.2 Visual Regression for RTL

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button, ThemeProvider } from "@kozmos-ds/react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
};
export default meta;
type Story = StoryObj<typeof Button>;

// ThemeProvider's dir reaches Radix's keyboard handling too, which a bare
// <div dir="rtl"> does not.
export const LTR: Story = {
  args: { children: "Submit" },
  decorators: [
    (Story) => (
      <ThemeProvider dir="ltr">
        <Story />
      </ThemeProvider>
    ),
  ],
};

export const RTL: Story = {
  args: { children: "إرسال" },
  decorators: [
    (Story) => (
      <ThemeProvider dir="rtl">
        <Story />
      </ThemeProvider>
    ),
  ],
};

// Visual Review draws both stories, in light and dark
```

### 9.3 Pseudo-localization

```typescript
// kozmos-skills: template — a sketch for the app's own i18n setup; locale, messages and mapValues are the app's
// For testing text expansion and missing translations
const pseudoLocalize = (text: string): string => {
  const chars: Record<string, string> = {
    a: "α",
    b: "ḅ",
    c: "ċ",
    d: "ḍ",
    e: "ḛ",
    // ... more mappings
  };

  return `[${text
    .split("")
    .map((c) => chars[c.toLowerCase()] || c)
    .join("")}]`;
};

// Enable pseudo-locale in dev
if (process.env.NODE_ENV === "development" && locale === "pseudo") {
  messages = mapValues(messages, pseudoLocalize);
}

// Result: "Submit" → "[ṡṳḅṃịṭ]"
// Visual: clearly shows which strings are translated
// Length: brackets indicate text expansion testing
```

---

## 10. Best Practices

### 10.1 Translation Keys

```typescript
// kozmos-skills: template — the wrong keys and the right ones; t is the app's translation function
// ❌ Bad: Generic keys
t("button1");
t("text_34");
t("label");

// ✅ Good: Semantic, namespaced keys
t("navigation.startNavigation");
t("search.placeholder");
t("errors.network");

// ❌ Bad: Full sentences as keys
t("Click here to start navigation");

// ✅ Good: Short, descriptive keys
t("navigation.startNavigation");
```

### 10.2 Interpolation

```typescript
// kozmos-skills: template — the wrong way and the right one; t and name are the app's
// ❌ Bad: Concatenation
t("greeting") + name + t("punctuation");

// ✅ Good: Interpolation
t("greeting.withName", { name });

// Translation: "Hello, {name}!"
```

### 10.3 Context for Translators

```json
{
  "navigation.arrived": {
    "message": "You have arrived!",
    "description": "Shown when user reaches their destination. Should be celebratory.",
    "maxLength": 30
  }
}
```

### 10.4 Text Expansion Planning

| Language   | Expansion vs English |
| ---------- | -------------------- |
| German     | +30%                 |
| French     | +20%                 |
| Italian    | +25%                 |
| Spanish    | +25%                 |
| Portuguese | +30%                 |
| Russian    | +30%                 |
| Japanese   | -10% to +10%         |
| Chinese    | -50% to 0%           |
| Arabic     | +25%                 |

```css
/* Design for text expansion */
.button {
  min-width: 120px; /* Accommodate longer text */
  padding-inline: 16px; /* Flexible horizontal padding */
  white-space: nowrap; /* Or allow wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Graceful truncation */
}
```

### 10.5 Dynamic Content

```typescript
// kozmos-skills: template — the wrong way and the right one; distance, date and locale are the app's
// ❌ Bad: Hardcoded units
`${distance} meters`;

// ✅ Good: Locale-aware formatting
new Intl.NumberFormat(locale, { style: "unit", unit: "meter" }).format(
  distance,
);

// ❌ Bad: Hardcoded date format
`${month}/${day}/${year}`;

// ✅ Good: Locale-aware date
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
```

---

## Related Documents

- [Component Creation Guide](./component-creation-guide.md) — i18n integration in components
- [Testing Patterns](./testing-patterns.md) — i18n test examples
- [Accessibility Guide](./accessibility-guide.md) — Language and direction for screen readers

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
