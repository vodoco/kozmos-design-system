# Kozmos Design System - Component Creation Guide

> **Purpose:** This document provides step-by-step instructions for creating new components across all platforms. Follow this guide to ensure consistency and completeness.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Component Scaffolding CLI](#2-component-scaffolding-cli)
3. [React Component Creation](#3-react-component-creation)
4. [iOS Component Creation](#4-ios-component-creation)
5. [Android Component Creation](#5-android-component-creation)
6. [React Native Component Creation](#6-react-native-component-creation)
7. [Vue Component Creation](#7-vue-component-creation)
8. [Code Connect Setup](#8-code-connect-setup)
9. [Testing Requirements](#9-testing-requirements)
10. [Documentation Requirements](#10-documentation-requirements)
11. [Complete Checklist](#11-complete-checklist)

---

## 1. Quick Start

### Using the CLI

```bash
# Scaffold a React component in packages/react/src/components/<Name>
pnpm new-component <Name>
```

`pnpm new-component` (`scripts/skills/generate-component.ts`) takes one argument, the component's
name, and refuses a name that already has a directory. It scaffolds the React component only: there
are no `--compound` or `--platforms` options, and the SwiftUI and Compose versions are written by
hand (§4 and §5).

### Manual Creation

If you prefer manual creation, follow the detailed sections below for each platform.

---

## 2. Component Scaffolding CLI

### What It Writes

Run from the repository root, `pnpm new-component <Name>` writes four files and adds one line to
`packages/react/src/index.ts` (`export * from './components/<Name>/<Name>';`):

```
packages/react/src/components/<Name>/
├── <Name>.tsx              # A cva-based component
├── <Name>.stories.tsx      # Storybook
├── <Name>.test.tsx         # Tests
└── index.ts                # Barrel export
```

Everything else is yours to add: the Code Connect file, the SwiftUI and Compose versions, and a
changeset (`pnpm changeset`), since a new component changes what `@kozmos-ds/react` ships.

---

## 3. React Component Creation

### Step 1: Create Directory Structure

```bash
mkdir -p packages/react/src/components/Tooltip
cd packages/react/src/components/Tooltip
touch Tooltip.tsx Tooltip.test.tsx Tooltip.stories.tsx Tooltip.figma.tsx Tooltip.css index.ts
```

### Step 2: Main Component File

```tsx
// packages/react/src/components/Tooltip/Tooltip.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import "./Tooltip.css";

// ============================================================================
// Styles
// ============================================================================

const tooltipStyles = cva("kozmos-tooltip", {
  variants: {
    position: {
      top: "kozmos-tooltip--top",
      bottom: "kozmos-tooltip--bottom",
      left: "kozmos-tooltip--left",
      right: "kozmos-tooltip--right",
    },
    variant: {
      default: "kozmos-tooltip--default",
      dark: "kozmos-tooltip--dark",
    },
  },
  defaultVariants: {
    position: "top",
    variant: "default",
  },
});

// ============================================================================
// Types
// ============================================================================

export interface TooltipProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tooltipStyles> {
  /** Content to display in the tooltip */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Delay before hiding (ms) */
  delayHide?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      position,
      variant,
      delayShow = 200,
      delayHide = 0,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const showTimeoutRef = React.useRef<NodeJS.Timeout>();
    const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

    const handleMouseEnter = React.useCallback(() => {
      if (disabled) return;
      clearTimeout(hideTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayShow);
    }, [disabled, delayShow]);

    const handleMouseLeave = React.useCallback(() => {
      clearTimeout(showTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, delayHide);
    }, [delayHide]);

    React.useEffect(() => {
      return () => {
        clearTimeout(showTimeoutRef.current);
        clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    const trigger = React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleMouseEnter,
      onBlur: handleMouseLeave,
      "aria-describedby": isVisible ? "tooltip" : undefined,
    });

    return (
      <div className="kozmos-tooltip-wrapper">
        {trigger}
        {isVisible && (
          <div
            ref={ref}
            role="tooltip"
            id="tooltip"
            className={clsx(tooltipStyles({ position, variant }), className)}
            {...props}
          >
            {content}
            <div className="kozmos-tooltip__arrow" />
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
```

### Step 3: CSS Styles

```css
/* packages/react/src/components/Tooltip/Tooltip.css */

.kozmos-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.kozmos-tooltip {
  position: absolute;
  z-index: var(--kozmos-z-index-tooltip);
  padding: var(--kozmos-space-200) var(--kozmos-space-300);
  border-radius: var(--kozmos-radius-200);
  font-size: var(--kozmos-font-size-200);
  line-height: var(--kozmos-line-height-tight);
  white-space: nowrap;
  pointer-events: none;
  animation: kozmos-tooltip-fade-in var(--kozmos-motion-duration-fast) ease-out;
}

/* Variants */
.kozmos-tooltip--default {
  background-color: var(--kozmos-color-background-tooltip);
  color: var(--kozmos-color-text-inverse);
}

.kozmos-tooltip--dark {
  background-color: var(--kozmos-color-neutral-900);
  color: var(--kozmos-color-neutral-50);
}

/* Positions */
.kozmos-tooltip--top {
  bottom: calc(100% + var(--kozmos-space-200));
  left: 50%;
  transform: translateX(-50%);
}

.kozmos-tooltip--bottom {
  top: calc(100% + var(--kozmos-space-200));
  left: 50%;
  transform: translateX(-50%);
}

.kozmos-tooltip--left {
  right: calc(100% + var(--kozmos-space-200));
  top: 50%;
  transform: translateY(-50%);
}

.kozmos-tooltip--right {
  left: calc(100% + var(--kozmos-space-200));
  top: 50%;
  transform: translateY(-50%);
}

/* Arrow */
.kozmos-tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: inherit;
  transform: rotate(45deg);
}

.kozmos-tooltip--top .kozmos-tooltip__arrow {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
}

.kozmos-tooltip--bottom .kozmos-tooltip__arrow {
  top: -4px;
  left: 50%;
  margin-left: -4px;
}

/* Animation */
@keyframes kozmos-tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kozmos-tooltip {
    animation: none;
  }
}
```

### Step 4: Barrel Export

```typescript
// packages/react/src/components/Tooltip/index.ts
export { Tooltip, type TooltipProps } from "./Tooltip";
export { default } from "./Tooltip";
```

### Step 5: Update Main Barrel

```typescript
// packages/react/src/index.ts
// Add this line with other component exports
export * from "./components/Tooltip";
```

---

## 4. iOS Component Creation

### Step 1: Create Swift File

```bash
mkdir -p packages/ios/Sources/KozmosSwiftUI/Components/Tooltip
touch packages/ios/Sources/KozmosSwiftUI/Components/Tooltip/KozmosTooltip.swift
```

### Step 2: SwiftUI Component

```swift
// packages/ios/Sources/KozmosSwiftUI/Components/Tooltip/KozmosTooltip.swift
import SwiftUI

// MARK: - Tooltip Position
public enum KozmosTooltipPosition {
    case top
    case bottom
    case leading
    case trailing
}

// MARK: - Tooltip Variant
public enum KozmosTooltipVariant {
    case `default`
    case dark
}

// MARK: - Tooltip View
public struct KozmosTooltip<Content: View>: View {
    // MARK: Properties
    private let content: Content
    private let message: String
    private let position: KozmosTooltipPosition
    private let variant: KozmosTooltipVariant

    @State private var isShowing = false

    // MARK: Initialization
    public init(
        message: String,
        position: KozmosTooltipPosition = .top,
        variant: KozmosTooltipVariant = .default,
        @ViewBuilder content: () -> Content
    ) {
        self.message = message
        self.position = position
        self.variant = variant
        self.content = content()
    }

    // MARK: Body
    public var body: some View {
        content
            .overlay(alignment: alignment) {
                if isShowing {
                    tooltipView
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                }
            }
            .onHover { hovering in
                withAnimation(.easeInOut(duration: 0.15)) {
                    isShowing = hovering
                }
            }
            .accessibilityHint(message)
    }

    // MARK: Private Views
    private var tooltipView: some View {
        Text(message)
            .font(.system(size: KozmosTokens.fontSize200))
            .foregroundColor(textColor)
            .padding(.horizontal, KozmosTokens.space300)
            .padding(.vertical, KozmosTokens.space200)
            .background(backgroundColor)
            .cornerRadius(KozmosTokens.radius200)
            .offset(tooltipOffset)
    }

    // MARK: Computed Properties
    private var alignment: Alignment {
        switch position {
        case .top: return .top
        case .bottom: return .bottom
        case .leading: return .leading
        case .trailing: return .trailing
        }
    }

    private var tooltipOffset: CGSize {
        switch position {
        case .top: return CGSize(width: 0, height: -KozmosTokens.space400)
        case .bottom: return CGSize(width: 0, height: KozmosTokens.space400)
        case .leading: return CGSize(width: -KozmosTokens.space400, height: 0)
        case .trailing: return CGSize(width: KozmosTokens.space400, height: 0)
        }
    }

    private var backgroundColor: Color {
        switch variant {
        case .default: return KozmosTokens.color.background.tooltip
        case .dark: return KozmosTokens.color.neutral900
        }
    }

    private var textColor: Color {
        switch variant {
        case .default: return KozmosTokens.color.text.inverse
        case .dark: return KozmosTokens.color.neutral50
        }
    }
}

// MARK: - View Extension
public extension View {
    func kozmosTooltip(
        _ message: String,
        position: KozmosTooltipPosition = .top,
        variant: KozmosTooltipVariant = .default
    ) -> some View {
        KozmosTooltip(
            message: message,
            position: position,
            variant: variant
        ) {
            self
        }
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 40) {
        Button("Hover me (top)") {}
            .kozmosTooltip("This is a tooltip", position: .top)

        Button("Hover me (bottom)") {}
            .kozmosTooltip("This is a tooltip", position: .bottom)

        Button("Hover me (dark)") {}
            .kozmosTooltip("Dark variant", variant: .dark)
    }
    .padding(100)
}
```

---

## 5. Android Component Creation

### Step 1: Create Kotlin File

```bash
mkdir -p packages/android/kozmos/src/main/kotlin/com/kozmos/compose/components
touch packages/android/kozmos/src/main/kotlin/com/kozmos/compose/components/Tooltip.kt
```

### Step 2: Compose Component

```kotlin
// packages/android/kozmos/src/main/kotlin/com/kozmos/compose/components/Tooltip.kt
package com.kozmos.compose.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.kozmos.compose.tokens.KozmosTokens
import kotlinx.coroutines.delay

// ============================================================================
// Enums
// ============================================================================

enum class TooltipPosition {
    Top,
    Bottom,
    Start,
    End
}

enum class TooltipVariant {
    Default,
    Dark
}

// ============================================================================
// Component
// ============================================================================

@Composable
fun KozmosTooltip(
    message: String,
    position: TooltipPosition = TooltipPosition.Top,
    variant: TooltipVariant = TooltipVariant.Default,
    delayMillis: Long = 200,
    content: @Composable () -> Unit
) {
    var isVisible by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier.semantics {
            contentDescription = message
        }
    ) {
        Box(
            modifier = Modifier.pointerInput(Unit) {
                // Handle hover/long press
                awaitPointerEventScope {
                    while (true) {
                        val event = awaitPointerEvent()
                        if (event.changes.any { it.pressed }) {
                            isVisible = true
                        } else {
                            isVisible = false
                        }
                    }
                }
            }
        ) {
            content()
        }

        AnimatedVisibility(
            visible = isVisible,
            enter = fadeIn() + scaleIn(initialScale = 0.95f),
            exit = fadeOut() + scaleOut(targetScale = 0.95f),
            modifier = Modifier.align(getAlignment(position))
        ) {
            TooltipContent(
                message = message,
                variant = variant,
                position = position
            )
        }
    }
}

@Composable
private fun TooltipContent(
    message: String,
    variant: TooltipVariant,
    position: TooltipPosition
) {
    val backgroundColor = when (variant) {
        TooltipVariant.Default -> KozmosTokens.color.background.tooltip
        TooltipVariant.Dark -> KozmosTokens.color.neutral900
    }

    val textColor = when (variant) {
        TooltipVariant.Default -> KozmosTokens.color.text.inverse
        TooltipVariant.Dark -> KozmosTokens.color.neutral50
    }

    val offset = getOffset(position)

    Box(
        modifier = Modifier
            .offset(x = offset.first, y = offset.second)
            .clip(RoundedCornerShape(KozmosTokens.radius200))
            .background(backgroundColor)
            .padding(
                horizontal = KozmosTokens.space300,
                vertical = KozmosTokens.space200
            )
    ) {
        Text(
            text = message,
            color = textColor,
            fontSize = KozmosTokens.fontSize200
        )
    }
}

// ============================================================================
// Helpers
// ============================================================================

private fun getAlignment(position: TooltipPosition): Alignment {
    return when (position) {
        TooltipPosition.Top -> Alignment.TopCenter
        TooltipPosition.Bottom -> Alignment.BottomCenter
        TooltipPosition.Start -> Alignment.CenterStart
        TooltipPosition.End -> Alignment.CenterEnd
    }
}

private fun getOffset(position: TooltipPosition): Pair<Dp, Dp> {
    val spacing = 8.dp
    return when (position) {
        TooltipPosition.Top -> Pair(0.dp, -spacing)
        TooltipPosition.Bottom -> Pair(0.dp, spacing)
        TooltipPosition.Start -> Pair(-spacing, 0.dp)
        TooltipPosition.End -> Pair(spacing, 0.dp)
    }
}

// ============================================================================
// Preview
// ============================================================================

@Preview
@Composable
private fun TooltipPreview() {
    Column(
        modifier = Modifier.padding(100.dp),
        verticalArrangement = Arrangement.spacedBy(40.dp)
    ) {
        KozmosTooltip(
            message = "This is a tooltip",
            position = TooltipPosition.Top
        ) {
            KozmosButton(text = "Hover me")
        }

        KozmosTooltip(
            message = "Dark variant",
            variant = TooltipVariant.Dark
        ) {
            KozmosButton(text = "Dark tooltip")
        }
    }
}
```

---

## 6. React Native Component Creation

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 7. Vue Component Creation

Vue waits: `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, so a component made for React reaches it with nothing more to write, and there are no Lit Web Components. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 8. Code Connect Setup

### React Code Connect

```tsx
// packages/react/src/components/Tooltip/Tooltip.figma.tsx
import figma from "@figma/code-connect";
import { Tooltip } from "./Tooltip";

figma.connect(
  Tooltip,
  "https://www.figma.com/file/xxx/Kozmos?node-id=123:456",
  {
    props: {
      message: figma.string("Label"),
      position: figma.enum("Position", {
        Top: "top",
        Bottom: "bottom",
        Left: "left",
        Right: "right",
      }),
      variant: figma.enum("Variant", {
        Default: "default",
        Dark: "dark",
      }),
    },
    example: (props) => (
      <Tooltip
        message={props.message}
        position={props.position}
        variant={props.variant}
      >
        <Button>Hover me</Button>
      </Tooltip>
    ),
  },
);
```

### iOS Code Connect

```swift
// packages/ios/Sources/KozmosSwiftUI/Components/Tooltip/KozmosTooltip.figma.swift
import Figma

struct KozmosTooltipCodeConnect: FigmaConnect {
    let component = KozmosTooltip.self
    let figmaNodeUrl = "https://www.figma.com/file/xxx/Kozmos?node-id=123:456"

    var body: some View {
        KozmosTooltip(
            message: figma.string("Label"),
            position: figma.enum("Position", mapping: [
                "Top": .top,
                "Bottom": .bottom,
                "Leading": .leading,
                "Trailing": .trailing
            ]),
            variant: figma.enum("Variant", mapping: [
                "Default": .default,
                "Dark": .dark
            ])
        ) {
            // Trigger content
        }
    }
}
```

---

## 9. Testing Requirements

### React Tests

```tsx
// packages/react/src/components/Tooltip/Tooltip.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Tooltip } from "./Tooltip";

expect.extend(toHaveNoViolations);

describe("Tooltip", () => {
  it("renders children", () => {
    render(
      <Tooltip message="Tooltip text">
        <button>Trigger</button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Trigger" })).toBeInTheDocument();
  });

  it("shows tooltip on hover", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip message="Tooltip text" delayShow={0}>
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
    });
  });

  it("hides tooltip on mouse leave", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip message="Tooltip text" delayShow={0}>
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toBeInTheDocument(),
    );

    await user.unhover(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("does not show when disabled", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip message="Tooltip text" disabled delayShow={0}>
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("passes accessibility audit", async () => {
    const { container } = render(
      <Tooltip message="Tooltip text">
        <button>Trigger</button>
      </Tooltip>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it.each(["top", "bottom", "left", "right"] as const)(
    "renders in %s position",
    async (position) => {
      const user = userEvent.setup();

      render(
        <Tooltip message="Tooltip text" position={position} delayShow={0}>
          <button>Trigger</button>
        </Tooltip>,
      );

      await user.hover(screen.getByRole("button"));

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveClass(`kozmos-tooltip--${position}`);
      });
    },
  );
});
```

---

## 10. Documentation Requirements

### Storybook Story

```tsx
// packages/react/src/components/Tooltip/Tooltip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { Button } from "../Button";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Tooltips display informative text when users hover over or focus on an element.",
      },
    },
  },
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
    variant: {
      control: "select",
      options: ["default", "dark"],
    },
    delayShow: {
      control: "number",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    message: "This is a tooltip",
    children: <Button>Hover me</Button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "2rem", padding: "4rem" }}>
      <Tooltip message="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip message="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip message="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip message="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "2rem" }}>
      <Tooltip message="Default variant" variant="default">
        <Button>Default</Button>
      </Tooltip>
      <Tooltip message="Dark variant" variant="dark">
        <Button>Dark</Button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    message: "This tooltip is disabled",
    disabled: true,
    children: <Button>No tooltip</Button>,
  },
};
```

---

## 11. Complete Checklist

### Before Starting

- [ ] Review design in Figma
- [ ] Check if similar component exists
- [ ] Identify props and variants needed
- [ ] Plan compound component structure (if needed)

### Implementation

- [ ] **React**
  - [ ] Create component file with CVA styles
  - [ ] Add TypeScript types
  - [ ] Create CSS file
  - [ ] Add barrel export
  - [ ] Update main index.ts

- [ ] **iOS**
  - [ ] Create SwiftUI component
  - [ ] Add view modifiers
  - [ ] Create Preview

- [ ] **Android**
  - [ ] Create Compose component
  - [ ] Add Preview composable

### Quality Assurance

- [ ] **Testing**
  - [ ] Unit tests for all platforms
  - [ ] Accessibility tests (axe)
  - [ ] Visual regression snapshot

- [ ] **Documentation**
  - [ ] Storybook story with all variants
  - [ ] Props documentation
  - [ ] Usage examples

- [ ] **Code Connect**
  - [ ] React .figma.tsx
  - [ ] iOS .figma.swift
  - [ ] Android .figma.kt
  - [ ] Validate with `figma connect parse`
  - [ ] Publish with `figma connect publish`

### Final Steps

- [ ] Create changeset
- [ ] Update component inventory
- [ ] Get PR review
- [ ] Merge and release

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0.0   | 2026-02-07 | Initial component creation guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
