# Proposal: not built — Kozmos's own translations

> **Proposal: not built.** This is the translation system planned before the code: Kozmos's own
> locale files, a `@kozmos-ds/locales` package, an i18n provider, localization helpers on each
> platform, and a workflow to extract, sync and validate strings. None of it exists. Kozmos ships
> no translations and no i18n library: a component's words are its props, many with an English
> default the product replaces, and direction comes from `ThemeProvider dir` on the web and the
> platform's layout direction natively. It is kept as planning history; the sections below were
> in `.ai-skills/i18n-guide.md` until 2026-09-29.

## Proposal: from `.ai-skills/i18n-guide.md`

These sections were in [`i18n-guide.md`](../../.ai-skills/i18n-guide.md), where each heading now says what is built instead.

#### Proposal: i18n Strategy

Kozmos Design System provides:

| Feature             | Implementation                         | Coverage            |
| ------------------- | -------------------------------------- | ------------------- |
| **Translations**    | JSON files per locale                  | All UI strings      |
| **RTL Support**     | CSS logical properties + platform APIs | Full layout flip    |
| **Formatting**      | Intl API / platform equivalents        | Date, time, numbers |
| **Pluralization**   | ICU MessageFormat                      | Complex rules       |
| **Dynamic Loading** | Lazy load per locale                   | Performance         |

### Proposal: 2. Supported Languages

#### Proposal: Language Matrix

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

#### Proposal: Locale Fallback Chain

```
zh-Hans-CN → zh-Hans → zh → en
ar-SA → ar → en
pt-BR → pt → en
```

### Proposal: 3. Translation Architecture

#### Proposal: File Structure

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

#### Proposal: Translation File Format

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

#### Proposal: 4.1 React (Web)

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
  const messages = await import(`@kozmos-ds/locales/${locale}/common.json`);
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

#### Proposal: 4.2 iOS (SwiftUI)

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

#### Proposal: 4.3 Android (Jetpack Compose)

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

### Proposal: 8. Translation Workflow

None of this section exists in the repository yet: there is no `packages/locales`, no
translation-management service is connected, and no workflow or script extracts, syncs or validates
translations. Read it as a design, not as instructions.

#### Proposal: 8.1 Translation Management

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

#### Proposal: 8.2 Extraction Script

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

#### Proposal: 8.3 CI/CD Integration

No workflow syncs or validates translations. There is no `translations.yml`, no workflow reads a
translation-management secret, and no package declares a `validate:translations` script; the
workflows that exist are listed in [ci-cd-configuration.md](../../.ai-skills/ci-cd-configuration.md).

#### Proposal: 8.4 Translation Validation

```typescript
// scripts/validate-translations.ts
import en from "@kozmos-ds/locales/en/common.json";
import de from "@kozmos-ds/locales/de/common.json";
import ar from "@kozmos-ds/locales/ar/common.json";

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

#### Proposal: 9.1 Unit Tests

```tsx
// __tests__/i18n.test.tsx
import { render, screen } from "@testing-library/react";
import { IntlProvider } from "react-intl";
import en from "@kozmos-ds/locales/en/common.json";
import de from "@kozmos-ds/locales/de/common.json";
import ar from "@kozmos-ds/locales/ar/common.json";

function renderWithLocale(
  ui: React.ReactElement,
  locale: string,
  messages: Record<string, string>,
) {
  return render(
    <IntlProvider locale={locale} messages={messages}>
      {ui}
    </IntlProvider>,
  );
}

describe("NavigationButton", () => {
  it("renders in English", () => {
    renderWithLocale(<NavigationButton />, "en", en);
    expect(screen.getByText("Start Navigation")).toBeInTheDocument();
  });

  it("renders in German", () => {
    renderWithLocale(<NavigationButton />, "de", de);
    expect(screen.getByText("Navigation starten")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL", () => {
    renderWithLocale(<NavigationButton />, "ar", ar);
    expect(screen.getByText("بدء الملاحة")).toBeInTheDocument();
    expect(document.documentElement.dir).toBe("rtl");
  });
});

describe("Pluralization", () => {
  it("handles English plurals", () => {
    const { rerender } = renderWithLocale(<TimeAgo minutes={1} />, "en", en);
    expect(screen.getByText("1 minute ago")).toBeInTheDocument();

    rerender(
      <IntlProvider locale="en" messages={en}>
        <TimeAgo minutes={5} />
      </IntlProvider>,
    );
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
  });

  it("handles Arabic plurals", () => {
    renderWithLocale(<TimeAgo minutes={2} />, "ar", ar);
    expect(screen.getByText("منذ دقيقتين")).toBeInTheDocument(); // dual form
  });
});
```
