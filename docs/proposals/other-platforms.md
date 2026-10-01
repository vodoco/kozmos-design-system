# Proposal: not built — React Native, and Web Components for Vue

> **Proposal: not built.** The original scope ([project-scope.md](../project-scope.md), February 2026) planned more platforms than were built, among them a React Native package and Lit Web
> Components with Vue wrappers. Neither exists. Kozmos is React (`@kozmos-ds/react`), SwiftUI
> (`packages/ios`) and Jetpack Compose (`packages/android`). Vue waits: `@kozmos-ds/vue` is a
> private harness that mounts the React components in Vue, not a package to install. There is no
> `packages/react-native`, no `@kozmos-ds/react-native` and no Lit component in the repository.
>
> The sections below are the templates and guidance written for those platforms across
> `.ai-skills`, kept here as planning history. Where they name a Kozmos API, it is the one planned
> then, not the one built.

---

## Proposal: from `.ai-skills/code-patterns.md`

These sections were in [`code-patterns.md`](../../.ai-skills/code-patterns.md), where each heading now says what is built instead.

### Proposal: 2. Vue/Web Component Patterns

#### Proposal: 2.1 Lit Web Component

```typescript
// packages/vue/src/components/kozmos-button.ts
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

@customElement("kozmos-button")
export class KozmosButton extends LitElement {
  // -----------------------------------------------------------------------------
  // Properties
  // -----------------------------------------------------------------------------

  @property({ type: String, reflect: true })
  variant: "primary" | "secondary" | "outlined" | "ghost" | "destructive" =
    "primary";

  @property({ type: String, reflect: true })
  size: "sm" | "md" | "lg" = "md";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true, attribute: "is-loading" })
  isLoading = false;

  @property({ type: Boolean, reflect: true, attribute: "full-width" })
  fullWidth = false;

  // -----------------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------------

  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    .kozmos-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--kozmos-space-200);
      border-radius: var(--kozmos-radius-200);
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--kozmos-motion-duration-fast)
        var(--kozmos-motion-easing-standard);
      border: none;
      outline: none;
    }

    .kozmos-btn:focus-visible {
      outline: 2px solid var(--kozmos-color-interactive-primary);
      outline-offset: 2px;
    }

    .kozmos-btn:disabled {
      opacity: var(--kozmos-opacity-disabled);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Variants */
    .kozmos-btn--primary {
      background: var(--kozmos-color-interactive-primary);
      color: var(--kozmos-color-text-inverse);
    }
    .kozmos-btn--primary:hover:not(:disabled) {
      background: var(--kozmos-color-interactive-primary-hover);
    }

    .kozmos-btn--secondary {
      background: var(--kozmos-color-background-secondary);
      color: var(--kozmos-color-text-primary);
    }
    .kozmos-btn--secondary:hover:not(:disabled) {
      background: var(--kozmos-color-background-secondary-hover);
    }

    .kozmos-btn--outlined {
      background: transparent;
      color: var(--kozmos-color-text-primary);
      border: 1px solid var(--kozmos-color-border-default);
    }
    .kozmos-btn--outlined:hover:not(:disabled) {
      background: var(--kozmos-color-background-secondary);
    }

    .kozmos-btn--ghost {
      background: transparent;
      color: var(--kozmos-color-text-primary);
    }
    .kozmos-btn--ghost:hover:not(:disabled) {
      background: var(--kozmos-color-background-secondary);
    }

    .kozmos-btn--destructive {
      background: var(--kozmos-color-status-danger);
      color: var(--kozmos-color-text-inverse);
    }
    .kozmos-btn--destructive:hover:not(:disabled) {
      background: var(--kozmos-color-status-danger-hover);
    }

    /* Sizes */
    .kozmos-btn--sm {
      height: 32px;
      padding: 0 var(--kozmos-space-300);
      font-size: var(--kozmos-font-size-200);
    }
    .kozmos-btn--md {
      height: 40px;
      padding: 0 var(--kozmos-space-400);
      font-size: var(--kozmos-font-size-300);
    }
    .kozmos-btn--lg {
      height: 48px;
      padding: 0 var(--kozmos-space-500);
      font-size: var(--kozmos-font-size-400);
    }

    .kozmos-btn--full-width {
      width: 100%;
    }

    /* Loading spinner */
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;

  // -----------------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------------

  override render() {
    const classes = {
      "kozmos-btn": true,
      [`kozmos-btn--${this.variant}`]: true,
      [`kozmos-btn--${this.size}`]: true,
      "kozmos-btn--full-width": this.fullWidth,
    };

    return html`
      <button
        class=${classMap(classes)}
        ?disabled=${this.disabled || this.isLoading}
        aria-busy=${this.isLoading || undefined}
        aria-disabled=${this.disabled || this.isLoading || undefined}
        @click=${this._handleClick}
      >
        ${this.isLoading ? this._renderSpinner() : html`<slot></slot>`}
      </button>
    `;
  }

  private _renderSpinner() {
    const size = { sm: 12, md: 16, lg: 20 }[this.size];
    return html`
      <svg
        class="spinner"
        width="${size}"
        height="${size}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
        <path d="M4 12a8 8 0 018-8" opacity="0.75"></path>
      </svg>
    `;
  }

  private _handleClick(e: Event) {
    if (this.disabled || this.isLoading) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kozmos-button": KozmosButton;
  }
}
```

#### Proposal: 2.2 Vue 3 Wrapper

```vue
<!-- packages/vue/src/vue-wrappers/KozmosButton.vue -->
<template>
  <kozmos-button
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :is-loading="isLoading"
    :full-width="fullWidth"
    @click="$emit('click', $event)"
  >
    <slot />
  </kozmos-button>
</template>

<script setup lang="ts">
import "../components/kozmos-button";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

export interface KozmosButtonProps {
  variant?: "primary" | "secondary" | "outlined" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
}

withDefaults(defineProps<KozmosButtonProps>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  isLoading: false,
  fullWidth: false,
});

// -----------------------------------------------------------------------------
// Emits
// -----------------------------------------------------------------------------

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>
```

### Proposal: 5. React Native Patterns

#### Proposal: 5.1 Basic Component

```tsx
// packages/react-native/src/components/Button/Button.tsx

import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { tokens } from "../../tokens";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: tokens.motion.durationFast });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: tokens.motion.durationFast });
  };

  const isDisabled = disabled || isLoading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <AnimatedPressable
      style={[containerStyles, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
      }}
    >
      {isLoading ? (
        <ActivityIndicator
          size={size === "lg" ? "small" : "small"}
          color={
            variant === "primary" || variant === "destructive"
              ? tokens.colors.text.inverse
              : tokens.colors.text.primary
          }
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text style={textStyles}>
            {typeof children === "string" ? children : children}
          </Text>
          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius[200],
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[200],
  },

  icon: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Variants
  variant_primary: {
    backgroundColor: tokens.colors.interactive.primary,
  },
  variant_secondary: {
    backgroundColor: tokens.colors.background.secondary,
  },
  variant_outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  variant_ghost: {
    backgroundColor: "transparent",
  },
  variant_destructive: {
    backgroundColor: tokens.colors.status.danger,
  },

  // Sizes
  size_sm: {
    height: 32,
    paddingHorizontal: tokens.space[300],
  },
  size_md: {
    height: 40,
    paddingHorizontal: tokens.space[400],
  },
  size_lg: {
    height: 48,
    paddingHorizontal: tokens.space[500],
  },

  // Text
  text: {
    fontWeight: "500",
  },
  text_primary: {
    color: tokens.colors.text.inverse,
  },
  text_secondary: {
    color: tokens.colors.text.primary,
  },
  text_outlined: {
    color: tokens.colors.text.primary,
  },
  text_ghost: {
    color: tokens.colors.text.primary,
  },
  text_destructive: {
    color: tokens.colors.text.inverse,
  },

  textSize_sm: {
    fontSize: tokens.fontSize[200],
  },
  textSize_md: {
    fontSize: tokens.fontSize[300],
  },
  textSize_lg: {
    fontSize: tokens.fontSize[400],
  },

  // States
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: tokens.opacity.disabled,
  },
});
```

#### Proposal: 5.2 Tokens

```tsx
// packages/react-native/src/tokens/index.ts

/**
 * Kozmos Design System Tokens for React Native
 * Auto-generated from Style Dictionary - DO NOT EDIT MANUALLY
 */

export const tokens = {
  colors: {
    interactive: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
    },
    background: {
      primary: "#ffffff",
      secondary: "#f5f5f5",
      tertiary: "#e5e5e5",
    },
    text: {
      primary: "#171717",
      secondary: "#525252",
      tertiary: "#a3a3a3",
      inverse: "#ffffff",
    },
    border: {
      default: "#e5e5e5",
      strong: "#a3a3a3",
    },
    status: {
      success: "#22c55e",
      danger: "#ef4444",
      alert: "#f59e0b",
      info: "#3b82f6",
    },
  },

  space: {
    100: 4,
    200: 8,
    300: 12,
    400: 16,
    500: 24,
    600: 32,
  },

  fontSize: {
    100: 12,
    200: 14,
    300: 16,
    400: 18,
    500: 20,
    600: 24,
    700: 30,
  },

  radius: {
    100: 4,
    200: 8,
    300: 12,
    400: 16,
    full: 9999,
  },

  motion: {
    durationFast: 150,
    durationNormal: 250,
    durationSlow: 400,
  },

  opacity: {
    disabled: 0.38,
    hover: 0.08,
  },
} as const;

export type Tokens = typeof tokens;
```

---

## Proposal: from `.ai-skills/component-creation-guide.md`

These sections were in [`component-creation-guide.md`](../../.ai-skills/component-creation-guide.md), where each heading now says what is built instead.

### Proposal: 6. React Native Component Creation

#### Proposal: Step 1: Create Component File

```bash
# Proposal: not built. This does not exist; do not run it.
mkdir -p packages/react-native/src/components/Tooltip
touch packages/react-native/src/components/Tooltip/Tooltip.tsx
touch packages/react-native/src/components/Tooltip/index.ts
```

#### Proposal: Step 2: React Native Component

```tsx
// packages/react-native/src/components/Tooltip/Tooltip.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
} from "react-native";
import { tokens } from "../../tokens";

// ============================================================================
// Types
// ============================================================================

export type TooltipPosition = "top" | "bottom" | "left" | "right";
export type TooltipVariant = "default" | "dark";

export interface TooltipProps {
  /** Content to display in the tooltip */
  message: string;
  /** Position of the tooltip relative to children */
  position?: TooltipPosition;
  /** Visual variant */
  variant?: TooltipVariant;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Child element that triggers the tooltip */
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export const Tooltip: React.FC<TooltipProps> = ({
  message,
  position = "top",
  variant = "default",
  delayShow = 200,
  disabled = false,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipLayout, setTooltipLayout] = useState({ width: 0, height: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, delayShow);
  }, [disabled, delayShow, fadeAnim]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  }, [fadeAnim]);

  const handleTooltipLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTooltipLayout({ width, height });
  };

  const getTooltipPosition = (): ViewStyle => {
    const spacing = tokens.space[200];

    switch (position) {
      case "top":
        return {
          bottom: "100%",
          left: "50%",
          transform: [{ translateX: -tooltipLayout.width / 2 }],
          marginBottom: spacing,
        };
      case "bottom":
        return {
          top: "100%",
          left: "50%",
          transform: [{ translateX: -tooltipLayout.width / 2 }],
          marginTop: spacing,
        };
      case "left":
        return {
          right: "100%",
          top: "50%",
          transform: [{ translateY: -tooltipLayout.height / 2 }],
          marginRight: spacing,
        };
      case "right":
        return {
          left: "100%",
          top: "50%",
          transform: [{ translateY: -tooltipLayout.height / 2 }],
          marginLeft: spacing,
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "dark":
        return {
          container: { backgroundColor: tokens.color.neutral[900] },
          text: { color: tokens.color.neutral[50] },
        };
      default:
        return {
          container: { backgroundColor: tokens.color.background.tooltip },
          text: { color: tokens.color.text.inverse },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        onLongPress={showTooltip}
        accessibilityHint={message}
      >
        {children}
      </Pressable>

      {isVisible && (
        <Animated.View
          style={[
            styles.tooltip,
            variantStyles.container,
            getTooltipPosition(),
            { opacity: fadeAnim },
          ]}
          onLayout={handleTooltipLayout}
          accessibilityRole="alert"
        >
          <Text style={[styles.text, variantStyles.text]}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: tokens.space[300],
    paddingVertical: tokens.space[200],
    borderRadius: tokens.radius[200],
    zIndex: 1000,
  },
  text: {
    fontSize: tokens.fontSize[200],
    lineHeight: tokens.fontSize[200] * 1.4,
  },
});

export default Tooltip;
```

#### Proposal: Step 3: Barrel Export

```typescript
// packages/react-native/src/components/Tooltip/index.ts
export {
  Tooltip,
  type TooltipProps,
  type TooltipPosition,
  type TooltipVariant,
} from "./Tooltip";
export { default } from "./Tooltip";
```

### Proposal: 7. Vue Component Creation

#### Proposal: Step 1: Create Lit Web Component

```typescript
// packages/vue/src/components/kozmos-tooltip.ts
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("kozmos-tooltip")
export class KozmosTooltip extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .tooltip {
      position: absolute;
      z-index: var(--kozmos-z-index-tooltip, 1000);
      padding: var(--kozmos-space-200, 8px) var(--kozmos-space-300, 12px);
      border-radius: var(--kozmos-radius-200, 8px);
      font-size: var(--kozmos-font-size-200, 14px);
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 150ms ease-out,
        visibility 150ms ease-out;
    }

    .tooltip--visible {
      opacity: 1;
      visibility: visible;
    }

    .tooltip--default {
      background-color: var(--kozmos-color-background-tooltip);
      color: var(--kozmos-color-text-inverse);
    }

    .tooltip--dark {
      background-color: var(--kozmos-color-neutral-900);
      color: var(--kozmos-color-neutral-50);
    }

    .tooltip--top {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: var(--kozmos-space-200, 8px);
    }

    .tooltip--bottom {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: var(--kozmos-space-200, 8px);
    }
  `;

  @property({ type: String }) message = "";
  @property({ type: String }) position: "top" | "bottom" | "left" | "right" =
    "top";
  @property({ type: String }) variant: "default" | "dark" = "default";
  @property({ type: Number }) delay = 200;
  @property({ type: Boolean }) disabled = false;

  @state() private _isVisible = false;

  private _showTimeout?: number;

  private _handleMouseEnter = () => {
    if (this.disabled) return;
    this._showTimeout = window.setTimeout(() => {
      this._isVisible = true;
    }, this.delay);
  };

  private _handleMouseLeave = () => {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
    }
    this._isVisible = false;
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
    }
  }

  render() {
    const tooltipClasses = [
      "tooltip",
      `tooltip--${this.position}`,
      `tooltip--${this.variant}`,
      this._isVisible ? "tooltip--visible" : "",
    ].join(" ");

    return html`
      <div
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._handleMouseLeave}
        @focus=${this._handleMouseEnter}
        @blur=${this._handleMouseLeave}
      >
        <slot></slot>
        <div
          class=${tooltipClasses}
          role="tooltip"
          aria-hidden=${!this._isVisible}
        >
          ${this.message}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kozmos-tooltip": KozmosTooltip;
  }
}
```

#### Proposal: Step 2: Create Vue Wrapper

```vue
<!-- packages/vue/src/vue-wrappers/KozmosTooltip.vue -->
<template>
  <kozmos-tooltip
    :message="message"
    :position="position"
    :variant="variant"
    :delay="delay"
    :disabled="disabled"
  >
    <slot />
  </kozmos-tooltip>
</template>

<script setup lang="ts">
import "../components/kozmos-tooltip";

export interface Props {
  message: string;
  position?: "top" | "bottom" | "left" | "right";
  variant?: "default" | "dark";
  delay?: number;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  position: "top",
  variant: "default",
  delay: 200,
  disabled: false,
});
</script>
```

---

## Proposal: from `.ai-skills/testing-patterns.md`

These sections were in [`testing-patterns.md`](../../.ai-skills/testing-patterns.md), where each heading now says what is built instead.

### Proposal: 5. React Native Testing

#### Proposal: Test Setup

```typescript
// packages/react-native/jest.config.js
module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["./src/test/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|react-native-reanimated)/)",
  ],
  testMatch: ["**/*.test.tsx"],
};
```

#### Proposal: Setup File

```typescript
// packages/react-native/src/test/setup.ts
import "@testing-library/jest-native/extend-expect";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Platform
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "ios",
  select: jest.fn((obj) => obj.ios),
}));
```

#### Proposal: Button Tests (React Native)

```tsx
// packages/react-native/src/components/Button/Button.test.tsx
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button", () => {
  describe("Rendering", () => {
    it("renders children text", () => {
      render(<Button>Press me</Button>);
      expect(screen.getByText("Press me")).toBeTruthy();
    });

    it("renders with testID", () => {
      render(<Button testID="test-button">Press</Button>);
      expect(screen.getByTestId("test-button")).toBeTruthy();
    });
  });

  describe("Interactions", () => {
    it("calls onPress when pressed", () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress}>Press</Button>);

      fireEvent.press(screen.getByText("Press"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("does not call onPress when disabled", () => {
      const onPress = jest.fn();
      render(
        <Button onPress={onPress} disabled>
          Press
        </Button>,
      );

      fireEvent.press(screen.getByText("Press"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("does not call onPress when loading", () => {
      const onPress = jest.fn();
      render(
        <Button onPress={onPress} loading>
          Press
        </Button>,
      );

      // Loading indicator should be visible
      expect(screen.getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has correct accessibility role", () => {
      render(<Button>Press</Button>);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("is accessible when disabled", () => {
      render(<Button disabled>Press</Button>);
      expect(screen.getByRole("button")).toHaveAccessibilityState({
        disabled: true,
      });
    });

    it("announces loading state", () => {
      render(
        <Button loading accessibilityLabel="Submit">
          Submit
        </Button>,
      );
      expect(screen.getByLabelText("Submit")).toHaveAccessibilityState({
        busy: true,
      });
    });
  });

  describe("Haptic Feedback", () => {
    it("triggers haptic feedback on press", () => {
      const hapticMock = jest.fn();
      jest.mock("react-native", () => ({
        ...jest.requireActual("react-native"),
        Vibration: { vibrate: hapticMock },
      }));

      render(<Button haptic>Press</Button>);
      fireEvent.press(screen.getByText("Press"));

      // Verify haptic was triggered
    });
  });
});
```

### Proposal: 6. Vue Testing

#### Proposal: Test Setup

```typescript
// packages/vue/vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
```

#### Proposal: Web Component Tests

```typescript
// packages/vue/src/components/kozmos-button.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { fixture, html, expect as wcExpect } from "@open-wc/testing";
import "./kozmos-button";

describe("kozmos-button", () => {
  let element: HTMLElement;

  beforeEach(async () => {
    element = await fixture(html`<kozmos-button>Click</kozmos-button>`);
  });

  it("renders slot content", () => {
    expect(element.textContent).toContain("Click");
  });

  it("reflects variant attribute", async () => {
    element.setAttribute("variant", "outline");
    await element.updateComplete;
    expect(element.getAttribute("variant")).toBe("outline");
  });

  it("dispatches click event", async () => {
    let clicked = false;
    element.addEventListener("click", () => {
      clicked = true;
    });

    element.click();
    expect(clicked).toBe(true);
  });

  it("does not dispatch click when disabled", async () => {
    element.setAttribute("disabled", "");
    await element.updateComplete;

    let clicked = false;
    element.addEventListener("click", () => {
      clicked = true;
    });

    element.click();
    expect(clicked).toBe(false);
  });
});
```

---

## Proposal: from `.ai-skills/troubleshooting.md`

These sections were in [`troubleshooting.md`](../../.ai-skills/troubleshooting.md), where each heading now says what is built instead.

### Proposal: 6. React Native Issues

#### Proposal: 6.1 Metro Bundler Fails

**Symptoms:**

```
error: Error: Unable to resolve module @kozmos-ds/react-native
```

**Solutions:**

1. **Clear Metro cache:**

   ```bash
   # Proposal: not built. This does not exist; do not run it.
   npx react-native start --reset-cache
   ```

2. **Check metro.config.js:**

   ```javascript
   module.exports = {
     resolver: {
       nodeModulesPaths: [path.resolve(__dirname, "node_modules")],
     },
   };
   ```

3. **Reinstall pods (iOS):**
   ```bash
   # Proposal: not built. This does not exist; do not run it.
   cd ios && pod install --repo-update
   ```

---

#### Proposal: 6.2 Gesture Handler Not Working

**Symptoms:**

- Buttons don't respond to touch
- Swipe gestures fail

**Solutions:**

1. **Wrap app with GestureHandlerRootView:**

   ```tsx
   import { GestureHandlerRootView } from "react-native-gesture-handler";

   export default function App() {
     return (
       <GestureHandlerRootView style={{ flex: 1 }}>
         <Navigation />
       </GestureHandlerRootView>
     );
   }
   ```

2. **Import at entry point:**
   ```tsx
   // index.js - FIRST LINE
   import "react-native-gesture-handler";
   ```

---

#### Proposal: 6.3 Reanimated Errors

**Symptoms:**

```
Reanimated 2 failed to create a worklet
```

**Solutions:**

1. **Add Babel plugin:**

   ```javascript
   // babel.config.js
   module.exports = {
     plugins: ["react-native-reanimated/plugin"],
   };
   ```

2. **Clear caches:**
   ```bash
   # Proposal: not built. This does not exist; do not run it.
   npx react-native start --reset-cache
   cd android && ./gradlew clean
   cd ios && pod install
   ```

### Proposal: 7. Vue/Web Components Issues

#### Proposal: 7.1 Custom Elements Not Defined

**Symptoms:**

```
Uncaught TypeError: Illegal constructor
```

or

```
[Vue warn]: Failed to resolve component: kozmos-button
```

**Solutions:**

1. **Register custom elements:**

   ```typescript
   // main.ts
   import "@kozmos-ds/vue/define"; // Auto-registers all elements
   ```

2. **Configure Vue to recognize custom elements:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     plugins: [
       vue({
         template: {
           compilerOptions: {
             isCustomElement: (tag) => tag.startsWith("kozmos-"),
           },
         },
       }),
     ],
   });
   ```

---

#### Proposal: 7.2 v-model Not Working

**Symptoms:**

- Two-way binding doesn't update
- Input value not syncing

**Solutions:**

1. **Use Vue wrapper, not raw Web Component:**

   ```vue
   <!-- Use Vue wrapper -->
   <KozmosInput v-model="value" />

   <!-- Raw Web Component doesn't support v-model -->
   <kozmos-input :value="value" />
   ```

2. **Handle events manually for Web Components:**
   ```vue
   <kozmos-input :value="value" @input="value = $event.target.value" />
   ```

---

## Proposal: from `.ai-skills/accessibility-guide.md`

These sections were in [`accessibility-guide.md`](../../.ai-skills/accessibility-guide.md), where each heading now says what is built instead.

#### Proposal: 4.4 React Native

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

## Proposal: from `.ai-skills/i18n-guide.md`

These sections were in [`i18n-guide.md`](../../.ai-skills/i18n-guide.md), where each heading now says what is built instead.

#### Proposal: 4.4 React Native

```tsx
// i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import * as RNLocalize from "react-native-localize";

import en from "@kozmos-ds/locales/en/common.json";
import de from "@kozmos-ds/locales/de/common.json";
import ar from "@kozmos-ds/locales/ar/common.json";

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

## Proposal: from `.ai-skills/performance-benchmarks.md`

These sections were in [`performance-benchmarks.md`](../../.ai-skills/performance-benchmarks.md), where each heading now says what is built instead.

#### Proposal: React Native

| Metric                 | Budget | Measurement    |
| ---------------------- | ------ | -------------- |
| JS bundle impact       | <100KB | Metro bundler  |
| Bridge calls per frame | <10    | Flipper        |
| Frame rate             | 60fps  | Perf Monitor   |
| TTI impact             | <200ms | React DevTools |
| Memory                 | <20MB  | Flipper        |

```tsx
// Measuring JS-to-Native bridge calls
import { InteractionManager } from "react-native";

function measureInteraction(name: string, fn: () => void) {
  const start = performance.now();
  InteractionManager.runAfterInteractions(() => {
    fn();
    const duration = performance.now() - start;
    console.log(`[Kozmos] ${name}: ${duration.toFixed(2)}ms`);
  });
}
```

---

## Proposal: from `.ai-skills/security-guide.md`

These sections were in [`security-guide.md`](../../.ai-skills/security-guide.md), where each heading now says what is built instead.

#### Proposal: React Native

- Use react-native-keychain
- Prevent screenshots on sensitive screens
- Detect jailbreak/root in production

---

## Proposal: from `.ai-skills/migration-guide.md`

These sections were in [`migration-guide.md`](../../.ai-skills/migration-guide.md), where each heading now says what is built instead.

#### Proposal: React Native Migration

##### Package Changes

```json
// Proposal: not built. This does not exist.
{
  "dependencies": {
-   "@pointr/rn-components": "^1.0.0",
+   "@kozmos-ds/react-native": "^3.0.0"
  }
}
```

##### Theme Setup

```tsx
// Before
import { ThemeProvider } from "@pointr/rn-components";

// After
import { KozmosProvider } from "@kozmos-ds/react-native";

function App() {
  return (
    <KozmosProvider theme="light" brand="pointr">
      <MainNavigator />
    </KozmosProvider>
  );
}
```

#### Proposal: Vue Migration

##### Package Changes

```json
// Proposal: not built. This does not exist.
{
  "dependencies": {
-   "@pointr/vue-components": "^1.0.0",
+   "@kozmos-ds/vue": "^3.0.0"
  }
}
```

##### Plugin Registration

```typescript
// Before
import { PointrUI } from "@pointr/vue-components";
app.use(PointrUI);

// After
import { KozmosVue } from "@kozmos-ds/vue";
app.use(KozmosVue, {
  theme: "light",
  brand: "pointr",
});
```

---

## Proposal: from `.ai-skills/theming-guide.md`

These sections were in [`theming-guide.md`](../../.ai-skills/theming-guide.md), where each heading now says what is built instead.

#### Proposal: 5.4 React Native

```tsx
// theme/index.tsx
import { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

interface KozmosTheme {
  colors: {
    primary: string;
    primaryHover: string;
    onPrimary: string;
    secondary: string;
    background: string;
    foreground: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  isDark: boolean;
}

const lightTheme: KozmosTheme = {
  colors: {
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    onPrimary: "#FFFFFF",
    secondary: "#7C3AED",
    background: "#FAFAFA",
    foreground: "#171717",
    border: "#E5E5E5",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, full: 9999 },
  isDark: false,
};

const darkTheme: KozmosTheme = {
  ...lightTheme,
  colors: {
    primary: "#60A5FA",
    primaryHover: "#93C5FD",
    onPrimary: "#000000",
    secondary: "#A78BFA",
    background: "#171717",
    foreground: "#FAFAFA",
    border: "#404040",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
  },
  isDark: true,
};

interface ThemeOverrides {
  primary?: string;
  secondary?: string;
}

const ThemeContext = createContext<KozmosTheme>(lightTheme);

export function KozmosThemeProvider({
  children,
  overrides,
  forceDark,
}: {
  children: React.ReactNode;
  overrides?: ThemeOverrides;
  forceDark?: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = forceDark ?? colorScheme === "dark";

  const theme = useMemo(() => {
    const baseTheme = isDark ? darkTheme : lightTheme;

    if (!overrides) return baseTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...(overrides.primary && { primary: overrides.primary }),
        ...(overrides.secondary && { secondary: overrides.secondary }),
      },
    };
  }, [isDark, overrides]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useKozmosTheme() {
  return useContext(ThemeContext);
}

// Usage
function NavigationButton() {
  const theme = useKozmosTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
      }}
    >
      <Text style={{ color: theme.colors.onPrimary }}>Start Navigation</Text>
    </TouchableOpacity>
  );
}
```

---

## Proposal: from `.ai-skills/token-implementation.md`

These sections were in [`token-implementation.md`](../../.ai-skills/token-implementation.md), where each heading now says what is built instead.

#### Proposal: React Native Usage

```tsx
import { tokens } from "@kozmos-ds/tokens/react-native";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.background.primary,
    padding: tokens.space[400],
    borderRadius: tokens.radius[200],
  },
});
```
