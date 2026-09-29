# Kozmos Design System - Performance Benchmarks

> **Purpose:** what Kozmos measures about its performance, the bundle budgets CI enforces and
> Lighthouse CI, and what nothing measures yet. The budgets, targets and history planned before
> the code are kept as a proposal in
> [docs/proposals/performance-plan.md](../docs/proposals/performance-plan.md).

---

## Table of Contents

1. [Performance Philosophy](#1-performance-philosophy)
2. [Bundle Size Budgets](#2-bundle-size-budgets)
3. [Runtime Performance Budgets](#3-runtime-performance-budgets)
4. [Render Performance](#4-render-performance)
5. [Memory Budgets](#5-memory-budgets)
6. [Network Performance](#6-network-performance)
7. [Platform-Specific Metrics](#7-platform-specific-metrics)
8. [Measurement Tools](#8-measurement-tools)
9. [CI Integration](#9-ci-integration)
10. [Benchmark History](#10-benchmark-history)
11. [Optimization Techniques](#11-optimization-techniques)

---

## 1. Performance Philosophy

### Core Principles

1. **No CSS-in-JS runtime:** the styles are one prebuilt stylesheet, and a variant is a class name
   (`cva`).
2. **Pay for what you import:** the ES build is one file per module and declares its JavaScript
   free of side effects, so an app keeps only the modules behind what it imports; `Button` alone
   costs under 2 KB gzipped.
3. **One stylesheet:** `@kozmos-ds/react/style.css` holds every part's styles and the token
   variables, and no bundler trims it, so it has a budget of its own.
4. **Dependencies are the app's:** Radix, `class-variance-authority`, `clsx`, `tailwind-merge` and
   `framer-motion` (used by `DynamicIsland`) are dependencies, installed with the package and
   bundled by the app. The budgets in §2 leave them out.

### Performance Budget Tiers

There are no tiers: every public export is held to the same budget, 8 KB gzipped alone (§2). The
tiers planned before the code are kept in
[docs/proposals/performance-plan.md](../docs/proposals/performance-plan.md).

---

## 2. Bundle Size Budgets

### What CI Enforces

The required `analyze-bundle` check (`.github/workflows/bundle-size.yml`) runs
`scripts/performance/bundle-analyzer.ts`. It builds `@kozmos-ds/react`, bundles it the way a Vite
app would (Rollup, honouring the package's `sideEffects`, its dependencies left out), and holds four
budgets, gzipped:

| Measure                              | Budget |
| ------------------------------------ | ------ |
| Any one public export, bundled alone | 8 KB   |
| `Button` alone                       | 2 KB   |
| Every export at once                 | 68 KB  |
| The stylesheet                       | 30 KB  |

The whole library's budget went from 64 to 68 KB on 2026-09-28 (decision 53); the other three are
unchanged.

### Package-Level Budgets

No check measures a package as a whole except `@kozmos-ds/react`, whose four budgets are above.
`@kozmos-ds/tokens` and `@kozmos-ds/icons` have none.

### Component-Level Budgets (React)

Each public export is bundled alone and held to 8 KB gzipped, and `Button` to 2 KB, as the canary
for the per-module build. The analyzer prints the median export and the five heaviest; on
2026-09-22, the first day it measured them, the heaviest was `POIDetailPanel` at 6.15 KB and the
median 1.14 KB.

### Dependency Budget

None. `@kozmos-ds/react` depends on `react` and `react-dom` as peers, and on the Radix primitives
it builds on, `class-variance-authority`, `clsx`, `tailwind-merge`, `framer-motion`,
`@emotion/is-prop-valid` and its sibling packages; the analyzer leaves all of them out, because
the app bundles them.

### Measuring Bundle Size

```bash
# The budgets CI enforces; builds @kozmos-ds/react first
pnpm tsx scripts/performance/bundle-analyzer.ts
```

It prints the median export and the five heaviest, `Button`, everything together and the
stylesheet, each against its budget.

---

## 3. Runtime Performance Budgets

Nothing measures runtime performance: no test times a render, an interaction, an animation or a
theme switch. What is measured is the bundle (§2), and Lighthouse's performance score of four
stories, as a warning (§9). The runtime targets planned before the code are kept in
[docs/proposals/performance-plan.md](../docs/proposals/performance-plan.md).

---

## 4. Render Performance

### React Render Metrics

Not measured (§3).

### Preventing Unnecessary Renders

Memoize what is expensive to render, and pass it stable handlers:

```tsx
import { memo, useCallback, useMemo, useState } from "react";
import { Button } from "@kozmos-ds/react";

type Item = { id: string; label: string };

const ItemList = memo(function ItemList({
  items,
  onPick,
}: {
  items: Item[];
  onPick: (id: string) => void;
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <Button variant="ghost" onClick={() => onPick(item.id)}>
            {item.label}
          </Button>
        </li>
      ))}
    </ul>
  );
});

export function Picker({ items }: { items: Item[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.label.localeCompare(b.label)),
    [items],
  );
  const onPick = useCallback((id: string) => setPicked(id), []);
  return (
    <>
      <p>{picked ?? "Nothing picked"}</p>
      <ItemList items={sorted} onPick={onPick} />
    </>
  );
}
```

### React DevTools Profiler Targets

Not measured (§3).

---

## 5. Memory Budgets

### JavaScript Heap

Not measured: no check reads the heap.

### Memory Leak Prevention

Undo in an effect's cleanup what the effect started:

```tsx
// kozmos-skills: template — effects inside a component; `emitter`, `handler` and `element` are the app's
useEffect(() => {
  const subscription = emitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, [emitter, handler]);

useEffect(() => {
  const observer = new ResizeObserver(handler);
  observer.observe(element);
  return () => observer.disconnect();
}, [element, handler]);
```

### Detached DOM Nodes

Not measured. Kozmos's overlays (Dialog, Drawer, Popover, Menu, Select, Tooltip) are built on
Radix, which unmounts their content when they close; none sets `forceMount`.

---

## 6. Network Performance

### Asset Loading

| Asset                      | How it ships                                                            |
| -------------------------- | ----------------------------------------------------------------------- |
| Token variables and styles | One stylesheet, `@kozmos-ds/react/style.css`, not trimmed by a bundler  |
| Token overrides (`tokens`) | Inline on the `ThemeProvider`'s element, as custom properties           |
| Components                 | One ES module each, under `dist/esm/`, tree-shaken by the app's bundler |
| Icons (`@kozmos-ds/icons`) | One ES module, `sideEffects: false`, tree-shaken by the app's bundler   |
| Fonts                      | None: the platform's own UI font                                        |
| Images                     | The product's own                                                       |

### Code Splitting Strategy

`@kozmos-ds/react` has no per-component entry points: its exports are `.`, `./style.css` and
`./reset.css`, and the per-module build already keeps only what an app imports. Split your own
screens, and make each `lazy` once, at module scope: one made during a render is remade on every
retry and never settles.

```tsx
// kozmos-skills: template — `./SettingsScreen` is a module of the app's own
import { lazy, Suspense } from "react";
import { Skeleton } from "@kozmos-ds/react";

const SettingsScreen = lazy(() => import("./SettingsScreen"));

export function Settings() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <SettingsScreen />
    </Suspense>
  );
}
```

### Preloading Strategy

Preload a screen of your own the same way, by calling its `import()` before it is needed, for
instance on a pointer entering the button that opens it. There is no Kozmos module to preload.

---

## 7. Platform-Specific Metrics

### iOS (SwiftUI)

Nothing measures SwiftUI performance; Xcode Instruments (Time Profiler, Allocations) is the tool.

### Android (Compose)

Nothing measures Compose performance; Android Studio's profiler is the tool. The Paparazzi tests
draw each composable, not time it.

### React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

### Web (Core Web Vitals)

Lighthouse CI (§9) scores four stories; it fails below an accessibility score of 100, and warns
below a performance score of 0.5. No Core Web Vital has a target.

---

## 8. Measurement Tools

### Bundle Analysis

| Tool                                     | Purpose                                              | Command                                           |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `scripts/performance/bundle-analyzer.ts` | The budgets CI enforces, per export and in total     | `pnpm tsx scripts/performance/bundle-analyzer.ts` |
| Lighthouse CI                            | Performance and accessibility scores of four stories | `.github/workflows/lighthouse.yml`                |

### Runtime Profiling

| Tool                        | Platform | Purpose                    |
| --------------------------- | -------- | -------------------------- |
| React DevTools Profiler     | React    | Render timing              |
| Chrome DevTools Performance | Web      | JS execution, paint        |
| Lighthouse                  | Web      | Core Web Vitals            |
| Safari Web Inspector        | Web/iOS  | Memory, timeline           |
| Xcode Instruments           | iOS      | Time Profiler, Allocations |
| Android Studio Profiler     | Android  | CPU, Memory, Network       |

### Automated Testing

There are no performance tests (§3). The render-timing tests planned before the code are kept in
[docs/proposals/performance-plan.md](../docs/proposals/performance-plan.md).

---

## 9. CI Integration

### Bundle Size Check (GitHub Actions)

`.github/workflows/bundle-size.yml` ("Bundle Size Analysis") runs on pull requests into `main` and on
pushes to `main` that change more than documentation. Its one job, `analyze-bundle`, is a required
check: it installs the workspace and runs `pnpm tsx scripts/performance/bundle-analyzer.ts`, which
fails when a budget in §2 is exceeded. Raise a budget only with the measurement that justifies it.

### Performance Regression Test

There is no `perf.yml`. `.github/workflows/lighthouse.yml` ("Lighthouse CI"), on the same triggers,
builds Storybook (`pnpm turbo run build --filter=@kozmos-ds/docs`) and runs Lighthouse CI; its
`lighthouse` job is a required check.

### lighthouserc.json

[`lighthouserc.json`](../lighthouserc.json) takes four stories from `apps/docs/storybook-static`
(the default Button, Dialog, Toast and POICard stories), one run each, and asserts:

- `categories:accessibility` of at least 1 (a score of 100), as an error;
- `categories:performance` of at least 0.5, as a warning only.

---

## 10. Benchmark History

The published versions are what `npm view @kozmos-ds/react versions` lists: 0.1.0 to 0.5.0 on
2026-09-29, and 0.1.0 of `@kozmos-ds/tokens`. The bundle is the one measure with a history, which
`scripts/performance/bundle-analyzer.ts` records in its opening comment:

| Date       | What changed                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| to 09-22   | The ES build was one file, held to 300 KB raw and 70 KB gzipped; importing `Button` cost an app 48.7 KB |
| 2026-09-22 | One file per module: everything 54.6 KB, the stylesheet 26.4 KB, the heaviest export 6.15 KB            |
| 2026-09-27 | Everything's budget went from 60 to 64 KB, with Olcay's agreement; main measured 59.63 KB               |
| 2026-09-28 | Everything's budget went from 64 to 68 KB (decision 53); main measured 63.61 KB                         |

No render or Core Web Vitals history is recorded.

---

## 11. Optimization Techniques

1. **Import from the package root.** `@kozmos-ds/react` has no subpaths to import a part from,
   and needs none: the per-module build tree-shakes.
2. **Style with the token variables, not literals,** in a class of your own:

   ```css
   .app-panel {
     padding: calc(var(--primitives-layout-spacing-200) * 1px);
     background: var(--primitives-colors-background-100);
   }
   ```

3. **Animate `transform` and `opacity`,** with the motion tokens:

   ```css
   .app-sheet {
     transition:
       transform var(--semantics-motion-duration-standard)
         var(--semantics-motion-easing-standard),
       opacity var(--semantics-motion-duration-standard)
         var(--semantics-motion-easing-standard);
   }
   ```

4. **Defer what can wait,** with React's own tools: `useDeferredValue` for a value that drives an
   expensive render, and `lazy` for a screen (§6).

---

## Quick Reference: Performance Checklist

### Before PR Merge

- [ ] Bundle budgets hold (the `analyze-bundle` check, §2)
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Animations at 60fps (Performance tab)
- [ ] No memory leaks (Heap snapshot comparison)
- [ ] Lighthouse CI passes (the `lighthouse` check: accessibility 100 on its four stories)

### Before Release

- [ ] The `analyze-bundle` and `lighthouse` checks pass on `main`
- [ ] Native platform profiling complete, where a change could cost a frame
- [ ] No budget raised without the measurement that justifies it

---

## Version History

| Version | Date       | Changes                                                  |
| ------- | ---------- | -------------------------------------------------------- |
| 1.0.0   | 2026-02-07 | Initial performance benchmarks                           |
| 1.1.0   | 2026-09-29 | What is measured; the planned budgets move to a proposal |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-29
