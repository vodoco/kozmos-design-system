# Kozmos Design System - Testing Patterns Guide

> **Purpose:** how Kozmos is tested on its three platforms, React, SwiftUI and Jetpack Compose,
> with excerpts from the real tests. The suites planned before the code are kept as a proposal in
> [docs/proposals/testing-plan.md](../docs/proposals/testing-plan.md).

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [React Testing](#2-react-testing)
3. [iOS Testing](#3-ios-testing)
4. [Android Testing](#4-android-testing)
5. [React Native Testing](#5-react-native-testing)
6. [Vue Testing](#6-vue-testing)
7. [Visual Regression Testing](#7-visual-regression-testing)
8. [Accessibility Testing](#8-accessibility-testing)
9. [Performance Testing](#9-performance-testing)
10. [CI Integration](#10-ci-integration)

---

## 1. Testing Philosophy

### The Layers

| Layer         | What runs                                                                        | Where                                                   |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Unit          | Vitest in jsdom, with Testing Library and `vitest-axe`                           | beside each React component                             |
| Unit          | XCTest, and image snapshots with `swift-snapshot-testing`                        | `packages/ios/Tests/KozmosTests`                        |
| Unit          | Paparazzi snapshots and JUnit tests                                              | `packages/android/src/test/java/com/kozmos/components/` |
| Built package | Playwright against the built library and Storybook, in Chromium, Firefox, WebKit | `scripts/check-*.mjs`, run by their `package.json` name |
| Accessibility | axe on stories, in light and dark, at 320 and 1280 px wide                       | `pnpm test:storybook-audit`                             |
| Visual        | every story in light and dark, against committed baselines                       | `tests/visual`                                          |

### Component Maturity

Kozmos marks no component alpha, beta or stable, so nothing is tested by maturity. Every React
component directory has a test and a story (116 of 116), and in CI every story is audited by axe
and drawn by the visual review, with nothing to register.

### What to Test

| Test               | Don't Test             |
| ------------------ | ---------------------- |
| Component behavior | Implementation details |
| User interactions  | Internal state         |
| Accessibility      | CSS styling            |
| Edge cases         | Third-party libraries  |
| Error states       | Platform internals     |

---

## 2. React Testing

### Setup

React's tests run with Vitest in jsdom, from `packages/react/vitest.config.ts`:

```typescript
// kozmos-skills: template — abridged from packages/react/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.spec.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "tests/visual/**",
      "tests/e2e/**",
    ],
    alias: {
      "@kozmos-ds/react": resolve(__dirname, "./src"),
    },
  },
});
```

The alias points the package's own name at its source, so a test never reads a stale build.

### Test Setup File

`packages/react/src/test/setup.ts` adds Testing Library's DOM matchers and `vitest-axe`'s
`toHaveNoViolations` (typed by `src/test/vitest-axe.d.ts`), and stands in for the browser APIs
jsdom lacks, `ResizeObserver` and pointer capture:

```typescript
// kozmos-skills: template — abridged from packages/react/src/test/setup.ts
import "@testing-library/jest-dom";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
}
```

### Test Utilities

There is no shared render helper: a test renders its component directly, inside a
`ThemeProvider` where it needs one.

### Button Component Tests

From `packages/react/src/components/Button/Button.test.tsx`:

```tsx
// kozmos-skills: template — a test beside Button in packages/react, importing its source
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("renders loading state correctly", () => {
    render(
      <Button disabled={undefined} isLoading>
        Loading...
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards the native button ref and click event", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn((event) =>
      expect(event.currentTarget).toBe(ref.current),
    );
    render(
      <Button ref={ref} type="button" onClick={onClick}>
        Click me
      </Button>,
    );
    const button = screen.getByRole("button", { name: /click me/i });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

The file goes on to test that a disabled or loading Button ignores a click, and what each
`emotion` points the button's colours at.

### Input Component Tests

`packages/react/src/components/Input/Input.test.tsx` covers the field's label and placeholder, its
error and helper text and the `aria-describedby` and `aria-invalid` it sets from them, its warning
and success tones, and `disabled` and `readOnly` reaching the native input.

### Modal Component Tests

Kozmos has no Modal: `Dialog` is the dialog, and its tests are
`packages/react/src/components/Dialog/Dialog.test.tsx`. The Modal tests written before the code are
kept in [docs/proposals/testing-plan.md](../docs/proposals/testing-plan.md).

---

## 3. iOS Testing

SwiftUI's tests are XCTest cases in `packages/ios/Tests/KozmosTests`, one file per subject
(`KozmosButtonAPITests.swift`, `KozmosDialogTests.swift`), importing the package with
`@testable import Kozmos`. Images are compared with `swift-snapshot-testing`
(`KozmosButtonImageSnapshotTests.swift`, built for iOS only). From `KozmosButtonAPITests.swift`:

```swift
import XCTest
import SwiftUI
@testable import Kozmos

final class KozmosButtonAPITests: XCTestCase {
    func testButtonDefaultVariant() {
        let view = KozmosButton("Label Binding", action: {})

        XCTAssertEqual(view.label, "Label Binding")
        XCTAssertEqual(view.variant, .default)
        XCTAssertEqual(view.size, .default)
        XCTAssertFalse(view.isDisabled)
        XCTAssertFalse(view.isLoading)
    }

    func testButtonDestructiveVariant() {
        let view = KozmosButton("Delete Item", variant: .destructive, action: {})
        XCTAssertEqual(view.label, "Delete Item")
        XCTAssertEqual(view.variant, .destructive)
    }
}
```

`swift test` on macOS compiles the iOS-only tests out, so `node scripts/check-ios-poi.mjs` runs the
whole target on the pinned simulator, as CI's iOS job does; read the test names back from its
results ([AGENTS.md](../AGENTS.md)). The tests written before the code are kept in
[docs/proposals/testing-plan.md](../docs/proposals/testing-plan.md).

---

## 4. Android Testing

Compose's tests are Paparazzi snapshots and JUnit tests in
`packages/android/src/test/java/com/kozmos/components/<name>/`, in the package of the component
they test. From `button/KozmosButtonPaparazziTest.kt`:

```kotlin
package com.kozmos.components.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import org.junit.Rule
import org.junit.Test

class KozmosButtonPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun defaultButtonSnapshot() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(24.dp)) {
                    KozmosButton(onClick = {}) {
                        Text("Snapshot Verification")
                    }
                }
            }
        }
    }
}
```

A snapshot allows no difference, or, where a golden recorded on macOS is verified on CI's Linux,
`CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE` from `PaparazziTolerance.kt`. `./gradlew
verifyPaparazziDebug` in `packages/android` compares the snapshots, as CI's Android job does; read
the test names back from the JUnit XML under `build/test-results/`. The tests written before the
code are kept in [docs/proposals/testing-plan.md](../docs/proposals/testing-plan.md).

---

## 5. React Native Testing

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 6. Vue Testing

Vue waits: `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, not a package to install, and there are no Lit Web Components to test. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 7. Visual Regression Testing

### The visual review

The repository's own visual review draws every story in light and dark with Chromium in the
Playwright image and compares it with the baseline committed in `tests/visual/baselines`
(`.github/workflows/visual.yml`; the "Visual Review" check is required on every pull request).
Locally, `pnpm test:visual` compares and `pnpm test:visual:update` records, both in Docker, never on a
bare Mac, whose fonts draw differently. `docs/visual-review.md` explains how to read a difference and
how to accept one.

A story that cannot draw the same way every time (live data, a running animation with no reduced
state) opts out with `tags: ["no-visual"]`; everything else must be deterministic, and the suite
helps: a fixed clock, seeded `Math.random`, reduced motion, outside requests refused, map canvases
masked.

---

## 8. Accessibility Testing

### axe-core Integration

`packages/react/tests/a11y/components.a11y.spec.tsx` runs axe on Button in each variant,
IconButton, Card and Input, and holds Button's token pairs to their WCAG contrast in light and dark,
reading the built token CSS. Tooltip's and MapStatusPill's own tests run axe too. From the spec:

```tsx
// kozmos-skills: template — a spec in packages/react/tests/a11y, importing the package's source
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import { Button } from "../../src/components/Button/Button";

expect.extend(matchers);

describe("WCAG 2.1 Native A11y Validations", () => {
  it.each([
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
    "glass",
  ] as const)(
    "Button %s variant has no structural axe violations",
    async (variant) => {
      const { container } = render(
        <Button variant={variant}>WCAG Accessible Button</Button>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
```

### Automated A11y Tests for All Components

Every component is audited through its stories, with nothing to register:
`pnpm test:storybook-audit` runs axe through Playwright on each component's Default story, or on
every story with `STORY_SCOPE=all` as CI runs it, in light and dark at 320 and 1280 px wide. It
fails on any violation, and on a page wider than its viewport. It reads a built Storybook at
`STORYBOOK_URL` (`http://127.0.0.1:6008` by default).
[accessibility-guide.md](./accessibility-guide.md) §10 has the rest.

---

## 9. Performance Testing

### Bundle Size Tests

The bundle budgets are one check, `scripts/performance/bundle-analyzer.ts`, which the
`analyze-bundle` job in `.github/workflows/bundle-size.yml` runs. It bundles `@kozmos-ds/react` the
way a Vite app builds and holds four budgets, gzipped: any one export alone, `Button` alone, every
export at once, and the stylesheet. [performance-benchmarks.md](./performance-benchmarks.md) has
their values.

```bash
pnpm tsx scripts/performance/bundle-analyzer.ts
```

### Render Performance Tests

There are no render-timing tests. Storybook's performance addon
(`storybook-addon-performance`) shows a story's render timings while you work. The timing tests
written before the code are kept in [docs/proposals/testing-plan.md](../docs/proposals/testing-plan.md).

---

## 10. CI Integration

### Where the Tests Run

There is no `test.yml`: the tests run in `.github/workflows/ci.yml`
([ci-cd-configuration.md](./ci-cd-configuration.md)).

- **`Web Build & Test`:** `pnpm test` (Vitest, React's suite with its `vitest-axe` checks), and the
  built-library checks in Chromium, Firefox and WebKit.
- **Twelve browser shards:** the Storybook suites against the built Storybook, one browser each.
- **`Core Pipeline & POI Gallery`:** React's Playwright tests and the Storybook regressions.
- **`iOS Build`:** `swift test` in `packages/ios`, then the whole test target on the pinned
  simulator (`node scripts/check-ios-poi.mjs`).
- **`Android Build`:** `./gradlew verifyPaparazziDebug` in `packages/android`.

Nothing uploads coverage, and there is no React Native package to test.

---

## Quick Reference

### Test Commands

```bash
# Run all tests
pnpm test

# Run React's tests in watch mode
pnpm --filter @kozmos-ds/react test:watch

# Run specific package tests
pnpm --filter @kozmos-ds/react test

# Run the React tests whose names match a pattern (Vitest's -t; it has no --grep)
pnpm --filter @kozmos-ds/react test -- -t "<pattern>"
```

There is no coverage run: `@vitest/coverage-v8` is not installed, so `--coverage` fails.

### Test File Naming

```
Component.test.tsx             # Unit tests, beside every React component
Component.isolation.test.tsx   # A provider's scoping: ThemeProvider, DesignConfigContext
module.test.ts                 # A hook, a utility or a layout module
tests/a11y/*.a11y.spec.tsx     # The axe and contrast spec
tests/contracts/*.spec.ts      # The POI card's consumer contract, with Pact
```

---

## Version History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.0.0   | 2026-02-07 | Initial testing patterns guide                               |
| 1.1.0   | 2026-09-29 | The tests as they are; the planned suites move to a proposal |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-29
