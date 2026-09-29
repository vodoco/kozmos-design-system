# Kozmos Design Philosophy & Principles

> **Purpose:** This document defines the visual language, interaction patterns, and design principles that guide all Kozmos Design System decisions. Use this as a reference when creating new components, reviewing designs, or making architectural choices.

---

## Core Design Philosophy

### Mission Statement

Kozmos exists to make indoor navigation **intuitive, accessible, and delightful** across all platforms. We believe that great wayfinding UI should feel invisible—users should focus on their destination, not the interface.

### The Three Pillars

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    CLARITY      │  │   CONSISTENCY   │  │  ACCESSIBILITY  │
│                 │  │                 │  │                 │
│ Information     │  │ Same patterns   │  │ Everyone can    │
│ hierarchy that  │  │ across all 6    │  │ navigate,       │
│ guides the eye  │  │ platforms       │  │ regardless of   │
│                 │  │                 │  │ ability         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Visual Language Principles

### 1. Clarity Over Decoration

**Do:** Use whitespace generously. Let content breathe.
**Don't:** Add decorative elements that don't serve navigation.

```
✅ Clean, focused POI card:
┌─────────────────────────┐
│ 🍕 Joe's Pizza          │
│ Floor 2 · 3 min walk    │
│ [Navigate]              │
└─────────────────────────┘

❌ Cluttered, decorated card:
┌─────────────────────────┐
│ ⭐🍕⭐ Joe's Pizza ⭐🍕⭐ │
│ ═══════════════════════ │
│ 📍Floor 2 ⏱️ 3 min 🚶    │
│ ✨ [Navigate Now!] ✨    │
└─────────────────────────┘
```

### 2. Data Density Balanced with Legibility

Indoor venues have complex data (floors, zones, POIs, routes). We show enough to be useful without overwhelming.

**Density Guidelines:**
| Context | Density | Example |
|---------|---------|---------|
| Map view | Low | Only essential labels visible at zoom level |
| Search results | Medium | 5-7 results visible, key info per item |
| POI details | High | Full information, scrollable |
| Wayfinding | Minimal | One instruction at a time |

### 3. Motion with Purpose

Animation should **inform**, not entertain.

| Animation Type   | Purpose               | Duration   |
| ---------------- | --------------------- | ---------- |
| Route drawing    | Show path progression | 400-600ms  |
| Floor transition | Orient user spatially | 300ms      |
| Button feedback  | Confirm interaction   | 100-150ms  |
| Loading states   | Indicate progress     | Continuous |

The motion tokens carry three durations, quick (150 ms), standard (280 ms) and deliberate
(460 ms), and a standard and an emphasised curve, on every platform
([theming-guide.md](./theming-guide.md) §3).

**Never animate:**

- Static content that doesn't change state
- Decorative flourishes
- Anything that delays task completion

### 4. Progressive Disclosure

Show only what's needed at each step. Reveal complexity on demand.

```
Level 1 (Default):     Level 2 (Expanded):      Level 3 (Full):
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│ Gate B12     │  →    │ Gate B12     │    →    │ Gate B12     │
│ 5 min walk   │       │ 5 min walk   │         │ Terminal 2   │
└──────────────┘       │ via Escalator│         │ 5 min · 350m │
                       └──────────────┘         │ via Escalator│
                                                │ ─────────────│
                                                │ Amenities:   │
                                                │ 🚻 💺 🔌 ☕   │
                                                └──────────────┘
```

---

## Interaction Patterns

### 1. Gesture Consistency Across Platforms

Same gestures should do the same things everywhere:

| Gesture           | Web          | iOS        | Android    | Action            |
| ----------------- | ------------ | ---------- | ---------- | ----------------- |
| Tap/Click         | Click        | Tap        | Tap        | Select, activate  |
| Long press        | Right-click  | Long press | Long press | Context menu      |
| Pinch             | Scroll wheel | Pinch      | Pinch      | Zoom map          |
| Swipe             | Drag         | Swipe      | Swipe      | Dismiss, navigate |
| Two-finger rotate | -            | Two-finger | Two-finger | Rotate map        |

### 2. Immediate Feedback

Every interaction gets feedback within **100ms**:

```text
Button states timeline
0ms    → Touch start: opacity 0.8, scale 0.98
100ms  → Visual feedback complete
150ms  → Action triggers
200ms  → State change visible (if applicable)
```

### 3. Predictable Navigation

Users should always know:

- Where they are (current location indicator)
- Where they can go (clear CTAs)
- How to go back (consistent back/close patterns)

```
Standard navigation patterns:

Sheet/Modal:           Navigation Stack:
┌─────────────┐        ┌─────────────┐
│ ✕        ⋮ │        │ ←  Title    │
│             │        │             │
│   Content   │        │   Content   │
│             │        │             │
└─────────────┘        └─────────────┘
  Swipe down             Back button
  or tap ✕               or gesture
```

### 4. Error Recovery

Errors should be:

- **Specific:** What went wrong
- **Actionable:** How to fix it
- **Non-blocking:** Don't trap the user

```
✅ Good error:
┌─────────────────────────────┐
│ ⚠️ Can't load floor plan    │
│                             │
│ Check your connection and   │
│ try again.                  │
│                             │
│ [Retry]  [Use Offline Map]  │
└─────────────────────────────┘

❌ Bad error:
┌─────────────────────────────┐
│ ❌ Error 500                │
│                             │
│ Something went wrong.       │
│                             │
│ [OK]                        │
└─────────────────────────────┘
```

---

## Color Psychology & Status Colors

### Brand Expression

Pointr's brand represents **confidence in navigation**—knowing where you are and how to get where you're going.

| Brand Attribute | Visual Expression                                  |
| --------------- | -------------------------------------------------- |
| Trustworthy     | Blue-based primary palette                         |
| Innovative      | Glass surfaces over the map (the `glass` variants) |
| Accessible      | High contrast, never rely on color alone           |
| Professional    | Clean typography, generous spacing                 |

### Status Color Semantics

| Status      | Color        | Meaning                         | Use Cases                                  |
| ----------- | ------------ | ------------------------------- | ------------------------------------------ |
| **Success** | Green        | Completed, confirmed, available | Arrived at destination, booking confirmed  |
| **Danger**  | Red          | Error, destructive, closed      | Route blocked, venue closed, delete action |
| **Alert**   | Amber/Yellow | Warning, attention needed       | Slow route, temporary closure, battery low |
| **Info**    | Blue         | Informational, neutral          | Tips, additional details, help             |

**Never rely on color alone:**

```
✅ Accessible status:
[✓] Route saved        ← Icon + color + text

❌ Color-only status:
[●]                    ← Only color, no meaning without vision
```

---

## Platform-Specific Expression

While maintaining consistency, each platform should feel **native**:

| Aspect     | iOS                       | Android                  | Web                      |
| ---------- | ------------------------- | ------------------------ | ------------------------ |
| Navigation | iOS nav bar patterns      | Material top app bar     | Browser-native or custom |
| Buttons    | SF Symbols + system style | Material buttons         | Custom with CSS vars     |
| Sheets     | iOS sheet with grabber    | Bottom sheet with handle | Modal or slide-over      |
| Typography | SF Pro (system)           | Roboto (system)          | System font stack        |
| Haptics    | UIImpactFeedback          | HapticFeedback           | N/A                      |

---

## Design Decision Framework

When making design decisions, ask in order:

1. **Is it accessible?** (WCAG AA minimum)
2. **Is it consistent?** (Matches existing patterns)
3. **Is it clear?** (User understands immediately)
4. **Is it efficient?** (Minimal steps to goal)
5. **Is it delightful?** (Only after 1-4 are satisfied)

```
Decision Tree:

          ┌─ No → Fix accessibility first
Accessible?
          └─ Yes ─┬─ No → Match existing pattern or document why different
        Consistent?
                  └─ Yes ─┬─ No → Simplify until clear
                    Clear?
                          └─ Yes ─┬─ No → Reduce steps
                          Efficient?
                                  └─ Yes → Consider delight (if time permits)
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                   | Why It's Bad                          | What to Do Instead                    |
| ------------------------------ | ------------------------------------- | ------------------------------------- |
| **Skeleton overload**          | Too many skeletons feel broken        | Show 2-3 skeleton items max           |
| **Toast spam**                 | Multiple toasts overwhelm             | Queue toasts, max 1 visible           |
| **Confirmation fatigue**       | Confirming everything dulls attention | Only confirm destructive/irreversible |
| **Hidden gestures**            | Users don't discover them             | Show affordances, add hints           |
| **Infinite scroll everywhere** | No sense of progress                  | Use pagination for finite lists       |
| **Auto-playing media**         | Unexpected, accessibility issue       | Always require user initiation        |

---

## Applying These Principles

When creating or reviewing components:

1. **Read this document** before starting
2. **Check existing components** for similar patterns
3. **Validate against the decision framework**
4. **Document any deviations** with justification
5. **Get design review** before implementation

---

_Last updated: 2025-02-07_
_Maintainer: Kozmos Design System Team_
