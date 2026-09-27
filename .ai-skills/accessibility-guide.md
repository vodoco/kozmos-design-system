# Kozmos Design System - Accessibility Compliance Guide

> **Purpose:** This document provides comprehensive WCAG 2.1 AA compliance guidelines, component-specific accessibility requirements, and testing procedures for the Kozmos Design System across all 6 platforms.

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

```typescript
// ✅ All images must have alt text
<KozmosImage
  src="/map-floor-1.png"
  alt="Floor 1 map showing entrance, elevators, and main corridor"
/>

// ✅ Decorative images use empty alt
<KozmosImage
  src="/decorative-line.svg"
  alt=""
  role="presentation"
/>

// ✅ Icons with meaning need labels
<KozmosIconButton
  icon={<NavigateIcon />}
  aria-label="Start navigation to destination"
/>
```

#### 1.3 Adaptable (Level A)

```typescript
// ✅ Semantic structure
<KozmosCard as="article">
  <KozmosHeading level={2}>Meeting Room A</KozmosHeading>
  <KozmosText>Available now</KozmosText>
</KozmosCard>

// ✅ Reading order matches visual order
// DOM order = visual order = tab order
```

#### 1.4 Distinguishable (Level AA)

| Requirement            | Kozmos Token                    | Value         |
| ---------------------- | ------------------------------- | ------------- |
| Text contrast (normal) | `--kozmos-color-text-primary`   | 4.5:1 minimum |
| Text contrast (large)  | `--kozmos-color-text-primary`   | 3:1 minimum   |
| Non-text contrast      | `--kozmos-color-border-default` | 3:1 minimum   |
| Focus indicator        | `--kozmos-focus-ring`           | 3:1 minimum   |

### 2.2 Operable

#### 2.1 Keyboard Accessible (Level A)

All interactive components must be keyboard accessible:

```typescript
// ✅ All interactions work with keyboard
<KozmosButton onClick={handleClick} onKeyDown={handleKeyDown}>
  Navigate
</KozmosButton>

// ✅ No keyboard traps
<KozmosModal onClose={handleClose}>
  <KozmosButton>Confirm</KozmosButton>
  <KozmosButton onClick={handleClose}>Cancel</KozmosButton>
</KozmosModal>
```

#### 2.4 Navigable (Level AA)

```typescript
// ✅ Skip links
<KozmosSkipLink href="#main-content">
  Skip to main content
</KozmosSkipLink>

// ✅ Page titles
<KozmosPageTitle>Floor 1 - Building A | Pointr</KozmosPageTitle>

// ✅ Focus order follows visual order
// Tab through interactive elements in logical sequence
```

### 2.3 Understandable

#### 3.1 Readable (Level A)

```typescript
// ✅ Language declared
<html lang="en">
  <KozmosApp>...</KozmosApp>
</html>

// ✅ Language changes marked
<KozmosText>
  Welcome! <span lang="es">Bienvenido!</span>
</KozmosText>
```

#### 3.2 Predictable (Level AA)

```typescript
// ✅ No unexpected context changes on focus
<KozmosInput
  onFocus={() => {}} // No navigation or submission
  onBlur={() => {}}  // No navigation or submission
/>

// ✅ Consistent navigation
// Same nav component across all pages
```

#### 3.3 Input Assistance (Level AA)

```typescript
// ✅ Error identification
<KozmosInput
  error="Please enter a valid destination"
  aria-invalid={true}
  aria-describedby="destination-error"
/>

// ✅ Labels and instructions
<KozmosInput
  label="Destination"
  placeholder="e.g., Meeting Room A"
  hint="Enter room name or number"
/>

// ✅ Error prevention
<KozmosConfirmDialog
  title="Delete saved location?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
/>
```

### 2.4 Robust

#### 4.1 Compatible (Level A)

```typescript
// ✅ Valid HTML
// No duplicate IDs, proper nesting

// ✅ Name, Role, Value exposed
<KozmosSelect
  aria-label="Select floor"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  role="combobox"
>
  <KozmosOption value="1" role="option">Floor 1</KozmosOption>
</KozmosSelect>

// ✅ Status messages announced
<KozmosToast role="status" aria-live="polite">
  Navigation started
</KozmosToast>
```

---

## 3. Component Accessibility Matrix

### Primitive Components

| Component | Keyboard       | Screen Reader    | Focus Visible | ARIA     | WCAG Level |
| --------- | -------------- | ---------------- | ------------- | -------- | ---------- |
| Button    | ✅ Enter/Space | ✅ Role=button   | ✅ Ring       | Optional | AA         |
| Input     | ✅ Full        | ✅ Label+Value   | ✅ Ring       | Required | AA         |
| Select    | ✅ Arrow keys  | ✅ Listbox       | ✅ Ring       | Required | AA         |
| Checkbox  | ✅ Space       | ✅ Checked state | ✅ Ring       | Required | AA         |
| Radio     | ✅ Arrow keys  | ✅ Group+Checked | ✅ Ring       | Required | AA         |
| Switch    | ✅ Space       | ✅ Checked state | ✅ Ring       | Required | AA         |
| Slider    | ✅ Arrow keys  | ✅ Value         | ✅ Ring       | Required | AA         |
| Link      | ✅ Enter       | ✅ Role=link     | ✅ Ring       | Optional | AA         |

### Compound Components

| Component | Keyboard        | Screen Reader  | Focus Visible | ARIA     | WCAG Level |
| --------- | --------------- | -------------- | ------------- | -------- | ---------- |
| Modal     | ✅ Tab trap     | ✅ Dialog      | ✅ Content    | Required | AA         |
| Dropdown  | ✅ Arrow+Esc    | ✅ Menu        | ✅ Options    | Required | AA         |
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
| DirectionsList | ✅ Arrow keys | ✅ Step by step  | ✅ Current    | Required | AA         |

---

## 4. Platform-Specific Implementation

### 4.1 React (Web)

```tsx
// Button.tsx - Accessible implementation
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && <span aria-hidden="true" className="spinner" />}
        <span className={loading ? "visually-hidden" : ""}>{children}</span>
        {loading && <span className="visually-hidden">Loading...</span>}
      </button>
    );
  },
);
```

```css
/* Focus styles */
.kozmos-button:focus-visible {
  outline: 2px solid var(--kozmos-color-focus);
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
// Button.swift - Accessible implementation
import SwiftUI

public struct KozmosButton: View {
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

// MapView with accessibility
public struct KozmosMapView: View {
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
// Button.kt - Accessible implementation
@Composable
fun KozmosButton(
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

// Custom accessibility actions
@Composable
fun KozmosMapView(
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

```tsx
// Button.tsx - Accessible implementation
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function KozmosButton({
  title,
  onPress,
  loading,
  disabled,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={loading ? `Loading, ${title}` : title}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      accessibilityHint="Double tap to activate"
    >
      {loading && <ActivityIndicator accessibilityElementsHidden={true} />}
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}

// Live region for announcements
import { AccessibilityInfo } from "react-native";

export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}
```

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
| `Escape`           | Close / Cancel             | Modal, Dropdown, Popover  |
| `Home`             | First item                 | List, Menu, Slider        |
| `End`              | Last item                  | List, Menu, Slider        |

### 5.2 Focus Management Patterns

```typescript
// Focus trap for modals
import { useFocusTrap } from '@kozmos/react';

function Modal({ isOpen, onClose, children }) {
  const trapRef = useFocusTrap(isOpen);

  return isOpen ? (
    <div ref={trapRef} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
}

// Return focus on close
import { useReturnFocus } from '@kozmos/react';

function Dropdown({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useReturnFocus(isOpen);

  return (
    <>
      <button ref={returnFocusRef} onClick={() => setIsOpen(true)}>
        {trigger}
      </button>
      {isOpen && <DropdownMenu>{children}</DropdownMenu>}
    </>
  );
}
```

### 5.3 Roving Tab Index

```typescript
// Tab list with roving tabindex
function Tabs({ tabs, activeTab, onChange }) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        setFocusedIndex((index + 1) % tabs.length);
        break;
      case 'ArrowLeft':
        setFocusedIndex((index - 1 + tabs.length) % tabs.length);
        break;
      case 'Home':
        setFocusedIndex(0);
        break;
      case 'End':
        setFocusedIndex(tabs.length - 1);
        break;
    }
  };

  return (
    <div role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-selected={tab.id === activeTab}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

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

```typescript
// Polite announcements (non-urgent)
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive announcements (urgent)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>

// Toast implementation
function Toast({ message, type }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  );
}
```

### 6.3 Screen Reader Testing Matrix

| Platform     | Screen Reader | Browser/OS     | Priority       |
| ------------ | ------------- | -------------- | -------------- |
| Web          | NVDA          | Chrome/Windows | ✅ Required    |
| Web          | VoiceOver     | Safari/macOS   | ✅ Required    |
| Web          | JAWS          | Chrome/Windows | 🟡 Recommended |
| iOS          | VoiceOver     | Safari/iOS     | ✅ Required    |
| Android      | TalkBack      | Chrome/Android | ✅ Required    |
| React Native | VoiceOver     | iOS            | ✅ Required    |
| React Native | TalkBack      | Android        | ✅ Required    |

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

```
Light Theme Contrast Ratios:
┌─────────────────────────────────────────────────────────────┐
│ Token                      │ vs Background │ Ratio │ Pass │
├─────────────────────────────────────────────────────────────┤
│ --kozmos-color-text-primary   │ surface-primary   │ 12.5:1 │ ✅ AAA │
│ --kozmos-color-text-secondary │ surface-primary   │  7.2:1 │ ✅ AAA │
│ --kozmos-color-text-tertiary  │ surface-primary   │  4.8:1 │ ✅ AA  │
│ --kozmos-color-text-disabled  │ surface-primary   │  3.2:1 │ 🟡 UI  │
│ --kozmos-color-border-default │ surface-primary   │  3.1:1 │ ✅ UI  │
│ --kozmos-color-primary        │ surface-primary   │  4.6:1 │ ✅ AA  │
│ --kozmos-color-primary        │ on-primary        │  5.2:1 │ ✅ AA  │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Color-Only Information

```typescript
// ❌ Bad: Color only indicates state
<Badge color={isActive ? 'green' : 'red'} />

// ✅ Good: Color + icon + text
<Badge
  color={isActive ? 'success' : 'error'}
  icon={isActive ? <CheckIcon /> : <XIcon />}
>
  {isActive ? 'Active' : 'Inactive'}
</Badge>

// ❌ Bad: Error only shown by red border
<Input error style={{ borderColor: 'red' }} />

// ✅ Good: Error with icon and message
<Input
  error
  errorMessage="This field is required"
  startIcon={<ErrorIcon />}
  aria-invalid={true}
/>
```

### 7.4 High Contrast Mode Support

```css
/* Windows High Contrast Mode */
@media (forced-colors: active) {
  .kozmos-button {
    border: 2px solid ButtonText;
  }

  .kozmos-button:focus {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  .kozmos-button[disabled] {
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
.kozmos-component {
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out;
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  .kozmos-component {
    transition: none;
    animation: none;
  }

  /* Alternative for essential motion */
  .kozmos-loading-spinner {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

```typescript
// React hook for reduced motion
import { useReducedMotion } from '@kozmos/react';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      Content
    </motion.div>
  );
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

```css
/* Base focus ring */
:root {
  --kozmos-focus-ring-width: 2px;
  --kozmos-focus-ring-color: var(--kozmos-color-primary);
  --kozmos-focus-ring-offset: 2px;
}

/* Apply to all focusable elements */
.kozmos-focusable:focus-visible {
  outline: var(--kozmos-focus-ring-width) solid var(--kozmos-focus-ring-color);
  outline-offset: var(--kozmos-focus-ring-offset);
}

/* Remove default on mouse focus */
.kozmos-focusable:focus:not(:focus-visible) {
  outline: none;
}

/* High contrast on dark backgrounds */
.kozmos-dark .kozmos-focusable:focus-visible {
  outline-color: var(--kozmos-color-on-primary);
  box-shadow: 0 0 0 4px var(--kozmos-color-primary);
}
```

### 9.2 Focus Order

```typescript
// Ensure logical focus order
// DOM order = visual order = tab order

// ❌ Bad: CSS reordering breaks focus
<div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
  <Button>Cancel</Button>  {/* Focused first but appears second */}
  <Button>Save</Button>    {/* Focused second but appears first */}
</div>

// ✅ Good: DOM order matches visual
<div style={{ display: 'flex' }}>
  <Button>Save</Button>
  <Button>Cancel</Button>
</div>
```

### 9.3 Skip Links

```tsx
// Skip link component
function SkipLinks() {
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

// CSS for skip links
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 1rem;
  background: var(--kozmos-color-surface-primary);
}

.skip-link:focus {
  top: 0;
}
```

---

## 10. Testing Procedures

### 10.1 Automated Testing

```typescript
// vitest + axe-core
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations when loading', async () => {
    const { container } = render(<Button loading>Loading</Button>);
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

```typescript
// .storybook/main.ts
export default {
  addons: ["@storybook/addon-a11y"],
};

// Component.stories.tsx
export default {
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
```

### 10.4 CI/CD Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run axe tests
        run: pnpm test:a11y

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: "./.lighthouserc.json"
          uploadArtifacts: true
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
- [ ] Lighthouse accessibility score ≥ 90
- [ ] No regressions in Chromatic

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

- [Testing Patterns](./.ai-skills/testing-patterns.md) — Includes accessibility test examples
- [Design Philosophy](./.ai-skills/design-philosophy.md) — Inclusive design principles
- [Component Creation Guide](./.ai-skills/component-creation-guide.md) — Accessibility requirements in component scaffold

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
