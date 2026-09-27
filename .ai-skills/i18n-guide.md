# Kozmos Design System - Internationalization (i18n) Implementation Guide

> **Purpose:** This document provides comprehensive internationalization guidelines for implementing multi-language support across all 6 platforms in the Kozmos Design System, including RTL support for Arabic and Hebrew.

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

Kozmos Design System provides:

| Feature             | Implementation                         | Coverage            |
| ------------------- | -------------------------------------- | ------------------- |
| **Translations**    | JSON files per locale                  | All UI strings      |
| **RTL Support**     | CSS logical properties + platform APIs | Full layout flip    |
| **Formatting**      | Intl API / platform equivalents        | Date, time, numbers |
| **Pluralization**   | ICU MessageFormat                      | Complex rules       |
| **Dynamic Loading** | Lazy load per locale                   | Performance         |

### Key Principles

1. **Externalize all strings** — No hardcoded text in components
2. **Use semantic keys** — `button.submit`, not `Submit`
3. **Support interpolation** — `Hello, {name}!`
4. **Handle plurals** — ICU MessageFormat syntax
5. **Design for text expansion** — German ~30% longer than English
6. **Use logical CSS properties** — `margin-inline-start`, not `margin-left`

---

## 2. Supported Languages

### Language Matrix

| Code      | Language              | Direction | Region               | Priority    |
| --------- | --------------------- | --------- | -------------------- | ----------- |
| `en`      | English               | LTR       | Global               | ✅ Primary  |
| `de`      | German                | LTR       | DACH                 | ✅ Required |
| `fr`      | French                | LTR       | France, Canada       | ✅ Required |
| `es`      | Spanish               | LTR       | Spain, LATAM         | ✅ Required |
| `pt`      | Portuguese            | LTR       | Brazil, Portugal     | ✅ Required |
| `it`      | Italian               | LTR       | Italy                | ✅ Required |
| `nl`      | Dutch                 | LTR       | Netherlands, Belgium | ✅ Required |
| `ja`      | Japanese              | LTR       | Japan                | ✅ Required |
| `zh-Hans` | Chinese (Simplified)  | LTR       | China                | ✅ Required |
| `zh-Hant` | Chinese (Traditional) | LTR       | Taiwan, HK           | ✅ Required |
| `ko`      | Korean                | LTR       | Korea                | ✅ Required |
| `ar`      | Arabic                | RTL       | MENA                 | ✅ Required |
| `he`      | Hebrew                | RTL       | Israel               | 🟡 Optional |
| `tr`      | Turkish               | LTR       | Turkey               | 🟡 Optional |
| `ru`      | Russian               | LTR       | Russia               | 🟡 Optional |

### Locale Fallback Chain

```
zh-Hans-CN → zh-Hans → zh → en
ar-SA → ar → en
pt-BR → pt → en
```

---

## 3. Translation Architecture

### File Structure

```
packages/
├── locales/
│   ├── en/
│   │   ├── common.json       # Shared strings
│   │   ├── components.json   # Component-specific
│   │   ├── navigation.json   # Wayfinding strings
│   │   └── errors.json       # Error messages
│   ├── de/
│   │   ├── common.json
│   │   └── ...
│   ├── ar/
│   │   ├── common.json
│   │   └── ...
│   └── index.ts              # Exports all locales
├── react/
│   └── src/
│       └── i18n/
│           ├── provider.tsx   # I18nProvider
│           ├── useTranslation.ts
│           └── types.ts
```

### Translation File Format

```json
// locales/en/common.json
{
  "app": {
    "name": "Pointr",
    "tagline": "Indoor navigation made simple"
  },
  "actions": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "retry": "Retry"
  },
  "navigation": {
    "startNavigation": "Start Navigation",
    "endNavigation": "End Navigation",
    "recalculating": "Recalculating route...",
    "arrived": "You have arrived!",
    "turnLeft": "Turn left",
    "turnRight": "Turn right",
    "goStraight": "Go straight",
    "takeElevator": "Take the elevator to floor {floor}",
    "takeStairs": "Take the stairs to floor {floor}",
    "distanceRemaining": "{distance} remaining",
    "estimatedTime": "About {time}"
  },
  "search": {
    "placeholder": "Search for a place...",
    "noResults": "No results found",
    "recentSearches": "Recent searches",
    "clearHistory": "Clear search history"
  },
  "floors": {
    "floor": "Floor {number}",
    "basement": "Basement {number}",
    "ground": "Ground Floor",
    "roof": "Roof"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Unable to connect. Check your internet connection.",
    "locationUnavailable": "Location services unavailable",
    "destinationNotFound": "Destination not found"
  },
  "time": {
    "now": "Now",
    "justNow": "Just now",
    "minutesAgo": "{count, plural, one {# minute ago} other {# minutes ago}}",
    "hoursAgo": "{count, plural, one {# hour ago} other {# hours ago}}",
    "daysAgo": "{count, plural, one {# day ago} other {# days ago}}"
  },
  "distance": {
    "meters": "{count, plural, one {# meter} other {# meters}}",
    "kilometers": "{count, number, ::precision-integer} km",
    "feet": "{count, plural, one {# foot} other {# feet}}",
    "miles": "{count, number, ::precision-integer} mi"
  }
}
```

```json
// locales/ar/common.json
{
  "app": {
    "name": "بوينتر",
    "tagline": "الملاحة الداخلية بكل سهولة"
  },
  "actions": {
    "submit": "إرسال",
    "cancel": "إلغاء",
    "save": "حفظ",
    "delete": "حذف",
    "edit": "تعديل",
    "close": "إغلاق",
    "back": "رجوع",
    "next": "التالي",
    "retry": "إعادة المحاولة"
  },
  "navigation": {
    "startNavigation": "بدء الملاحة",
    "endNavigation": "إنهاء الملاحة",
    "recalculating": "جاري إعادة حساب المسار...",
    "arrived": "لقد وصلت!",
    "turnLeft": "انعطف يساراً",
    "turnRight": "انعطف يميناً",
    "goStraight": "استمر للأمام",
    "takeElevator": "استخدم المصعد للطابق {floor}",
    "takeStairs": "استخدم الدرج للطابق {floor}"
  },
  "time": {
    "minutesAgo": "{count, plural, zero {الآن} one {منذ دقيقة} two {منذ دقيقتين} few {منذ # دقائق} many {منذ # دقيقة} other {منذ # دقيقة}}"
  }
}
```

---

## 4. Platform Implementations

### 4.1 React (Web)

```tsx
// i18n/provider.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntlProvider, MessageFormatElement } from 'react-intl';

type Locale = 'en' | 'de' | 'fr' | 'ar' | 'ja' | /* ... */;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | null>(null);

// Lazy load translations
async function loadMessages(locale: Locale): Promise<Record<string, string>> {
  const messages = await import(`@kozmos/locales/${locale}/common.json`);
  return flattenMessages(messages.default);
}

export function KozmosI18nProvider({
  children,
  defaultLocale = 'en'
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    loadMessages(locale).then(setMessages);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, dir }}>
      <IntlProvider
        locale={locale}
        messages={messages}
        defaultLocale="en"
      >
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within KozmosI18nProvider');
  return context;
}
```

```tsx
// hooks/useTranslation.ts
import { useIntl } from "react-intl";

export function useTranslation() {
  const intl = useIntl();

  return {
    t: (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    formatDate: intl.formatDate,
    formatTime: intl.formatTime,
    formatNumber: intl.formatNumber,
    formatRelativeTime: intl.formatRelativeTime,
  };
}

// Usage in component
function NavigationCard() {
  const { t } = useTranslation();
  const { dir } = useI18n();

  return (
    <Card dir={dir}>
      <Button>{t("navigation.startNavigation")}</Button>
      <Text>{t("navigation.distanceRemaining", { distance: "250m" })}</Text>
      <Text>{t("time.minutesAgo", { count: 5 })}</Text>
    </Card>
  );
}
```

### 4.2 iOS (SwiftUI)

```swift
// Localizable.strings (en)
"navigation.startNavigation" = "Start Navigation";
"navigation.distanceRemaining" = "%@ remaining";
"time.minutesAgo" = "%d minutes ago";

// Localizable.strings (ar)
"navigation.startNavigation" = "بدء الملاحة";
"navigation.distanceRemaining" = "%@ متبقية";

// Localizable.stringsdict (en) - Pluralization
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>time.minutesAgo</key>
    <dict>
        <key>NSStringLocalizedFormatKey</key>
        <string>%#@count@</string>
        <key>count</key>
        <dict>
            <key>NSStringFormatSpecTypeKey</key>
            <string>NSStringPluralRuleType</string>
            <key>NSStringFormatValueTypeKey</key>
            <string>d</string>
            <key>one</key>
            <string>%d minute ago</string>
            <key>other</key>
            <string>%d minutes ago</string>
        </dict>
    </dict>
</dict>
</plist>
```

```swift
// KozmosLocalization.swift
import SwiftUI

public struct KozmosLocalization {
    public static let supportedLocales = ["en", "de", "fr", "ar", "ja", "zh-Hans"]

    public static func localizedString(_ key: String, _ args: CVarArg...) -> String {
        let format = NSLocalizedString(key, bundle: .kozmos, comment: "")
        return String(format: format, arguments: args)
    }

    public static var currentLayoutDirection: LayoutDirection {
        Locale.current.language.characterDirection == .rightToLeft ? .rightToLeft : .leftToRight
    }
}

// Environment key for direction
struct LayoutDirectionKey: EnvironmentKey {
    static let defaultValue: LayoutDirection = .leftToRight
}

extension EnvironmentValues {
    var kozmosLayoutDirection: LayoutDirection {
        get { self[LayoutDirectionKey.self] }
        set { self[LayoutDirectionKey.self] = newValue }
    }
}

// Usage
struct NavigationButton: View {
    @Environment(\.kozmosLayoutDirection) var direction

    var body: some View {
        Button(KozmosLocalization.localizedString("navigation.startNavigation")) {
            // action
        }
        .environment(\.layoutDirection, direction)
    }
}
```

### 4.3 Android (Jetpack Compose)

```xml
<!-- res/values/strings.xml (default - English) -->
<resources>
    <string name="navigation_start">Start Navigation</string>
    <string name="navigation_distance_remaining">%s remaining</string>
    <plurals name="time_minutes_ago">
        <item quantity="one">%d minute ago</item>
        <item quantity="other">%d minutes ago</item>
    </plurals>
</resources>

<!-- res/values-ar/strings.xml (Arabic) -->
<resources>
    <string name="navigation_start">بدء الملاحة</string>
    <string name="navigation_distance_remaining">%s متبقية</string>
    <plurals name="time_minutes_ago">
        <item quantity="zero">الآن</item>
        <item quantity="one">منذ دقيقة</item>
        <item quantity="two">منذ دقيقتين</item>
        <item quantity="few">منذ %d دقائق</item>
        <item quantity="many">منذ %d دقيقة</item>
        <item quantity="other">منذ %d دقيقة</item>
    </plurals>
</resources>
```

```kotlin
// KozmosLocalization.kt
object KozmosLocalization {
    val supportedLocales = listOf("en", "de", "fr", "ar", "ja", "zh")

    fun isRtl(context: Context): Boolean {
        return context.resources.configuration.layoutDirection == View.LAYOUT_DIRECTION_RTL
    }
}

// Composable with RTL support
@Composable
fun NavigationCard(
    distance: String,
    minutesAgo: Int
) {
    val context = LocalContext.current
    val isRtl = KozmosLocalization.isRtl(context)

    CompositionLocalProvider(
        LocalLayoutDirection provides if (isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr
    ) {
        Card {
            Text(stringResource(R.string.navigation_start))
            Text(stringResource(R.string.navigation_distance_remaining, distance))
            Text(pluralStringResource(R.plurals.time_minutes_ago, minutesAgo, minutesAgo))
        }
    }
}
```

### 4.4 React Native

```tsx
// i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import * as RNLocalize from "react-native-localize";

import en from "@kozmos/locales/en/common.json";
import de from "@kozmos/locales/de/common.json";
import ar from "@kozmos/locales/ar/common.json";

const resources = {
  en: { translation: en },
  de: { translation: de },
  ar: { translation: ar },
};

const RTL_LANGUAGES = ["ar", "he"];

i18n.use(initReactI18next).init({
  resources,
  lng: RNLocalize.getLocales()[0].languageCode,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Handle RTL
i18n.on("languageChanged", (lng) => {
  const isRtl = RTL_LANGUAGES.includes(lng);
  if (I18nManager.isRTL !== isRtl) {
    I18nManager.forceRTL(isRtl);
    // Requires app restart on iOS
  }
});

export default i18n;
```

```tsx
// Usage in component
import { useTranslation } from "react-i18next";
import { I18nManager, View, Text } from "react-native";

function NavigationCard({ distance, minutesAgo }: Props) {
  const { t } = useTranslation();
  const isRtl = I18nManager.isRTL;

  return (
    <View style={[styles.card, isRtl && styles.cardRtl]}>
      <Text>{t("navigation.startNavigation")}</Text>
      <Text>{t("navigation.distanceRemaining", { distance })}</Text>
      <Text>{t("time.minutesAgo", { count: minutesAgo })}</Text>
    </View>
  );
}
```

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

```tsx
// Icons that should flip in RTL
const MIRRORED_ICONS = [
  "arrow-left",
  "arrow-right",
  "chevron-left",
  "chevron-right",
  "reply",
  "forward",
  "undo",
  "redo",
];

// Icons that should NOT flip
const NON_MIRRORED_ICONS = [
  "check",
  "close",
  "search",
  "home",
  "phone", // Handset orientation is universal
  "clock", // Clock hands go clockwise universally
];

function DirectionalIcon({ name, ...props }) {
  const { dir } = useI18n();
  const shouldMirror = MIRRORED_ICONS.includes(name) && dir === "rtl";

  return (
    <Icon
      name={name}
      style={shouldMirror ? { transform: "scaleX(-1)" } : undefined}
      {...props}
    />
  );
}
```

### 5.4 RTL Layout Patterns

```tsx
// Flexbox with RTL
function NavigationHeader() {
  const { dir } = useI18n();

  return (
    // flex-direction automatically flips with dir="rtl"
    <header style={{ display: 'flex', direction: dir }}>
      <BackButton />
      <Title>Navigation</Title>
      <MenuButton />
    </header>
  );
}

// Grid with RTL
.navigation-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  /* Automatically respects dir attribute */
}

// Absolute positioning with logical properties
.floating-button {
  position: absolute;
  inset-block-end: 16px;   /* bottom in both LTR and RTL */
  inset-inline-end: 16px;  /* right in LTR, left in RTL */
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

```typescript
// React (using Intl)
import { useIntl } from 'react-intl';

function DateDisplay({ date }: { date: Date }) {
  const intl = useIntl();

  return (
    <span>
      {intl.formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </span>
  );
}

// Output by locale:
// en: "February 8, 2026"
// de: "8. Februar 2026"
// ar: "٨ فبراير ٢٠٢٦"
// ja: "2026年2月8日"
```

### 6.2 Time Formatting

```typescript
// Time with timezone awareness
function TimeDisplay({ date }: { date: Date }) {
  const intl = useIntl();

  return (
    <time dateTime={date.toISOString()}>
      {intl.formatTime(date, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: undefined, // Use locale default (12h for en-US, 24h for de)
      })}
    </time>
  );
}

// Output by locale:
// en-US: "2:30 PM"
// en-GB: "14:30"
// de: "14:30"
// ar: "٢:٣٠ م"
```

### 6.3 Relative Time

```typescript
// Relative time formatting
function RelativeTime({ date }: { date: Date }) {
  const intl = useIntl();
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) {
    return <span>{intl.formatMessage({ id: 'time.justNow' })}</span>;
  }

  if (minutes < 60) {
    return (
      <span>
        {intl.formatRelativeTime(-minutes, 'minute', { style: 'long' })}
      </span>
    );
  }

  // ... hours, days, etc.
}

// Output by locale:
// en: "5 minutes ago"
// de: "vor 5 Minuten"
// ar: "منذ ٥ دقائق"
```

### 6.4 Number Formatting

```typescript
// Distance formatting
function DistanceDisplay({ meters }: { meters: number }) {
  const intl = useIntl();
  const { locale } = useI18n();

  // Use metric for most locales, imperial for en-US
  const useImperial = locale === 'en-US';

  if (useImperial) {
    const feet = meters * 3.28084;
    return <span>{intl.formatNumber(feet, { style: 'unit', unit: 'foot' })}</span>;
  }

  return <span>{intl.formatNumber(meters, { style: 'unit', unit: 'meter' })}</span>;
}

// Currency (if needed)
function PriceDisplay({ amount, currency }: { amount: number; currency: string }) {
  const intl = useIntl();

  return (
    <span>
      {intl.formatNumber(amount, { style: 'currency', currency })}
    </span>
  );
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

### 8.1 Translation Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Translation Workflow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Developer adds key      2. Extract to TMS      3. Translators work  │
│  ┌─────────────────┐        ┌─────────────────┐    ┌─────────────────┐  │
│  │ t('new.string') │───────>│ Lokalise/Phrase │───>│ Native speakers │  │
│  └─────────────────┘        └─────────────────┘    └─────────────────┘  │
│                                                              │           │
│  6. Deploy                  5. PR auto-created     4. Review & approve  │
│  ┌─────────────────┐        ┌─────────────────┐    ┌─────────────────┐  │
│  │ Production      │<───────│ GitHub Action   │<───│ QA + Context    │  │
│  └─────────────────┘        └─────────────────┘    └─────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Extraction Script

```bash
#!/bin/bash
# scripts/extract-translations.sh

# Extract from React
npx formatjs extract 'packages/react/src/**/*.{ts,tsx}' \
  --out-file packages/locales/en/extracted.json \
  --id-interpolation-pattern '[sha512:contenthash:base64:6]'

# Merge with existing
npx formatjs compile packages/locales/en/extracted.json \
  --out-file packages/locales/en/common.json

# Upload to TMS (example with Lokalise)
lokalise2 file upload \
  --project-id $LOKALISE_PROJECT_ID \
  --file packages/locales/en/common.json \
  --lang-iso en
```

### 8.3 CI/CD Integration

```yaml
# .github/workflows/translations.yml
name: Translation Sync

on:
  push:
    paths:
      - "packages/locales/**"
  schedule:
    - cron: "0 6 * * 1" # Weekly sync

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Pull translations from TMS
        run: |
          lokalise2 file download \
            --project-id ${{ secrets.LOKALISE_PROJECT_ID }} \
            --token ${{ secrets.LOKALISE_API_TOKEN }} \
            --format json \
            --dest packages/locales

      - name: Validate translations
        run: pnpm run validate:translations

      - name: Create PR if changes
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: update translations"
          branch: translations/update
          commit-message: "chore: sync translations from Lokalise"
```

### 8.4 Translation Validation

```typescript
// scripts/validate-translations.ts
import en from "@kozmos/locales/en/common.json";
import de from "@kozmos/locales/de/common.json";
import ar from "@kozmos/locales/ar/common.json";

const locales = { en, de, ar };
const baseLocale = "en";

function validateTranslations() {
  const baseKeys = getAllKeys(locales[baseLocale]);
  const errors: string[] = [];

  for (const [locale, messages] of Object.entries(locales)) {
    if (locale === baseLocale) continue;

    const localeKeys = getAllKeys(messages);

    // Check for missing keys
    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        errors.push(`Missing key in ${locale}: ${key}`);
      }
    }

    // Check for extra keys
    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        errors.push(`Extra key in ${locale}: ${key}`);
      }
    }

    // Validate ICU syntax
    for (const [key, value] of Object.entries(flattenObject(messages))) {
      try {
        new IntlMessageFormat(value, locale);
      } catch (e) {
        errors.push(`Invalid ICU syntax in ${locale}.${key}: ${e.message}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Translation validation failed:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("✅ All translations valid");
}

validateTranslations();
```

---

## 9. Testing i18n

### 9.1 Unit Tests

```typescript
// __tests__/i18n.test.tsx
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import en from '@kozmos/locales/en/common.json';
import de from '@kozmos/locales/de/common.json';
import ar from '@kozmos/locales/ar/common.json';

function renderWithLocale(ui: React.ReactElement, locale: string, messages: Record<string, string>) {
  return render(
    <IntlProvider locale={locale} messages={messages}>
      {ui}
    </IntlProvider>
  );
}

describe('NavigationButton', () => {
  it('renders in English', () => {
    renderWithLocale(<NavigationButton />, 'en', en);
    expect(screen.getByText('Start Navigation')).toBeInTheDocument();
  });

  it('renders in German', () => {
    renderWithLocale(<NavigationButton />, 'de', de);
    expect(screen.getByText('Navigation starten')).toBeInTheDocument();
  });

  it('renders in Arabic with RTL', () => {
    renderWithLocale(<NavigationButton />, 'ar', ar);
    expect(screen.getByText('بدء الملاحة')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
});

describe('Pluralization', () => {
  it('handles English plurals', () => {
    const { rerender } = renderWithLocale(
      <TimeAgo minutes={1} />, 'en', en
    );
    expect(screen.getByText('1 minute ago')).toBeInTheDocument();

    rerender(
      <IntlProvider locale="en" messages={en}>
        <TimeAgo minutes={5} />
      </IntlProvider>
    );
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('handles Arabic plurals', () => {
    renderWithLocale(<TimeAgo minutes={2} />, 'ar', ar);
    expect(screen.getByText('منذ دقيقتين')).toBeInTheDocument(); // dual form
  });
});
```

### 9.2 Visual Regression for RTL

```typescript
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
};

export const LTR = {
  args: { children: 'Submit' },
  decorators: [(Story) => <div dir="ltr"><Story /></div>],
};

export const RTL = {
  args: { children: 'إرسال' },
  decorators: [(Story) => <div dir="rtl"><Story /></div>],
};

// Visual Review draws both stories, in light and dark
```

### 9.3 Pseudo-localization

```typescript
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
// ❌ Bad: Hardcoded units
`${distance} meters`;

// ✅ Good: Locale-aware formatting
intl.formatNumber(distance, { style: "unit", unit: "meter" })
// ❌ Bad: Hardcoded date format
`${month}/${day}/${year}`;

// ✅ Good: Locale-aware date
intl.formatDate(date, { dateStyle: "medium" });
```

---

## Related Documents

- [Component Creation Guide](./component-creation-guide.md) — i18n integration in components
- [Testing Patterns](./testing-patterns.md) — i18n test examples
- [Accessibility Guide](./accessibility-guide.md) — Language and direction for screen readers

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
