# Proposal: not built — the planned performance budgets

> **Proposal: not built.** These are the budgets, targets, tests and history written before the
> code. Nothing measures them, and some were never true: the tables marked the whole React package
> green at 25 KB gzipped while it measures over 60 KB, listed no runtime dependencies for a package
> that depends on Radix, and gave a version history, v1.0.0 to v3.0.0, of releases that never
> happened (the published versions are 0.1.0 to 0.5.0). Their examples import per-component
> subpaths, `@kozmos-ds/react/DatePicker` and `/Modal`, that the package does not export, and parts
> it does not have (DataTable, VirtualList, TabPanel, Modal). What is measured is
> `scripts/performance/bundle-analyzer.ts`'s four budgets and Lighthouse CI. It is kept as
> planning history; the sections below were in `.ai-skills/performance-benchmarks.md` until
> 2026-09-29.

## Proposal: from `.ai-skills/performance-benchmarks.md`

These sections were in [`performance-benchmarks.md`](../../.ai-skills/performance-benchmarks.md), where each heading now says what is built instead.

#### Proposal: Core Principles

1. **Zero Runtime Overhead**: CSS Variables + CVA means no JavaScript CSS-in-JS runtime
2. **Tree-Shakeable**: Only pay for what you use
3. **Native First**: Prefer platform-native solutions over JS abstractions
4. **Lazy by Default**: Components support lazy loading patterns
5. **Progressive Enhancement**: Core functionality works without JS where possible

#### Proposal: Performance Budget Tiers

| Tier   | Description                                | Bundle Limit        | TTI Impact |
| ------ | ------------------------------------------ | ------------------- | ---------- |
| **P0** | Core primitives (Button, Text, Box)        | <5KB per component  | <10ms      |
| **P1** | Common components (Input, Select, Modal)   | <10KB per component | <20ms      |
| **P2** | Complex components (DatePicker, DataTable) | <25KB per component | <50ms      |
| **P3** | SDK modules (MapView, AICompanion)         | <50KB per module    | <100ms     |

#### Proposal: Package-Level Budgets

| Package                        | Budget (minified) | Budget (gzip) | Current | Status |
| ------------------------------ | ----------------- | ------------- | ------- | ------ |
| `@kozmos-ds/tokens`            | 8KB               | 2KB           | —       | 🟢     |
| `@kozmos-ds/react` (full)      | 80KB              | 25KB          | —       | 🟢     |
| `@kozmos-ds/react` (core only) | 20KB              | 6KB           | —       | 🟢     |
| `@kozmos-ds/icons` (full)      | 150KB             | 40KB          | —       | 🟢     |
| `@kozmos-ds/icons` (per icon)  | 1KB               | 0.3KB         | —       | 🟢     |

#### Proposal: Component-Level Budgets (React)

| Component         | Budget (min) | Budget (gzip) | Dependencies |
| ----------------- | ------------ | ------------- | ------------ |
| **Primitives**    |              |               |              |
| Box               | 1KB          | 0.4KB         | —            |
| Text              | 1.5KB        | 0.5KB         | —            |
| Button            | 3KB          | 1KB           | CVA          |
| Icon              | 1KB          | 0.4KB         | —            |
| **Form Controls** |              |               |              |
| Input             | 4KB          | 1.5KB         | —            |
| Checkbox          | 3KB          | 1KB           | —            |
| Radio             | 3KB          | 1KB           | —            |
| Select            | 8KB          | 3KB           | Floating UI  |
| Switch            | 3KB          | 1KB           | —            |
| **Feedback**      |              |               |              |
| Modal             | 6KB          | 2KB           | Focus Lock   |
| Toast             | 5KB          | 1.8KB         | —            |
| Tooltip           | 4KB          | 1.5KB         | Floating UI  |
| Alert             | 3KB          | 1KB           | —            |
| **Layout**        |              |               |              |
| Stack             | 2KB          | 0.7KB         | —            |
| Grid              | 2KB          | 0.7KB         | —            |
| Divider           | 0.5KB        | 0.2KB         | —            |
| **Complex**       |              |               |              |
| DatePicker        | 20KB         | 7KB           | date-fns     |
| DataTable         | 25KB         | 8KB           | —            |
| Accordion         | 5KB          | 1.8KB         | —            |
| Tabs              | 5KB          | 1.8KB         | —            |

#### Proposal: Dependency Budget

| Dependency Type           | Budget | Notes                   |
| ------------------------- | ------ | ----------------------- |
| Runtime (required)        | 0KB    | No runtime dependencies |
| Peer (user provides)      | 50KB   | React, React DOM        |
| Optional (tree-shakeable) | 20KB   | Floating UI, date-fns   |

### Proposal: 3. Runtime Performance Budgets

#### Proposal: JavaScript Execution Time

| Operation            | Budget | Measurement                      |
| -------------------- | ------ | -------------------------------- |
| Component import     | <5ms   | Time to first paint after import |
| ThemeProvider mount  | <10ms  | Provider initialization          |
| Button render        | <1ms   | Single component render          |
| Modal open           | <16ms  | One frame (60fps)                |
| Select dropdown open | <16ms  | One frame (60fps)                |
| Form with 20 inputs  | <50ms  | Full form render                 |
| List with 100 items  | <100ms | Virtualized list render          |
| Theme switch         | <50ms  | Full re-render with new theme    |

#### Proposal: Animation Performance

| Animation Type      | Budget | Requirement                |
| ------------------- | ------ | -------------------------- |
| Hover transitions   | 60fps  | No dropped frames          |
| Modal enter/exit    | 60fps  | CSS-only, no JS animation  |
| Loading spinners    | 60fps  | CSS animation, no repaints |
| Scroll interactions | 60fps  | Passive listeners          |
| Drag operations     | 60fps  | requestAnimationFrame      |

#### Proposal: Interaction Latency

| Interaction              | Budget | Measurement                |
| ------------------------ | ------ | -------------------------- |
| Button click to response | <50ms  | Event to visual feedback   |
| Input keystroke          | <16ms  | Input to character display |
| Dropdown open            | <100ms | Click to fully visible     |
| Modal open               | <150ms | Trigger to content visible |
| Page navigation          | <200ms | Click to new content       |

#### Proposal: React Render Metrics

| Scenario                | Max Renders           | Max Render Time |
| ----------------------- | --------------------- | --------------- |
| Controlled input typing | 1 per keystroke       | <2ms            |
| Select option change    | 2 (value + display)   | <5ms            |
| Theme change            | 1 (memoized children) | <50ms           |
| Form submission         | 1                     | <10ms           |
| Modal open              | 1                     | <10ms           |

#### Proposal: Preventing Unnecessary Renders

```tsx
// ✅ Good: Memoized component
export const Button = React.memo(function Button(props: ButtonProps) {
  return <button className={buttonStyles(props)}>{props.children}</button>;
});

// ✅ Good: Stable callbacks
const handleClick = useCallback(
  (e: React.MouseEvent) => {
    onClick?.(e);
  },
  [onClick],
);

// ✅ Good: Memoized expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.label.localeCompare(b.label)),
  [items],
);
```

#### Proposal: React DevTools Profiler Targets

| Metric                              | Target       |
| ----------------------------------- | ------------ |
| Commit duration (simple component)  | <2ms         |
| Commit duration (complex component) | <10ms        |
| Render count (controlled input)     | 1 per change |
| Wasted renders                      | 0            |

#### Proposal: JavaScript Heap

| Scenario                 | Budget | Notes               |
| ------------------------ | ------ | ------------------- |
| Kozmos import (idle)     | <2MB   | After full import   |
| 10 simple components     | <0.5MB | Buttons, Text, etc. |
| Complex form (20 inputs) | <1MB   | With validation     |
| Data table (1000 rows)   | <5MB   | Virtualized         |
| Full application         | <50MB  | Typical SDK usage   |

#### Proposal: Memory Leak Prevention

```tsx
// ✅ Good: Cleanup subscriptions
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// ✅ Good: Cleanup timers
useEffect(() => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
}, []);

// ✅ Good: Cleanup observers
useEffect(() => {
  const observer = new ResizeObserver(handleResize);
  observer.observe(element);
  return () => observer.disconnect();
}, []);
```

#### Proposal: Detached DOM Nodes

| Scenario          | Max Detached Nodes  |
| ----------------- | ------------------- |
| Modal close       | 0 (within 1 frame)  |
| List item removal | 0 (within 1 frame)  |
| Tab switch        | 0 (lazy unmount OK) |
| Route change      | 0 (within 100ms)    |

#### Proposal: Asset Loading

| Asset Type    | Strategy                | Cache Policy    |
| ------------- | ----------------------- | --------------- |
| CSS Variables | Inline in ThemeProvider | —               |
| Component CSS | Bundled, tree-shaken    | Immutable (1yr) |
| Icons (used)  | Bundled, tree-shaken    | Immutable (1yr) |
| Fonts         | System fonts only       | —               |
| Images        | Consumer responsibility | —               |

#### Proposal: Code Splitting Strategy

```tsx
// Automatic code splitting for heavy components
const DatePicker = lazy(() => import("@kozmos-ds/react/DatePicker"));
const DataTable = lazy(() => import("@kozmos-ds/react/DataTable"));
const RichTextEditor = lazy(() => import("@kozmos-ds/react/RichTextEditor"));

// Usage with Suspense
<Suspense fallback={<Skeleton />}>
  <DatePicker />
</Suspense>;
```

#### Proposal: Preloading Strategy

```tsx
// Preload on hover for modals
const preloadModal = () => import("@kozmos-ds/react/Modal");

<Button onMouseEnter={preloadModal} onClick={openModal}>
  Open Settings
</Button>;
```

#### Proposal: iOS (SwiftUI)

| Metric               | Budget | Measurement              |
| -------------------- | ------ | ------------------------ |
| App launch impact    | <50ms  | Time added to cold start |
| View render          | <16ms  | One frame                |
| Animation frame rate | 60fps  | Core Animation           |
| Memory footprint     | <10MB  | Instruments              |
| Energy impact        | Low    | Xcode Energy Gauge       |

```swift
// Measuring render performance
import os.signpost

let log = OSLog(subsystem: "com.kozmos", category: "Performance")

func measureRender<T: View>(_ view: T) -> some View {
    view.onAppear {
        os_signpost(.begin, log: log, name: "Render")
    }
    .onDisappear {
        os_signpost(.end, log: log, name: "Render")
    }
}
```

#### Proposal: Android (Compose)

| Metric            | Budget                | Measurement              |
| ----------------- | --------------------- | ------------------------ |
| App launch impact | <50ms                 | Time added to cold start |
| Composition       | <16ms                 | One frame                |
| Frame rate        | 60fps (90fps capable) | Android Studio Profiler  |
| Memory footprint  | <15MB                 | Android Profiler         |
| Jank frames       | <1%                   | Systrace                 |

```kotlin
// Measuring composition performance
@Composable
fun MeasuredButton(onClick: () -> Unit, content: @Composable () -> Unit) {
    val composition = remember { mutableStateOf(0L) }

    LaunchedEffect(Unit) {
        composition.value = System.nanoTime()
    }

    Button(onClick = onClick) {
        content()
    }

    DisposableEffect(Unit) {
        val duration = System.nanoTime() - composition.value
        Log.d("Kozmos", "Button composition: ${duration / 1_000_000}ms")
        onDispose { }
    }
}
```

#### Proposal: Web (Core Web Vitals)

| Metric                          | Budget | Priority |
| ------------------------------- | ------ | -------- |
| LCP (Largest Contentful Paint)  | <2.5s  | High     |
| FID (First Input Delay)         | <100ms | High     |
| CLS (Cumulative Layout Shift)   | <0.1   | High     |
| INP (Interaction to Next Paint) | <200ms | High     |
| TTFB (Time to First Byte)       | <800ms | Medium   |

#### Proposal: Automated Testing

```tsx
// performance.test.ts
import { performance } from "perf_hooks";
import { render } from "@testing-library/react";
import { Button } from "@kozmos-ds/react";

describe("Performance", () => {
  it("Button renders within budget", () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<Button>Click</Button>);
      unmount();
    }

    const duration = performance.now() - start;
    const perRender = duration / 100;

    expect(perRender).toBeLessThan(1); // <1ms per render
  });

  it("Form with 20 inputs renders within budget", () => {
    const start = performance.now();

    render(
      <form>
        {Array.from({ length: 20 }, (_, i) => (
          <Input key={i} label={`Field ${i}`} />
        ))}
      </form>,
    );

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // <50ms total
  });
});
```

### Proposal: 10. Benchmark History

#### Proposal: Bundle Size Trend

| Version | @kozmos-ds/react | @kozmos-ds/tokens | @kozmos-ds/icons |
| ------- | ---------------- | ----------------- | ---------------- |
| v1.0.0  | 45KB             | 5KB               | 80KB             |
| v2.0.0  | 62KB             | 6KB               | 120KB            |
| v2.5.0  | 68KB             | 7KB               | 135KB            |
| v3.0.0  | 75KB             | 7.5KB             | 145KB            |

#### Proposal: Render Performance Trend

| Version | Button Render | Form (20 inputs) | Modal Open |
| ------- | ------------- | ---------------- | ---------- |
| v1.0.0  | 1.2ms         | 65ms             | 180ms      |
| v2.0.0  | 0.9ms         | 52ms             | 140ms      |
| v2.5.0  | 0.8ms         | 48ms             | 130ms      |
| v3.0.0  | 0.7ms         | 42ms             | 120ms      |

#### Proposal: Core Web Vitals (Storybook)

| Version | LCP  | FID  | CLS  |
| ------- | ---- | ---- | ---- |
| v2.0.0  | 1.8s | 45ms | 0.05 |
| v2.5.0  | 1.6s | 38ms | 0.03 |
| v3.0.0  | 1.4s | 32ms | 0.02 |

### Proposal: 11. Optimization Techniques

#### Proposal: Bundle Size Optimization

```tsx
// 1. Use specific imports (tree-shaking)
// ❌ Bad
import { Button, Input, Select } from '@kozmos-ds/react';

// ✅ Good (if bundler doesn't tree-shake well)
import { Button } from '@kozmos-ds/react/Button';
import { Input } from '@kozmos-ds/react/Input';

// 2. Lazy load heavy components
const DatePicker = lazy(() => import('@kozmos-ds/react/DatePicker'));

// 3. Use CSS variables instead of inline styles
// ❌ Bad
<Box style={{ padding: '16px', backgroundColor: '#f5f5f5' }} />

// ✅ Good
<Box className="my-box" />
// CSS: .my-box { padding: var(--kozmos-space-400); background: var(--kozmos-color-background-secondary); }
```

#### Proposal: Render Optimization

```tsx
// 1. Memoize expensive computations
const filteredItems = useMemo(
  () => items.filter((item) => item.category === category),
  [items, category],
);

// 2. Use stable callback references
const handleChange = useCallback((value: string) => {
  setValue(value);
}, []);

// 3. Virtualize long lists
import { VirtualList } from "@kozmos-ds/react";

<VirtualList
  items={thousandItems}
  itemHeight={48}
  renderItem={(item) => <ListItem {...item} />}
/>;

// 4. Defer non-critical updates
import { useDeferredValue } from "react";

const deferredSearch = useDeferredValue(searchQuery);
```

#### Proposal: Animation Optimization

```css
/* 1. Use transform/opacity for animations (GPU accelerated) */
.kozmos-modal-enter {
  transform: translateY(10px);
  opacity: 0;
}

.kozmos-modal-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out;
}

/* 2. Use will-change sparingly */
.kozmos-dropdown {
  will-change: transform, opacity;
}

/* 3. Prefer CSS animations over JS */
@keyframes kozmos-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

#### Proposal: Memory Optimization

```tsx
// 1. Clean up subscriptions
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal }).then(handleResponse);

  return () => controller.abort();
}, []);

// 2. Use WeakMap for caches
const elementCache = new WeakMap<HTMLElement, CachedData>();

// 3. Unmount off-screen content
<Tabs>
  <TabPanel unmountOnHide>
    <HeavyComponent />
  </TabPanel>
</Tabs>;
```

#### Proposal: Before Release

- [ ] Full benchmark suite passes
- [ ] Core Web Vitals within targets
- [ ] Native platform profiling complete
- [ ] No regression from previous version
- [ ] Performance documentation updated
