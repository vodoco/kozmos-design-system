# Kozmos Design System - Figma Component Audit Checklist

> **Purpose:** This document provides checklists for designers to ensure Figma components are properly structured for Code Connect integration and consistent implementation across platforms.

---

## Table of Contents

1. [Quick Reference Checklist](#1-quick-reference-checklist)
2. [Component Structure Requirements](#2-component-structure-requirements)
3. [Variant Setup](#3-variant-setup)
4. [Variable & Token Usage](#4-variable--token-usage)
5. [State Coverage](#5-state-coverage)
6. [Accessibility Annotations](#6-accessibility-annotations)
7. [Responsive Design](#7-responsive-design)
8. [Documentation & Handoff](#8-documentation--handoff)
9. [Code Connect Preparation](#9-code-connect-preparation)
10. [Pre-Publication Checklist](#10-pre-publication-checklist)

---

## 1. Quick Reference Checklist

Use this abbreviated checklist for quick audits:

### Component Ready for Code Connect?

```
□ Component is in the correct library file
□ Component uses Figma Variables (no hardcoded values)
□ All variants defined with consistent property names
□ All states designed (default, hover, focus, active, disabled)
□ Dark mode variant exists (or responds to mode variable)
□ Auto Layout used throughout
□ Proper constraints for responsive behavior
□ Accessibility annotations added
□ Component description filled in
□ Naming follows convention: ComponentName/Variant
```

### Quick Pass/Fail Criteria

| Criterion            | Pass                      | Fail                         |
| -------------------- | ------------------------- | ---------------------------- |
| Uses Figma Variables | All tokens from Variables | Any hardcoded hex/values     |
| Has all states       | 5+ states defined         | Missing hover/focus/disabled |
| Auto Layout          | 100% Auto Layout          | Any fixed positioning        |
| Naming               | PascalCase/Variant        | Inconsistent naming          |
| Description          | Filled in                 | Empty                        |

---

## 2. Component Structure Requirements

### File Organization

An example layout. The Core Library itself is painted by the importer plugin,
`figma/foundations-importer`, whose layout registry names the component sets it paints, and
`pnpm figma:verify` checks the published file against it.

```
Kozmos Design System (Library File)
├── 📁 _Tokens (local styles/variables)
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Effects
├── 📁 Primitives
│   ├── Button
│   ├── Input
│   ├── Checkbox
│   └── ...
├── 📁 Composites
│   ├── Card
│   ├── Dialog
│   ├── SearchPanel
│   └── ...
└── 📁 Templates
    ├── MapWidget
    ├── POICard
    └── ...
```

### Checklist: File Structure

- [ ] Component is in the correct category folder
- [ ] Component is a **main component** (not an instance)
- [ ] Component is **published** to the team library
- [ ] Component frame is named correctly (PascalCase)
- [ ] No orphaned layers outside the component frame

### Naming Convention

| Type           | Convention                 | Example                  |
| -------------- | -------------------------- | ------------------------ |
| Main Component | `PascalCase`               | `Button`, `SearchInput`  |
| Variant Group  | `PascalCase/variant=Value` | `Button/variant=Primary` |
| Sub-component  | `_PascalCase`              | `_ButtonIcon`            |
| Internal layer | `lowercase-kebab`          | `icon-wrapper`           |

### Checklist: Naming

- [ ] Main component uses PascalCase
- [ ] Variant properties use camelCase
- [ ] Variant values use lowercase or PascalCase consistently
- [ ] Internal layers use descriptive names (not "Frame 1")
- [ ] No duplicate names within component

---

## 3. Variant Setup

### Required Variant Properties

Every component should define relevant variant properties:

| Property       | Type             | Common Values                           |
| -------------- | ---------------- | --------------------------------------- |
| `variant`      | String           | solid, outline, ghost, link             |
| `size`         | String           | sm, md, lg                              |
| `state`        | String           | default, hover, focus, active, disabled |
| `mode`         | Boolean / String | light, dark                             |
| `hasIcon`      | Boolean          | true, false                             |
| `iconPosition` | String           | start, end                              |

### Checklist: Variants

- [ ] All variant properties defined with consistent names
- [ ] Default variant clearly marked
- [ ] Variant names match code prop values exactly
- [ ] Boolean variants used for true/false options
- [ ] No unnecessary variants (keep minimal)
- [ ] Variant combinations tested (no broken states)

### Variant Property Mapping

Document how Figma properties map to code props:

```
Figma Property    →    Code Prop
─────────────────────────────────
variant=Solid     →    variant="solid"
size=Small        →    size="sm"
hasIcon=True      →    (children includes Icon)
disabled=True     →    disabled={true}
```

### Anti-patterns to Avoid

❌ **Don't:**

- Create separate components for each variant (use variant properties)
- Use "State 1", "State 2" naming
- Mix naming conventions within same property
- Have variants that can't be achieved in code

✅ **Do:**

- Use variant properties for all variations
- Use semantic names (hover, focus, disabled)
- Match naming to code exactly
- Test all variant combinations

---

## 4. Variable & Token Usage

### Token Categories

| Category       | Figma Variable Collection | Example                  |
| -------------- | ------------------------- | ------------------------ |
| **Colors**     | Kozmos/Color              | `color/text/primary`     |
| **Typography** | Kozmos/Typography         | `font/size/400`          |
| **Spacing**    | Kozmos/Spacing            | `space/400`              |
| **Radius**     | Kozmos/Radius             | `radius/200`             |
| **Shadow**     | Kozmos/Effects            | `shadow/200`             |
| **Motion**     | Kozmos/Motion             | `motion/duration/normal` |

### Checklist: Variable Usage

- [ ] **All colors** use Figma Variables (no hex codes)
- [ ] **All spacing** uses spacing Variables (no arbitrary numbers)
- [ ] **All typography** uses text styles or Variables
- [ ] **All radii** use radius Variables
- [ ] **All shadows** use effect Variables
- [ ] Variables reference semantic tokens (not raw values)
- [ ] Dark mode uses mode-aware Variables (not separate values)

### How to Check for Hardcoded Values

1. Select component
2. Open **Design panel**
3. Look for:
   - Hex colors (#FFFFFF) → ❌ Should be Variable
   - Pixel values (16px) → ❌ Should be Variable
   - Font sizes without style → ❌ Should be text style

### Variable Naming Alignment

Figma Variables map to code tokens by their collection and path, which the token build turns into
each platform's name:

| Figma variable (collection / name) | CSS variable                       | Swift                                         | Kotlin                                          |
| ---------------------------------- | ---------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Primitives / `Colors/foreground/0` | `--primitives-colors-foreground-0` | `KozmosColors.primitivesColorsForeground0`    | `KozmosThemeTokens.primitivesColorsForeground0` |
| Semantics / `Surface/0`            | `--semantics-surface-0`            | `KozmosColors.semanticsSurface0`              | `KozmosThemeTokens.semanticsSurface0`           |
| Primitives / `Layout/spacing/200`  | `--primitives-layout-spacing-200`  | `KozmosDimensions.primitivesLayoutSpacing200` | `KozmosDimensions.primitivesLayoutSpacing200`   |

---

## 5. State Coverage

### Required States

Every interactive component needs these states:

| State              | Trigger         | Visual Change                 |
| ------------------ | --------------- | ----------------------------- |
| **Default**        | Initial         | Base appearance               |
| **Hover**          | Mouse over      | Subtle highlight              |
| **Focus**          | Keyboard focus  | Focus ring                    |
| **Active/Pressed** | Click/tap       | Pressed appearance            |
| **Disabled**       | `disabled` prop | Muted, no interaction         |
| **Loading**        | `loading` prop  | Spinner, disabled interaction |

### Additional States (as needed)

| State             | When Needed        | Example                 |
| ----------------- | ------------------ | ----------------------- |
| **Error/Invalid** | Form inputs        | Red border, error icon  |
| **Success**       | Validation         | Green border, checkmark |
| **Selected**      | Toggle/selection   | Background change       |
| **Expanded**      | Accordion/dropdown | Chevron rotation        |
| **Empty**         | Data display       | Placeholder content     |

### Checklist: State Coverage

- [ ] **Default** state designed
- [ ] **Hover** state designed (web/desktop)
- [ ] **Focus** state designed with visible focus ring
- [ ] **Active/Pressed** state designed
- [ ] **Disabled** state designed with reduced opacity/contrast
- [ ] **Loading** state designed (if applicable)
- [ ] **Error** state designed (for form controls)
- [ ] Focus ring meets **3:1 contrast** requirement
- [ ] States work in **both light and dark modes**
- [ ] State transitions are documented (for animation)

### Focus Ring Requirements

```
✅ Focus ring specifications:
   - Offset: 2px from component edge
   - Width: 2px
   - Color: color/interactive/focus (must contrast with background)
   - Contrast: ≥3:1 against adjacent colors
   - Visible in both light and dark modes
```

---

## 6. Accessibility Annotations

### What to Annotate

| Annotation       | Purpose            | Example                     |
| ---------------- | ------------------ | --------------------------- |
| **Focus order**  | Tab sequence       | 1 → 2 → 3 → 4               |
| **Labels**       | Screen reader text | "Search button"             |
| **Roles**        | ARIA roles         | button, checkbox, dialog    |
| **States**       | ARIA states        | aria-expanded, aria-checked |
| **Descriptions** | Extended help      | "Opens search panel"        |

### Checklist: Accessibility

- [ ] **Focus order** annotated for complex components
- [ ] **Labels** provided for all interactive elements
- [ ] **Roles** specified where not obvious
- [ ] **Touch target** minimum 44×44px (mobile)
- [ ] **Color contrast** passes WCAG AA
- [ ] **Text contrast** minimum 4.5:1 (normal) / 3:1 (large)
- [ ] **Focus indicators** visible
- [ ] **Motion** can be reduced (no essential animations)
- [ ] **Error messages** associated with inputs

### Annotation Format

Use a consistent annotation layer:

```
┌─────────────────────────────────────────┐
│ 🔵 A11y Annotations (hidden layer)      │
├─────────────────────────────────────────┤
│ Focus Order: 1 → Search Input           │
│              2 → Search Button          │
│              3 → Results List           │
│                                         │
│ Labels:                                 │
│   - Search Input: "Search locations"   │
│   - Search Button: "Submit search"     │
│                                         │
│ Roles:                                  │
│   - Results: role="listbox"             │
│   - Result Item: role="option"          │
└─────────────────────────────────────────┘
```

### Contrast Checking

Use Figma plugins to verify contrast:

1. **Stark** - Contrast checker
2. **A11y - Color Contrast Checker**
3. **Contrast** - Real-time checking

---

## 7. Responsive Design

### Breakpoints (Reference)

| Name              | Width       | Target       |
| ----------------- | ----------- | ------------ |
| **Mobile**        | 320-479px   | Phones       |
| **Mobile Large**  | 480-767px   | Large phones |
| **Tablet**        | 768-1023px  | Tablets      |
| **Desktop**       | 1024-1439px | Laptops      |
| **Desktop Large** | 1440px+     | Monitors     |

### Checklist: Responsive Behavior

- [ ] **Auto Layout** used (no fixed positioning)
- [ ] **Constraints** set correctly (left/right, top/bottom, scale)
- [ ] **Min/Max width** defined where appropriate
- [ ] **Wrap behavior** defined for multi-item layouts
- [ ] **Typography** scales appropriately
- [ ] **Touch targets** meet minimum at mobile sizes
- [ ] Tested at **320px** width (minimum)
- [ ] Tested at **1440px** width (desktop)

### Auto Layout Requirements

```
✅ Auto Layout settings to verify:
   - Direction: Horizontal / Vertical (appropriate)
   - Gap: Uses spacing Variable
   - Padding: Uses spacing Variables (all sides)
   - Alignment: Set appropriately
   - Sizing: Hug / Fill container (not fixed)
```

### Responsive Variants

For components with different layouts at breakpoints:

```
Component/
├── variant=Default (mobile-first)
├── breakpoint=Tablet
├── breakpoint=Desktop
└── breakpoint=DesktopLarge
```

---

## 8. Documentation & Handoff

### Component Description

Every component needs a description in Figma:

```markdown
## Button

Primary action trigger for user interactions.

### Usage

- Use solid variant for primary actions
- Use outline variant for secondary actions
- Use ghost variant for tertiary/inline actions

### Do's

✅ Use clear, action-oriented labels
✅ Limit to one primary button per section

### Don'ts

❌ Don't use for navigation (use Link)
❌ Don't disable without explanation
```

### Checklist: Documentation

- [ ] **Component description** filled in
- [ ] **Usage guidelines** included
- [ ] **Do's and Don'ts** documented
- [ ] **Variant explanations** provided
- [ ] **Slot/content guidance** for composable components
- [ ] **Related components** linked
- [ ] **Changelog** (for updates)

### Handoff Notes

Include in component or separate documentation page:

```
┌─────────────────────────────────────────┐
│ 📋 Developer Handoff Notes              │
├─────────────────────────────────────────┤
│ Component: SearchPanel                  │
│ Package: @kozmos-ds/react                   │
│ Status: Beta                            │
│                                         │
│ Props to implement:                     │
│ - placeholder: string                   │
│ - onSearch: (query: string) => void     │
│ - isLoading: boolean                    │
│ - results: SearchResult[]               │
│                                         │
│ Notes:                                  │
│ - Debounce search by 300ms              │
│ - Show skeleton while loading           │
│ - Max 10 results visible, scroll after  │
└─────────────────────────────────────────┘
```

---

## 9. Code Connect Preparation

### Property Mapping Table

Before creating `.figma.*` files, document the mapping:

| Figma Property | Figma Values          | Code Prop | Code Type                       |
| -------------- | --------------------- | --------- | ------------------------------- |
| variant        | Solid, Outline, Ghost | variant   | "solid" \| "outline" \| "ghost" |
| size           | Small, Medium, Large  | size      | "sm" \| "md" \| "lg"            |
| disabled       | true, false           | disabled  | boolean                         |
| hasLeftIcon    | true, false           | (slot)    | React.ReactNode                 |
| Label          | (text)                | children  | React.ReactNode                 |

### Checklist: Code Connect Ready

- [ ] **Property names** match code prop names
- [ ] **Property values** match code prop values
- [ ] **Boolean properties** used for true/false toggles
- [ ] **Instance swaps** identified for slot content
- [ ] **Text overrides** identified for children props
- [ ] **Nested components** have their own Code Connect
- [ ] **Component node ID** documented for figma.config.json

### Instance Swap Mapping

For components with swappable nested components:

```
Figma Instance Swap    →    Code Slot
──────────────────────────────────────
Icon Slot              →    <Button.Icon>
Leading Content        →    startContent prop
Trailing Content       →    endContent prop
```

### Code Connect File Checklist

Before publishing Code Connect:

- [ ] `.figma.tsx` (React) created
- [ ] `.figma.swift` (iOS) created
- [ ] `.figma.kt` (Android) created
- [ ] Props mapped correctly
- [ ] Imports are correct
- [ ] `pnpm figma:parse:linked` and `pnpm figma:parse:native:linked` pass
- [ ] Preview in Figma Dev Mode verified

---

## 10. Pre-Publication Checklist

### Final Review Before Library Publish

Run through this checklist before publishing to team library:

#### Structure ✓

- [ ] Component is main component (purple diamond)
- [ ] Component is in correct folder/page
- [ ] Naming follows conventions
- [ ] No unnamed layers ("Frame 1", "Group 2")

#### Tokens ✓

- [ ] All colors from Variables
- [ ] All spacing from Variables
- [ ] All typography from styles/Variables
- [ ] All effects from Variables
- [ ] No hardcoded values

#### Variants ✓

- [ ] All variant properties defined
- [ ] All variant combinations work
- [ ] Variant names match code
- [ ] Default variant marked

#### States ✓

- [ ] Default state complete
- [ ] Hover state complete
- [ ] Focus state with ring
- [ ] Active state complete
- [ ] Disabled state complete
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)

#### Accessibility ✓

- [ ] Focus order annotated
- [ ] Labels provided
- [ ] Touch targets ≥44×44px
- [ ] Contrast passes AA
- [ ] Motion is optional

#### Responsive ✓

- [ ] Auto Layout throughout
- [ ] Constraints set
- [ ] Works at 320px width
- [ ] Works at 1440px width

#### Documentation ✓

- [ ] Description filled in
- [ ] Usage guidelines written
- [ ] Handoff notes complete

#### Code Connect ✓

- [ ] Property mapping documented
- [ ] Ready for .figma.\* file creation

### Publication Checklist

- [ ] Reviewed with Design Lead
- [ ] Reviewed with Engineering Lead
- [ ] No changes pending in Figma branch
- [ ] Published to library
- [ ] Announced in #design-system channel
- [ ] Code Connect still parses (`pnpm figma:parse:linked`)

---

## Quick Reference Cards

### Variant Property Cheat Sheet

The properties the Code Connect files map, `packages/react/src/components/<Name>/<Name>.figma.tsx`:

```
Button:    Variant(Default|Secondary|Destructive|Outline|Ghost|Link|Glass) × Size(Default|Small|Large|Icon) × State(Default|Disabled|Loading)
Input:     State(Default|Focus|Disabled|Readonly) × Status(Default|Error|Warning|Success) × Show Helper Text
Checkbox:  Checked(Unchecked|Checked) × State(Default|Disabled|Error)
Dialog:    Title Text, Description Text, Body Text, and slots for its fields and actions
```

### Token Quick Reference

Variables are named by collection and path, as `packages/tokens/src/raw/` exports them:

```
Colors:     Primitives  Colors/foreground/0…1000, Colors/background/0…1000, Colors/theme/0…1000
Surfaces:   Semantics   Surface/0, 100, 200, 300
Spacing:    Primitives  Layout/spacing/0, 25, 50, 75, 100 (8), 150, 200 (16) … 1000
Radius:     Primitives  Layout/radius/0, 50, 100 … 1000
Typography: Primitives  Typography/font/family, weight, size
```

### State Visual Guide

```
Default  → Base appearance
Hover    → Slightly lighter/darker background
Focus    → 2px focus ring, offset 2px
Active   → Darker/more saturated
Disabled → 40% opacity, no cursor
Loading  → Spinner replaces content, disabled
Error    → Red border, error icon
```

---

## Version History

| Version | Date       | Changes                                        |
| ------- | ---------- | ---------------------------------------------- |
| 1.0.0   | 2026-02-07 | Initial Figma audit checklist                  |
| 1.1.0   | 2026-09-29 | Real token names and the repository's commands |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-29
