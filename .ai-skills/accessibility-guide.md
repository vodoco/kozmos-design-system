# Kozmos Design System - Accessibility Compliance Guide

> **Purpose:** This document provides comprehensive WCAG 2.1 AA compliance guidelines, component-specific accessibility requirements, and testing procedures for the Kozmos Design System on its three platforms: React, SwiftUI and Jetpack Compose.

---

## Table of Contents

1. [Overview](#1-overview)
2. [WCAG 2.1 Requirements](#2-wcag-21-requirements)
3. [Component Accessibility Matrix](#3-component-accessibility-matrix)
4. [Platform-Specific Implementation](#4-platform-specific-implementation)
5. [Keyboard Navigation](#5-keyboard-navigation)
6. [Screen Reader Support](#6-screen-reader-support)
7. [Color & Contrast](#7-color--contrast)
8. [Motion & Animation](#8-motion--animation)
9. [Focus Management](#9-focus-management)
10. [Testing Procedures](#10-testing-procedures)
11. [Accessibility Audit Checklist](#11-accessibility-audit-checklist)

---

## 1. Overview

### Accessibility Standards

Kozmos Design System targets **WCAG 2.1 Level AA** compliance across all platforms:

| Standard     | Level       | Status     | Notes          |
| ------------ | ----------- | ---------- | -------------- |
| WCAG 2.1 AA  | Required    | ✅ Target  | All components |
| WCAG 2.1 AAA | Recommended | 🟡 Partial | Where feasible |
| Section 508  | Required    | ✅ Target  | US Federal     |
| EN 301 549   | Required    | ✅ Target  | EU Standard    |
| ADA          | Required    | ✅ Target  | US Law         |

### Accessibility Principles (POUR)

| Principle          | Description                | Kozmos Implementation                   |
| ------------------ | -------------------------- | --------------------------------------- |
| **Perceivable**    | Users can perceive content | Color contrast, alt text, captions      |
| **Operable**       | Users can operate UI       | Keyboard nav, timing, seizure safety    |
| **Understandable** | Users can understand       | Clear labels, error prevention          |
| **Robust**         | Works with assistive tech  | Semantic HTML, ARIA, platform a11y APIs |

---

## 2. WCAG 2.1 Requirements

### 2.1 Perceivable

#### 1.1 Text Alternatives (Level A)

```tsx
// kozmos-skills: template — fragments of a render shown in turn, not one module
// ✅ All images must have alt text
<img
  src="/map-floor-1.png"
  alt="Floor 1 map showing entrance, elevators, and main corridor"
/>

// ✅ Decorative images use empty alt
<img src="/decorative-line.svg" alt="" />

// ✅ Icons with meaning need labels: an icon-only button names its action
<IconButton aria-label="Start navigation to destination" variant="ghost" size="icon">
  <Icon name="navigation-pointer-01" size="sm" />
</IconButton>
```

#### 1.3 Adaptable (Level A)

```tsx
// kozmos-skills: template — a fragment of a render, not a module
// ✅ Semantic structure: a real heading level, and text in a paragraph
<Card>
  <Heading level={2}>Meeting Room A</Heading>
  <Text as="p">Available now</Text>
</Card>

// ✅ Reading order matches visual order
// DOM order = visual order = tab order
```

#### 1.4 Distinguishable (Level AA)

| Requirement            | Kozmos token                                                             | Value         |
| ---------------------- | ------------------------------------------------------------------------ | ------------- |
| Text contrast (normal) | `--primitives-colors-foreground-0` on `--primitives-colors-background-0` | 4.5:1 minimum |
| Text contrast (large)  | `--primitives-colors-foreground-0` on `--primitives-colors-background-0` | 3:1 minimum   |
| Non-text contrast      | `--semantics-border-input`, the edge of anything you interact with       | 3:1 minimum   |
| Focus indicator        | `--primitives-colors-theme-600`, the focus ring                          | 3:1 minimum   |

`pnpm tokens:contrast:check` holds the text pairs to WCAG AA in both themes.

### 2.2 Operable

#### 2.1 Keyboard Accessible (Level A)

All interactive components must be keyboard accessible:

```tsx
// kozmos-skills: template — fragments of a render; open, setOpen and confirm are the app's
// ✅ All interactions work with keyboard: Button is a native <button>
<Button onClick={handleClick}>Navigate</Button>

// ✅ No keyboard traps: Dialog keeps focus inside while it is open, and Escape closes it
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>Start navigation?</DialogTitle>
    <Button onClick={confirm}>Confirm</Button>
    <DialogClose asChild>
      <Button variant="outline">Cancel</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
```

#### 2.4 Navigable (Level AA)

```tsx
// kozmos-skills: template — fragments of a page, not a module
// ✅ Skip links: a plain link to the main landmark, first on the page
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// ✅ Page titles: the document's title, set by the app
<title>Floor 1 - Building A | Pointr</title>

// ✅ Focus order follows visual order
// Tab through interactive elements in logical sequence
```

### 2.3 Understandable

#### 3.1 Readable (Level A)

```tsx
// kozmos-skills: template — fragments of a page, not a module
// ✅ Language declared on the document
<html lang="en">…</html>

// ✅ Language changes marked
<Text as="p">
  Welcome! <span lang="es">¡Bienvenido!</span>
</Text>
```

#### 3.2 Predictable (Level AA)

```tsx
// kozmos-skills: template — a fragment of a render, not a module
// ✅ No unexpected context changes on focus
<Input
  label="Destination"
  onFocus={() => {}} // No navigation or submission
  onBlur={() => {}} // No navigation or submission
/>

// ✅ Consistent navigation
// Same nav component across all pages
```

#### 3.3 Input Assistance (Level AA)

```tsx
// kozmos-skills: template — fragments of a render; confirming, setConfirming and remove are the app's
// ✅ Error identification: an error sets aria-invalid and describes the field with its message
<Input label="Destination" error="Please enter a valid destination" />

// ✅ Labels and instructions
<Input
  label="Destination"
  placeholder="e.g., Meeting Room A"
  helperText="Enter room name or number"
/>

// ✅ Error prevention: confirm an action that cannot be undone
<Dialog open={confirming} onOpenChange={setConfirming}>
  <DialogContent>
    <DialogTitle>Delete saved location?</DialogTitle>
    <DialogDescription>This action cannot be undone.</DialogDescription>
    <Button variant="destructive" onClick={remove}>
      Delete
    </Button>
    <DialogClose asChild>
      <Button variant="outline">Cancel</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
```

### 2.4 Robust

#### 4.1 Compatible (Level A)

```tsx
// kozmos-skills: template — fragments of a render; floor and setFloor are the app's
// ✅ Valid HTML
// No duplicate IDs, proper nesting

// ✅ Name, role and value exposed: Select is built on Radix's, which gives its
// trigger and its list their roles and state
<Select value={floor} onValueChange={setFloor}>
  <SelectTrigger aria-label="Select floor">
    <SelectValue placeholder="Floor" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Floor 1</SelectItem>
  </SelectContent>
</Select>

// ✅ Status messages announced: a polite live region
<p role="status" aria-live="polite">
  Navigation started
</p>
```

---

## 3. Component Accessibility Matrix

### Primitive Components

| Component  | Keyboard       | Screen Reader    | Focus Visible | ARIA     | WCAG Level |
| ---------- | -------------- | ---------------- | ------------- | -------- | ---------- |
| Button     | ✅ Enter/Space | ✅ Role=button   | ✅ Ring       | Optional | AA         |
| Input      | ✅ Full        | ✅ Label+Value   | ✅ Ring       | Required | AA         |
| Select     | ✅ Arrow keys  | ✅ Listbox       | ✅ Ring       | Required | AA         |
| Checkbox   | ✅ Space       | ✅ Checked state | ✅ Ring       | Required | AA         |
| RadioGroup | ✅ Arrow keys  | ✅ Group+Checked | ✅ Ring       | Required | AA         |
| Switch     | ✅ Space       | ✅ Checked state | ✅ Ring       | Required | AA         |
| Slider     | ✅ Arrow keys  | ✅ Value         | ✅ Ring       | Required | AA         |
| Link       | ✅ Enter       | ✅ Role=link     | ✅ Ring       | Optional | AA         |

### Compound Components

| Component | Keyboard        | Screen Reader  | Focus Visible | ARIA     | WCAG Level |
| --------- | --------------- | -------------- | ------------- | -------- | ---------- |
| Dialog    | ✅ Tab trap     | ✅ Dialog      | ✅ Content    | Required | AA         |
| Menu      | ✅ Arrow+Esc    | ✅ Menu        | ✅ Options    | Required | AA         |
| Tabs      | ✅ Arrow keys   | ✅ Tablist     | ✅ Tab        | Required | AA         |
| Accordion | ✅ Enter/Space  | ✅ Expanded    | ✅ Header     | Required | AA         |
| Toast     | N/A             | ✅ Live region | N/A           | Required | AA         |
| Tooltip   | ✅ Hover+Focus  | ✅ Describedby | N/A           | Required | AA         |
| Popover   | ✅ Esc to close | ✅ Dialog      | ✅ Content    | Required | AA         |

### SDK Components

| Component      | Keyboard      | Screen Reader    | Focus Visible | ARIA     | WCAG Level |
| -------------- | ------------- | ---------------- | ------------- | -------- | ---------- |
| MapView        | ✅ Pan/Zoom   | ✅ Landmarks     | ✅ POIs       | Custom   | AA         |
| WayfindingCard | ✅ Full nav   | ✅ Instructions  | ✅ Steps      | Required | AA         |
| SearchBar      | ✅ Full       | ✅ Results       | ✅ Ring       | Required | AA         |
| FloorSelector  | ✅ Arrow keys | ✅ Current floor | ✅ Option     | Required | AA         |
| POICard        | ✅ Full       | ✅ Details       | ✅ Actions    | Required | AA         |

---

## 4. Platform-Specific Implementation

### 4.1 React (Web)

Kozmos's React components are accessible as they ship: an app composes them rather than
re-implementing them. `Button` renders a native `<button>`. While `isLoading` it is disabled and
draws a spinner beside its label, so the label should say what is happening:

```tsx
import { Button } from "@kozmos-ds/react";

export function SaveButton({ saving }: { saving: boolean }) {
  return <Button isLoading={saving}>{saving ? "Saving…" : "Save"}</Button>;
}
```

A control of your own takes the colour of Kozmos's focus ring, `--primitives-colors-theme-600`,
and hides text visually without hiding it from a screen reader like this:

```css
/* Focus styles, for a control of your own */
.my-control:focus-visible {
  outline: 2px solid var(--primitives-colors-theme-600);
  outline-offset: 2px;
}

/* Visually hidden but accessible */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 4.2 iOS (SwiftUI)

```swift
// A pattern for a button of your own, not Kozmos's source: its KozmosButton, in
// packages/ios, already takes isLoading and isDisabled.
import SwiftUI

public struct AccessibleButton: View {
    let title: String
    let action: () -> Void
    let isLoading: Bool

    public init(
        _ title: String,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.isLoading = isLoading
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack {
                if isLoading {
                    ProgressView()
                        .accessibilityHidden(true)
                }
                Text(title)
            }
        }
        .disabled(isLoading)
        .accessibilityLabel(isLoading ? "Loading, \(title)" : title)
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Double tap to activate")
    }
}

// A pattern for a map of your own
public struct AccessibleMapView: View {
    @State private var focusedPOI: POI?

    public var body: some View {
        Map(...)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Interactive map")
            .accessibilityHint("Use rotor to navigate points of interest")
            .accessibilityRotor("Points of Interest") {
                ForEach(pois) { poi in
                    AccessibilityRotorEntry(poi.name, id: poi.id) {
                        focusedPOI = poi
                    }
                }
            }
    }
}
```

### 4.3 Android (Jetpack Compose)

```kotlin
// A pattern for a button of your own, not Kozmos's source: its KozmosButton, in
// packages/android, already takes isLoading.
@Composable
fun AccessibleButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        enabled = enabled && !isLoading,
        modifier = modifier.semantics {
            if (isLoading) {
                stateDescription = "Loading"
            }
            contentDescription = if (isLoading) "Loading, $text" else text
        }
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier
                    .size(16.dp)
                    .clearAndSetSemantics { }
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(text)
    }
}

// Custom accessibility actions, for a map of your own
@Composable
fun AccessibleMapView(
    pois: List<POI>,
    onPOISelected: (POI) -> Unit
) {
    Box(
        modifier = Modifier
            .semantics {
                contentDescription = "Interactive map with ${pois.size} points of interest"
                customActions = pois.map { poi ->
                    CustomAccessibilityAction(
                        label = "Navigate to ${poi.name}",
                        action = {
                            onPOISelected(poi)
                            true
                        }
                    )
                }
            }
    ) {
        // Map content
    }
}
```

### 4.4 React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 5. Keyboard Navigation

### 5.1 Standard Key Bindings

| Key                | Action                     | Components                |
| ------------------ | -------------------------- | ------------------------- |
| `Tab`              | Move to next focusable     | All                       |
| `Shift + Tab`      | Move to previous focusable | All                       |
| `Enter`            | Activate                   | Button, Link, Menu item   |
| `Space`            | Activate / Toggle          | Button, Checkbox, Switch  |
| `Arrow Up/Down`    | Navigate options           | Select, Menu, Radio group |
| `Arrow Left/Right` | Navigate tabs, Slider      | Tabs, Slider, Radio group |
| `Escape`           | Close / Cancel             | Dialog, Menu, Popover     |
| `Home`             | First item                 | List, Menu, Slider        |
| `End`              | Last item                  | List, Menu, Slider        |

### 5.2 Focus Management Patterns

Kozmos's overlays manage focus themselves. `Dialog`, `Drawer` and `BottomSheet` keep focus inside
while they are open and hand it back to their trigger when they close, and `Menu` and `Popover`
return it to their trigger on close. None needs a focus trap of your own:

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@kozmos-ds/react";

export function ShareDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Share</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Share this location</DialogTitle>
        <DialogDescription>Send a link to the meeting room.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.3 Roving Tab Index

`Tabs` and `RadioGroup` give their items one Tab stop, and move between them with the arrow keys,
Home and End. With `activationMode="manual"`, Tabs moves focus without selecting until Enter or
Space:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kozmos-ds/react";

export function FloorTabs() {
  return (
    <Tabs defaultValue="1" activationMode="manual">
      <TabsList aria-label="Floors">
        <TabsTrigger value="1">Floor 1</TabsTrigger>
        <TabsTrigger value="2">Floor 2</TabsTrigger>
      </TabsList>
      <TabsContent value="1">The first floor's rooms.</TabsContent>
      <TabsContent value="2">The second floor's rooms.</TabsContent>
    </Tabs>
  );
}
```

A widget of your own follows the WAI-ARIA Authoring Practices' roving tabindex: one item takes
`tabIndex={0}`, the rest `-1`, and the arrow keys move both the index and the focus.

---

## 6. Screen Reader Support

### 6.1 ARIA Attributes Reference

| Attribute          | Usage                  | Example                                         |
| ------------------ | ---------------------- | ----------------------------------------------- |
| `aria-label`       | Accessible name        | `<button aria-label="Close dialog">×</button>`  |
| `aria-labelledby`  | Reference to label     | `<div aria-labelledby="heading-id">`            |
| `aria-describedby` | Additional description | `<input aria-describedby="hint-id" />`          |
| `aria-live`        | Dynamic content        | `<div aria-live="polite">Status update</div>`   |
| `aria-expanded`    | Expandable state       | `<button aria-expanded="false">Menu</button>`   |
| `aria-haspopup`    | Has popup              | `<button aria-haspopup="menu">Options</button>` |
| `aria-current`     | Current item           | `<a aria-current="page">Home</a>`               |
| `aria-pressed`     | Toggle state           | `<button aria-pressed="true">Bold</button>`     |
| `aria-invalid`     | Validation state       | `<input aria-invalid="true" />`                 |
| `aria-busy`        | Loading state          | `<button aria-busy="true">Saving...</button>`   |

### 6.2 Live Regions

```tsx
// kozmos-skills: template — fragments of a render; statusMessage and errorMessage are the app's
// Polite announcements (non-urgent)
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive announcements (urgent)
<div role="alert">
  {errorMessage}
</div>
```

Kozmos's `Toast` is built on Radix's, whose viewport announces each toast: it needs no live region
of its own.

### 6.3 Screen Reader Testing Matrix

| Platform | Screen Reader | Browser/OS     | Priority       |
| -------- | ------------- | -------------- | -------------- |
| Web      | NVDA          | Chrome/Windows | ✅ Required    |
| Web      | VoiceOver     | Safari/macOS   | ✅ Required    |
| Web      | JAWS          | Chrome/Windows | 🟡 Recommended |
| iOS      | VoiceOver     | Safari/iOS     | ✅ Required    |
| Android  | TalkBack      | Chrome/Android | ✅ Required    |

---

## 7. Color & Contrast

### 7.1 Contrast Requirements

| Content Type         | WCAG Level | Minimum Ratio | Kozmos Target |
| -------------------- | ---------- | ------------- | ------------- |
| Normal text (< 18pt) | AA         | 4.5:1         | 5:1           |
| Large text (≥ 18pt)  | AA         | 3:1           | 4:1           |
| UI components        | AA         | 3:1           | 3.5:1         |
| Focus indicators     | AA         | 3:1           | 4:1           |
| Normal text          | AAA        | 7:1           | —             |
| Large text           | AAA        | 4.5:1         | —             |

### 7.2 Color Token Contrast Matrix

The pairs Kozmos promises are in `packages/tokens/src/contrast-contract.json`, each with its
minimum: the app's background and text, `--primitives-colors-background-0` and
`--primitives-colors-foreground-0`, at 4.5:1 among them. `pnpm tokens:contrast:check` measures
every pair in both themes from the built CSS, and fails when one falls below its minimum.

### 7.3 Color-Only Information

```tsx
// kozmos-skills: template — fragments of a render; isActive is the app's
// ❌ Bad: colour alone says the state
<Badge variant={isActive ? "default" : "destructive"} />

// ✅ Good: colour, an icon and words
<Badge
  variant={isActive ? "default" : "destructive"}
  icon={<Icon name={isActive ? "check" : "x"} size="xs" />}
>
  {isActive ? "Active" : "Inactive"}
</Badge>

// ❌ Bad: an error shown only by a red border
<Input style={{ borderColor: "red" }} />

// ✅ Good: an error with its message, which Input shows and announces
<Input label="Destination" error="This field is required" />
```

### 7.4 High Contrast Mode Support

Kozmos ships no forced-colours rules yet, so its controls take the browser's defaults in Windows
High Contrast mode, and a borderless control can lose its edge. An app can give its own controls
rules like these:

```css
/* Windows High Contrast Mode */
@media (forced-colors: active) {
  .my-control {
    border: 2px solid ButtonText;
  }

  .my-control:focus {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  .my-control[disabled] {
    border-color: GrayText;
    color: GrayText;
  }
}
```

---

## 8. Motion & Animation

### 8.1 Reduced Motion Support

```css
/* Default animations */
.panel {
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out;
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
    animation: none;
  }

  /* Alternative for essential motion */
  .loading-spinner {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

A hook for your own animations, from the same media query:

```tsx
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const list = window.matchMedia(QUERY);
    const update = () => setReduced(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return reduced;
}
```

### 8.2 Animation Guidelines

| Type     | Duration  | Use Case     | Reduced Motion   |
| -------- | --------- | ------------ | ---------------- |
| Micro    | 100-200ms | Hover, focus | Instant          |
| Standard | 200-300ms | Transitions  | Instant or fade  |
| Emphasis | 300-500ms | Attention    | Fade only        |
| Complex  | 500ms+    | Tutorials    | Skip or simplify |

### 8.3 Seizure Safety

```typescript
// kozmos-skills: template — a sketch; countBrightnessTransitions is yours to write
// No flashing content > 3 times per second
// If using video, check with PEAT tool

const SAFE_FLASH_THRESHOLD = 3; // per second

function validateAnimation(keyframes: Keyframe[]) {
  // Count brightness changes
  const flashCount = countBrightnessTransitions(keyframes);
  const duration = keyframes.length / 60; // Assuming 60fps

  if (flashCount / duration > SAFE_FLASH_THRESHOLD) {
    console.warn("Animation may cause seizures. Reduce flash rate.");
  }
}
```

---

## 9. Focus Management

### 9.1 Focus Indicator Styles

Kozmos's components draw their own focus ring. For a control of your own:

```css
/* Base focus ring, in Kozmos's ring colour */
:root {
  --focus-ring-width: 2px;
  --focus-ring-color: var(--primitives-colors-theme-600);
  --focus-ring-offset: 2px;
}

/* Apply to all focusable elements */
.focusable:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Remove default on mouse focus */
.focusable:focus:not(:focus-visible) {
  outline: none;
}
```

The token follows the theme, so the ring needs no rule of its own in the dark.

### 9.2 Focus Order

```tsx
// kozmos-skills: template — the wrong order and the right one, side by side
// Ensure logical focus order
// DOM order = visual order = tab order

// ❌ Bad: CSS reordering breaks focus
<div style={{ display: "flex", flexDirection: "row-reverse" }}>
  <Button>Cancel</Button> {/* Focused first but appears second */}
  <Button>Save</Button> {/* Focused second but appears first */}
</div>

// ✅ Good: DOM order matches visual
<div style={{ display: "flex" }}>
  <Button>Save</Button>
  <Button>Cancel</Button>
</div>
```

### 9.3 Skip Links

```tsx
export function SkipLinks() {
  return (
    <nav aria-label="Skip links" className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
    </nav>
  );
}
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 1rem;
  background: var(--primitives-colors-background-0);
}

.skip-link:focus {
  top: 0;
}
```

---

## 10. Testing Procedures

### 10.1 Automated Testing

```tsx
// kozmos-skills: template — a test beside Button in packages/react, whose setup file adds the axe matchers
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have no violations when disabled", async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have no violations when loading", async () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 10.2 Manual Testing Checklist

```markdown
## Keyboard Testing

- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows logical reading order
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Escape closes dialogs/menus
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in menus/selects

## Screen Reader Testing (VoiceOver/NVDA)

- [ ] All content readable
- [ ] Interactive elements announce role
- [ ] Form fields have labels
- [ ] Error messages announced
- [ ] Status updates announced
- [ ] Images have alt text
- [ ] Links/buttons have accessible names

## Visual Testing

- [ ] 4.5:1 contrast for text
- [ ] 3:1 contrast for UI components
- [ ] Works at 200% zoom
- [ ] Works at 400% zoom (reflow)
- [ ] Color not only indicator
- [ ] Focus indicators visible
```

### 10.3 Storybook a11y Addon

Storybook's configuration, `apps/docs/.storybook/main.ts`, already lists `@storybook/addon-a11y`. A
story can set the addon's rules in its meta:

```tsx
import type { Meta } from "@storybook/react";
import { Button } from "@kozmos-ds/react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "focus-order-semantics", enabled: true },
        ],
      },
    },
  },
};

export default meta;
```

### 10.4 CI/CD Integration

There is no separate accessibility workflow and no `test:a11y` script. Accessibility is checked
inside the workflows every pull request runs:

- **`ci.yml`:** React's unit tests (`pnpm test`) include `vitest-axe` checks; the "Stories &
  Interactions (chromium)" shard runs axe on every story in light and dark at 320 and 1280 px
  (`pnpm test:storybook-audit`) and fails on any violation; "Core Pipeline & POI Gallery" runs
  `scripts/skills/check-a11y.ts` on five stories.
- **`lighthouse.yml`:** Lighthouse CI over four stories of the built Storybook
  (`lighthouserc.json`) fails below an accessibility score of 100.

Locally, against a running Storybook (`pnpm --filter @kozmos-ds/docs storybook`):

```bash
# Every story, as CI runs it (without STORY_SCOPE=all, one story per component)
STORY_SCOPE=all STORYBOOK_URL=http://127.0.0.1:6006 pnpm test:storybook-audit
STORYBOOK_URL=http://127.0.0.1:6006 pnpm exec tsx scripts/skills/check-a11y.ts
```

---

## 11. Accessibility Audit Checklist

### Per-Component Checklist

```markdown
## Component: [Name]

### Semantics

- [ ] Uses semantic HTML elements
- [ ] Has appropriate ARIA role (if not native)
- [ ] Has accessible name (label or aria-label)
- [ ] Has accessible description (if needed)

### Keyboard

- [ ] Focusable (if interactive)
- [ ] Focus indicator visible
- [ ] Keyboard operable
- [ ] No keyboard traps

### Screen Reader

- [ ] Content announced correctly
- [ ] State changes announced
- [ ] Error messages announced

### Visual

- [ ] Color contrast meets AA
- [ ] Color not only indicator
- [ ] Works at 200% zoom
- [ ] Supports reduced motion

### States

- [ ] Disabled state accessible
- [ ] Loading state accessible
- [ ] Error state accessible
- [ ] Selected state accessible

### Documentation

- [ ] a11y props documented
- [ ] Usage examples include a11y
- [ ] Known limitations documented
```

### Release Checklist

```markdown
## Pre-Release Accessibility Audit

### Automated Tests

- [ ] axe-core tests passing
- [ ] Lighthouse accessibility score 100 (the `lighthouse` check)
- [ ] No unintended changes in Visual Review (`pnpm test:visual`)

### Manual Testing

- [ ] VoiceOver on Safari (macOS)
- [ ] NVDA on Chrome (Windows)
- [ ] TalkBack on Chrome (Android)
- [ ] VoiceOver on iOS Safari

### Documentation

- [ ] a11y section in docs
- [ ] VPAT/ACR updated (if applicable)
- [ ] Known issues documented

### Sign-off

- [ ] QA approved
- [ ] Accessibility specialist approved
- [ ] Ready for release
```

---

## Related Documents

- [Testing Patterns](./testing-patterns.md) — Includes accessibility test examples
- [Design Philosophy](./design-philosophy.md) — Inclusive design principles
- [Component Creation Guide](./component-creation-guide.md) — Accessibility requirements in component scaffold

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
