# Kozmos Code Patterns & Templates

> **Purpose:** This document provides copy-paste-ready code templates for all 6 platforms in the Kozmos Design System. Use these patterns to ensure consistency when creating new components, stories, tests, and Code Connect mappings.

---

## Table of Contents

1. [React Component Patterns](#1-react-component-patterns)
2. [Vue/Web Component Patterns](#2-vueweb-component-patterns)
3. [iOS SwiftUI Patterns](#3-ios-swiftui-patterns)
4. [Android Compose Patterns](#4-android-compose-patterns)
5. [React Native Patterns](#5-react-native-patterns)
6. [Token Patterns](#6-token-patterns)
7. [Storybook Patterns](#7-storybook-patterns)
8. [Testing Patterns](#8-testing-patterns)
9. [Code Connect Patterns](#9-code-connect-patterns)
10. [Icon Generation Patterns](#10-icon-generation-patterns)

---

## 1. React Component Patterns

### 1.1 Basic Component with CVA

```tsx
// packages/react/src/components/Button/Button.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// -----------------------------------------------------------------------------
// Variants
// -----------------------------------------------------------------------------

const buttonVariants = cva(
  // Base styles (always applied)
  [
    "kozmos-btn",
    "inline-flex items-center justify-center gap-2",
    "rounded-[var(--kozmos-radius-200)]",
    "font-medium",
    "transition-colors duration-[var(--kozmos-motion-duration-fast)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--kozmos-color-interactive-primary)]",
    "disabled:pointer-events-none disabled:opacity-[var(--kozmos-opacity-disabled)]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--kozmos-color-interactive-primary)]",
          "text-[var(--kozmos-color-text-inverse)]",
          "hover:bg-[var(--kozmos-color-interactive-primary-hover)]",
          "active:bg-[var(--kozmos-color-interactive-primary-active)]",
        ],
        secondary: [
          "bg-[var(--kozmos-color-background-secondary)]",
          "text-[var(--kozmos-color-text-primary)]",
          "hover:bg-[var(--kozmos-color-background-secondary-hover)]",
        ],
        outlined: [
          "border border-[var(--kozmos-color-border-default)]",
          "bg-transparent",
          "text-[var(--kozmos-color-text-primary)]",
          "hover:bg-[var(--kozmos-color-background-secondary)]",
        ],
        ghost: [
          "bg-transparent",
          "text-[var(--kozmos-color-text-primary)]",
          "hover:bg-[var(--kozmos-color-background-secondary)]",
        ],
        destructive: [
          "bg-[var(--kozmos-color-status-danger)]",
          "text-[var(--kozmos-color-text-inverse)]",
          "hover:bg-[var(--kozmos-color-status-danger-hover)]",
        ],
      },
      size: {
        sm: "h-8 px-3 text-[var(--kozmos-font-size-200)]",
        md: "h-10 px-4 text-[var(--kozmos-font-size-300)]",
        lg: "h-12 px-6 text-[var(--kozmos-font-size-400)]",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows loading spinner and disables button */
  isLoading?: boolean;
  /** Icon to show before children */
  leftIcon?: React.ReactNode;
  /** Icon to show after children */
  rightIcon?: React.ReactNode;
  /** Renders as a different element (for links styled as buttons) */
  asChild?: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          <>
            {leftIcon && <span className="kozmos-btn-icon">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="kozmos-btn-icon">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | null;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size }) => {
  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size ?? "md"];

  return (
    <svg
      className={cn("animate-spin", sizeClass)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { Button, buttonVariants };
export type { ButtonProps };
```

### 1.2 Compound Component Pattern

```tsx
// packages/react/src/components/Tabs/Tabs.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within <Tabs>");
  }
  return context;
};

// -----------------------------------------------------------------------------
// Root Component
// -----------------------------------------------------------------------------

interface TabsProps {
  /** The value of the initially active tab */
  defaultValue: string;
  /** Controlled value */
  value?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Layout orientation */
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
}

const Tabs: React.FC<TabsProps> & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
} = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "horizontal",
  children,
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : uncontrolledValue;

  const setActiveTab = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, orientation }}>
      <div
        className={cn(
          "kozmos-tabs",
          orientation === "vertical" && "flex",
          className,
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// List Component
// -----------------------------------------------------------------------------

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        "kozmos-tabs-list",
        "inline-flex gap-1 p-1",
        "bg-[var(--kozmos-color-background-secondary)]",
        "rounded-[var(--kozmos-radius-200)]",
        orientation === "vertical" && "flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Trigger Component
// -----------------------------------------------------------------------------

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isSelected = activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={`kozmos-tabpanel-${value}`}
      id={`kozmos-tab-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveTab(value);
        }
      }}
      className={cn(
        "kozmos-tabs-trigger",
        "px-3 py-1.5",
        "text-[var(--kozmos-font-size-300)]",
        "font-medium",
        "rounded-[var(--kozmos-radius-100)]",
        "transition-colors duration-[var(--kozmos-motion-duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2",
        isSelected
          ? "bg-[var(--kozmos-color-background-primary)] text-[var(--kozmos-color-text-primary)] shadow-sm"
          : "text-[var(--kozmos-color-text-secondary)] hover:text-[var(--kozmos-color-text-primary)]",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Content Component
// -----------------------------------------------------------------------------

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  /** Force mount (useful for SEO or animations) */
  forceMount?: boolean;
}

const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
  forceMount = false,
}) => {
  const { activeTab } = useTabsContext();
  const isSelected = activeTab === value;

  if (!forceMount && !isSelected) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`kozmos-tabpanel-${value}`}
      aria-labelledby={`kozmos-tab-${value}`}
      hidden={!isSelected}
      tabIndex={0}
      className={cn(
        "kozmos-tabs-content",
        "mt-2 p-4",
        "focus-visible:outline-none focus-visible:ring-2",
        "rounded-[var(--kozmos-radius-200)]",
        className,
      )}
    >
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Attach sub-components
// -----------------------------------------------------------------------------

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };
```

### 1.3 Form Input with Slots

```tsx
// packages/react/src/components/Input/Input.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// -----------------------------------------------------------------------------
// Variants
// -----------------------------------------------------------------------------

const inputContainerVariants = cva(
  [
    "kozmos-input-container",
    "flex items-center gap-2",
    "border rounded-[var(--kozmos-radius-200)]",
    "bg-[var(--kozmos-color-background-primary)]",
    "transition-colors duration-[var(--kozmos-motion-duration-fast)]",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-[var(--kozmos-font-size-200)]",
        md: "h-10 px-3 text-[var(--kozmos-font-size-300)]",
        lg: "h-12 px-4 text-[var(--kozmos-font-size-400)]",
      },
      state: {
        default: [
          "border-[var(--kozmos-color-border-default)]",
          "focus-within:border-[var(--kozmos-color-interactive-primary)]",
          "focus-within:ring-2 focus-within:ring-[var(--kozmos-color-interactive-primary)]/20",
        ],
        error: [
          "border-[var(--kozmos-color-status-danger)]",
          "focus-within:ring-2 focus-within:ring-[var(--kozmos-color-status-danger)]/20",
        ],
        success: [
          "border-[var(--kozmos-color-status-success)]",
          "focus-within:ring-2 focus-within:ring-[var(--kozmos-color-status-success)]/20",
        ],
        disabled: [
          "border-[var(--kozmos-color-border-default)]",
          "bg-[var(--kozmos-color-background-secondary)]",
          "opacity-[var(--kozmos-opacity-disabled)]",
          "cursor-not-allowed",
        ],
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputContainerVariants> {
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (sets state to error) */
  errorMessage?: string;
  /** Success message (sets state to success) */
  successMessage?: string;
  /** Content to render before the input */
  leftSlot?: React.ReactNode;
  /** Content to render after the input */
  rightSlot?: React.ReactNode;
  /** Full width of container */
  fullWidth?: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      state: stateProp,
      label,
      helperText,
      errorMessage,
      successMessage,
      leftSlot,
      rightSlot,
      fullWidth = false,
      disabled,
      id: idProp,
      "aria-describedby": ariaDescribedByProp,
      ...props
    },
    ref,
  ) => {
    // Generate stable ID
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    // Determine state
    const state = disabled
      ? "disabled"
      : errorMessage
        ? "error"
        : successMessage
          ? "success"
          : (stateProp ?? "default");

    // Build aria-describedby
    const ariaDescribedBy =
      [
        ariaDescribedByProp,
        helperText && helperId,
        errorMessage && errorId,
        successMessage && successId,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("kozmos-input", fullWidth && "w-full", className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "kozmos-input-label",
              "block mb-1.5",
              "text-[var(--kozmos-font-size-200)]",
              "font-medium",
              "text-[var(--kozmos-color-text-primary)]",
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className={inputContainerVariants({ size, state })}>
          {/* Left slot */}
          {leftSlot && (
            <span className="kozmos-input-slot text-[var(--kozmos-color-text-secondary)]">
              {leftSlot}
            </span>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={state === "error" || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "kozmos-input-field",
              "flex-1 min-w-0",
              "bg-transparent",
              "border-none outline-none",
              "text-[var(--kozmos-color-text-primary)]",
              "placeholder:text-[var(--kozmos-color-text-tertiary)]",
              disabled && "cursor-not-allowed",
            )}
            {...props}
          />

          {/* Right slot */}
          {rightSlot && (
            <span className="kozmos-input-slot text-[var(--kozmos-color-text-secondary)]">
              {rightSlot}
            </span>
          )}
        </div>

        {/* Helper/Error/Success text */}
        {(helperText || errorMessage || successMessage) && (
          <div className="mt-1.5 text-[var(--kozmos-font-size-100)]">
            {helperText && !errorMessage && !successMessage && (
              <p
                id={helperId}
                className="kozmos-input-helper text-[var(--kozmos-color-text-secondary)]"
              >
                {helperText}
              </p>
            )}
            {errorMessage && (
              <p
                id={errorId}
                role="alert"
                className="kozmos-input-error text-[var(--kozmos-color-status-danger)]"
              >
                {errorMessage}
              </p>
            )}
            {successMessage && !errorMessage && (
              <p
                id={successId}
                className="kozmos-input-success text-[var(--kozmos-color-status-success)]"
              >
                {successMessage}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { Input, inputContainerVariants };
```

### 1.4 Polymorphic Component

```tsx
// packages/react/src/components/Box/Box.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type BoxElement =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "main"
  | "nav";

type BoxProps<T extends BoxElement = "div"> = {
  /** HTML element to render */
  as?: T;
  /** Padding using token scale */
  p?: "none" | "100" | "200" | "300" | "400" | "500" | "600";
  /** Padding X (horizontal) */
  px?: "none" | "100" | "200" | "300" | "400" | "500" | "600";
  /** Padding Y (vertical) */
  py?: "none" | "100" | "200" | "300" | "400" | "500" | "600";
  /** Margin using token scale */
  m?: "none" | "100" | "200" | "300" | "400" | "500" | "600" | "auto";
  /** Margin X (horizontal) */
  mx?: "none" | "100" | "200" | "300" | "400" | "500" | "600" | "auto";
  /** Margin Y (vertical) */
  my?: "none" | "100" | "200" | "300" | "400" | "500" | "600" | "auto";
  /** Border radius */
  radius?: "none" | "100" | "200" | "300" | "400" | "full";
  /** Background color token */
  bg?: "primary" | "secondary" | "tertiary" | "inverse";
  /** Shadow elevation */
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as">;

// -----------------------------------------------------------------------------
// Utility classes
// -----------------------------------------------------------------------------

const spacingClasses = {
  none: "0",
  "100": "var(--kozmos-space-100)",
  "200": "var(--kozmos-space-200)",
  "300": "var(--kozmos-space-300)",
  "400": "var(--kozmos-space-400)",
  "500": "var(--kozmos-space-500)",
  "600": "var(--kozmos-space-600)",
  auto: "auto",
};

const radiusClasses = {
  none: "0",
  "100": "var(--kozmos-radius-100)",
  "200": "var(--kozmos-radius-200)",
  "300": "var(--kozmos-radius-300)",
  "400": "var(--kozmos-radius-400)",
  full: "var(--kozmos-radius-full)",
};

const bgClasses = {
  primary: "var(--kozmos-color-background-primary)",
  secondary: "var(--kozmos-color-background-secondary)",
  tertiary: "var(--kozmos-color-background-tertiary)",
  inverse: "var(--kozmos-color-background-inverse)",
};

const shadowClasses = {
  none: "none",
  sm: "var(--kozmos-shadow-sm)",
  md: "var(--kozmos-shadow-md)",
  lg: "var(--kozmos-shadow-lg)",
  xl: "var(--kozmos-shadow-xl)",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

function BoxInner<T extends BoxElement = "div">(
  {
    as,
    p,
    px,
    py,
    m,
    mx,
    my,
    radius,
    bg,
    shadow,
    className,
    style,
    children,
    ...props
  }: BoxProps<T>,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const Component = as || "div";

  const customStyle: React.CSSProperties = {
    ...(p && { padding: spacingClasses[p] }),
    ...(px && { paddingInline: spacingClasses[px] }),
    ...(py && { paddingBlock: spacingClasses[py] }),
    ...(m && { margin: spacingClasses[m] }),
    ...(mx && { marginInline: spacingClasses[mx] }),
    ...(my && { marginBlock: spacingClasses[my] }),
    ...(radius && { borderRadius: radiusClasses[radius] }),
    ...(bg && { backgroundColor: bgClasses[bg] }),
    ...(shadow && { boxShadow: shadowClasses[shadow] }),
    ...style,
  };

  return React.createElement(
    Component,
    {
      ref,
      className: cn("kozmos-box", className),
      style: customStyle,
      ...props,
    },
    children,
  );
}

const Box = React.forwardRef(BoxInner) as <T extends BoxElement = "div">(
  props: BoxProps<T> & { ref?: React.ForwardedRef<HTMLElement> },
) => React.ReactElement;

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { Box };
export type { BoxProps, BoxElement };
```

### 1.5 Error Boundary

```tsx
// packages/react/src/components/ErrorBoundary/ErrorBoundary.tsx
"use client";

import * as React from "react";
import { Button } from "../Button";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI */
  fallback?:
    | React.ReactNode
    | ((error: Error, reset: () => void) => React.ReactNode);
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Reset keys - when these change, the error boundary resets */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      );
      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error, this.reset);
        }
        return this.props.fallback;
      }

      // Default fallback
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

// -----------------------------------------------------------------------------
// Default Fallback
// -----------------------------------------------------------------------------

interface ErrorFallbackProps {
  error: Error;
  onReset?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  return (
    <div
      role="alert"
      className="kozmos-error-fallback flex flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div className="rounded-full bg-[var(--kozmos-color-status-danger)]/10 p-3">
        <svg
          className="h-6 w-6 text-[var(--kozmos-color-status-danger)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--kozmos-color-text-primary)]">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-[var(--kozmos-color-text-secondary)]">
          {error.message || "An unexpected error occurred"}
        </p>
      </div>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Try again
        </Button>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export { ErrorBoundary, ErrorFallback };
export type { ErrorBoundaryProps, ErrorFallbackProps };
```

### 1.6 Utility: cn (Class Name Merger)

```tsx
// packages/react/src/utils/cn.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge.
 * Handles conditional classes and Tailwind conflicts.
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', { 'text-blue-500': isBlue }) // conditional
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 1.7 ThemeProvider

```tsx
// packages/react/src/components/ThemeProvider/ThemeProvider.tsx
"use client";

import * as React from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme */
  defaultTheme?: Theme;
  /** Storage key for persisting theme */
  storageKey?: string;
  /** Custom brand colors for white-labeling */
  brandColors?: {
    primary?: string;
    background?: string;
    foreground?: string;
    success?: string;
    danger?: string;
    alert?: string;
    info?: string;
  };
  /** Disable transitions on theme change */
  disableTransitionOnChange?: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return context;
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
  storageKey = "kozmos-theme",
  brandColors,
  disableTransitionOnChange = false,
}) => {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light");

  // Get system preference
  const getSystemTheme = React.useCallback((): ResolvedTheme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Resolve theme
  React.useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply to document
    const root = document.documentElement;

    if (disableTransitionOnChange) {
      root.style.setProperty("--kozmos-transition-duration", "0ms");
    }

    root.setAttribute("data-kozmos-theme", resolved);
    root.classList.remove("light", "dark");
    root.classList.add(resolved);

    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        root.style.removeProperty("--kozmos-transition-duration");
      });
    }
  }, [theme, getSystemTheme, disableTransitionOnChange]);

  // Apply brand colors
  React.useEffect(() => {
    if (!brandColors) return;

    const root = document.documentElement;

    if (brandColors.primary) {
      root.style.setProperty(
        "--kozmos-color-brand-primary",
        brandColors.primary,
      );
    }
    if (brandColors.background) {
      root.style.setProperty(
        "--kozmos-color-background-primary",
        brandColors.background,
      );
    }
    if (brandColors.foreground) {
      root.style.setProperty(
        "--kozmos-color-text-primary",
        brandColors.foreground,
      );
    }
    if (brandColors.success) {
      root.style.setProperty(
        "--kozmos-color-status-success",
        brandColors.success,
      );
    }
    if (brandColors.danger) {
      root.style.setProperty(
        "--kozmos-color-status-danger",
        brandColors.danger,
      );
    }
    if (brandColors.alert) {
      root.style.setProperty("--kozmos-color-status-alert", brandColors.alert);
    }
    if (brandColors.info) {
      root.style.setProperty("--kozmos-color-status-info", brandColors.info);
    }

    return () => {
      // Cleanup on unmount
      Object.keys(brandColors).forEach((key) => {
        root.style.removeProperty(`--kozmos-color-${key}`);
      });
    };
  }, [brandColors]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(getSystemTheme());

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme, getSystemTheme]);

  // Persist to storage
  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Storage not available
      }
    },
    [storageKey],
  );

  // Load from storage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        setThemeState(stored);
      }
    } catch {
      // Storage not available
    }
  }, [storageKey]);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
```

---

## 2. Vue/Web Component Patterns

### 2.1 Lit Web Component

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

### 2.2 Vue 3 Wrapper

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

---

## 3. iOS SwiftUI Patterns

### 3.1 Basic Component

```swift
// packages/ios/Sources/KozmosUI/Components/KozmosButton.swift

import SwiftUI

// MARK: - Button Variant

public enum KozmosButtonVariant: String, CaseIterable {
    case primary
    case secondary
    case outlined
    case ghost
    case destructive
}

// MARK: - Button Size

public enum KozmosButtonSize: String, CaseIterable {
    case sm
    case md
    case lg

    var height: CGFloat {
        switch self {
        case .sm: return 32
        case .md: return 40
        case .lg: return 48
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .sm: return KozmosTokens.space300
        case .md: return KozmosTokens.space400
        case .lg: return KozmosTokens.space500
        }
    }

    var font: Font {
        switch self {
        case .sm: return .system(size: KozmosTokens.fontSize200, weight: .medium)
        case .md: return .system(size: KozmosTokens.fontSize300, weight: .medium)
        case .lg: return .system(size: KozmosTokens.fontSize400, weight: .medium)
        }
    }
}

// MARK: - Button Component

public struct KozmosButton<Label: View>: View {
    // Properties
    let variant: KozmosButtonVariant
    let size: KozmosButtonSize
    let isLoading: Bool
    let isDisabled: Bool
    let fullWidth: Bool
    let action: () -> Void
    let label: () -> Label

    // MARK: - Initializer

    public init(
        variant: KozmosButtonVariant = .primary,
        size: KozmosButtonSize = .md,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        fullWidth: Bool = false,
        action: @escaping () -> Void,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.variant = variant
        self.size = size
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.fullWidth = fullWidth
        self.action = action
        self.label = label
    }

    // MARK: - Body

    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosTokens.space200) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: foregroundColor))
                        .scaleEffect(0.8)
                } else {
                    label()
                }
            }
            .frame(height: size.height)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .padding(.horizontal, size.horizontalPadding)
            .font(size.font)
            .foregroundColor(foregroundColor)
            .background(backgroundColor)
            .cornerRadius(KozmosTokens.radius200)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosTokens.radius200)
                    .stroke(borderColor, lineWidth: variant == .outlined ? 1 : 0)
            )
        }
        .buttonStyle(KozmosButtonStyle())
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? KozmosTokens.opacityDisabled : 1)
        .accessibilityAddTraits(.isButton)
        .accessibilityRemoveTraits(isDisabled ? .isButton : [])
    }

    // MARK: - Computed Colors

    private var backgroundColor: Color {
        switch variant {
        case .primary:
            return KozmosTokens.colorInteractivePrimary
        case .secondary:
            return KozmosTokens.colorBackgroundSecondary
        case .outlined, .ghost:
            return .clear
        case .destructive:
            return KozmosTokens.colorStatusDanger
        }
    }

    private var foregroundColor: Color {
        switch variant {
        case .primary, .destructive:
            return KozmosTokens.colorTextInverse
        case .secondary, .outlined, .ghost:
            return KozmosTokens.colorTextPrimary
        }
    }

    private var borderColor: Color {
        switch variant {
        case .outlined:
            return KozmosTokens.colorBorderDefault
        default:
            return .clear
        }
    }
}

// MARK: - Button Style

private struct KozmosButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: KozmosTokens.motionDurationFast), value: configuration.isPressed)
    }
}

// MARK: - Convenience Initializer (String Label)

extension KozmosButton where Label == Text {
    public init(
        _ title: String,
        variant: KozmosButtonVariant = .primary,
        size: KozmosButtonSize = .md,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        fullWidth: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            variant: variant,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled,
            fullWidth: fullWidth,
            action: action,
            label: { Text(title) }
        )
    }
}

// MARK: - Preview

#if DEBUG
struct KozmosButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            ForEach(KozmosButtonVariant.allCases, id: \.self) { variant in
                KozmosButton("Button", variant: variant) {
                    print("Tapped \(variant)")
                }
            }

            KozmosButton("Loading", isLoading: true) {}

            KozmosButton("Disabled", isDisabled: true) {}

            KozmosButton("Full Width", fullWidth: true) {}
        }
        .padding()
    }
}
#endif
```

### 3.2 Theme Environment

```swift
// packages/ios/Sources/KozmosUI/Theme/KozmosTheme.swift

import SwiftUI

// MARK: - Theme Mode

public enum KozmosThemeMode: String, CaseIterable {
    case light
    case dark
    case system
}

// MARK: - Brand Configuration

public struct KozmosBrandConfig {
    public let primaryColor: Color?
    public let backgroundColor: Color?
    public let foregroundColor: Color?
    public let successColor: Color?
    public let dangerColor: Color?
    public let alertColor: Color?
    public let infoColor: Color?

    public init(
        primaryColor: Color? = nil,
        backgroundColor: Color? = nil,
        foregroundColor: Color? = nil,
        successColor: Color? = nil,
        dangerColor: Color? = nil,
        alertColor: Color? = nil,
        infoColor: Color? = nil
    ) {
        self.primaryColor = primaryColor
        self.backgroundColor = backgroundColor
        self.foregroundColor = foregroundColor
        self.successColor = successColor
        self.dangerColor = dangerColor
        self.alertColor = alertColor
        self.infoColor = infoColor
    }

    public static let `default` = KozmosBrandConfig()
}

// MARK: - Theme Environment Key

private struct KozmosThemeModeKey: EnvironmentKey {
    static let defaultValue: KozmosThemeMode = .system
}

private struct KozmosBrandConfigKey: EnvironmentKey {
    static let defaultValue: KozmosBrandConfig = .default
}

extension EnvironmentValues {
    public var kozmosThemeMode: KozmosThemeMode {
        get { self[KozmosThemeModeKey.self] }
        set { self[KozmosThemeModeKey.self] = newValue }
    }

    public var kozmosBrandConfig: KozmosBrandConfig {
        get { self[KozmosBrandConfigKey.self] }
        set { self[KozmosBrandConfigKey.self] = newValue }
    }
}

// MARK: - Theme Provider

public struct KozmosTheme<Content: View>: View {
    @Environment(\.colorScheme) private var systemColorScheme

    let mode: KozmosThemeMode
    let brand: KozmosBrandConfig
    let content: () -> Content

    public init(
        mode: KozmosThemeMode = .system,
        brand: KozmosBrandConfig = .default,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.mode = mode
        self.brand = brand
        self.content = content
    }

    public var body: some View {
        content()
            .environment(\.kozmosThemeMode, mode)
            .environment(\.kozmosBrandConfig, brand)
            .preferredColorScheme(resolvedColorScheme)
    }

    private var resolvedColorScheme: ColorScheme? {
        switch mode {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
}

// MARK: - View Modifier

extension View {
    public func kozmosTheme(
        mode: KozmosThemeMode = .system,
        brand: KozmosBrandConfig = .default
    ) -> some View {
        KozmosTheme(mode: mode, brand: brand) {
            self
        }
    }
}
```

### 3.3 Tokens

```swift
// packages/ios/Sources/KozmosUI/Tokens/KozmosTokens.swift

import SwiftUI

/// Design tokens for the Kozmos Design System
/// Auto-generated from Style Dictionary - DO NOT EDIT MANUALLY
public enum KozmosTokens {

    // MARK: - Colors

    public static let colorInteractivePrimary = Color("interactive-primary", bundle: .module)
    public static let colorInteractivePrimaryHover = Color("interactive-primary-hover", bundle: .module)
    public static let colorBackgroundPrimary = Color("background-primary", bundle: .module)
    public static let colorBackgroundSecondary = Color("background-secondary", bundle: .module)
    public static let colorTextPrimary = Color("text-primary", bundle: .module)
    public static let colorTextSecondary = Color("text-secondary", bundle: .module)
    public static let colorTextInverse = Color("text-inverse", bundle: .module)
    public static let colorBorderDefault = Color("border-default", bundle: .module)
    public static let colorStatusSuccess = Color("status-success", bundle: .module)
    public static let colorStatusDanger = Color("status-danger", bundle: .module)
    public static let colorStatusAlert = Color("status-alert", bundle: .module)
    public static let colorStatusInfo = Color("status-info", bundle: .module)

    // MARK: - Spacing

    public static let space100: CGFloat = 4
    public static let space200: CGFloat = 8
    public static let space300: CGFloat = 12
    public static let space400: CGFloat = 16
    public static let space500: CGFloat = 24
    public static let space600: CGFloat = 32

    // MARK: - Typography

    public static let fontSize100: CGFloat = 12
    public static let fontSize200: CGFloat = 14
    public static let fontSize300: CGFloat = 16
    public static let fontSize400: CGFloat = 18
    public static let fontSize500: CGFloat = 20
    public static let fontSize600: CGFloat = 24
    public static let fontSize700: CGFloat = 30

    // MARK: - Border Radius

    public static let radius100: CGFloat = 4
    public static let radius200: CGFloat = 8
    public static let radius300: CGFloat = 12
    public static let radius400: CGFloat = 16
    public static let radiusFull: CGFloat = 9999

    // MARK: - Motion

    public static let motionDurationFast: Double = 0.15
    public static let motionDurationNormal: Double = 0.25
    public static let motionDurationSlow: Double = 0.4

    // MARK: - Opacity

    public static let opacityDisabled: Double = 0.38
    public static let opacityHover: Double = 0.08
}
```

---

## 4. Android Compose Patterns

### 4.1 Basic Component

```kotlin
// packages/android/kozmos-ui/src/main/kotlin/com/pointr/kozmos/components/KozmosButton.kt

package com.pointr.kozmos.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.pointr.kozmos.tokens.KozmosTokens

// -----------------------------------------------------------------------------
// Variant Enum
// -----------------------------------------------------------------------------

enum class KozmosButtonVariant {
    Primary,
    Secondary,
    Outlined,
    Ghost,
    Destructive
}

// -----------------------------------------------------------------------------
// Size Enum
// -----------------------------------------------------------------------------

enum class KozmosButtonSize {
    Sm,
    Md,
    Lg;

    val height: Int
        get() = when (this) {
            Sm -> 32
            Md -> 40
            Lg -> 48
        }

    val horizontalPadding: Int
        get() = when (this) {
            Sm -> KozmosTokens.space300.toInt()
            Md -> KozmosTokens.space400.toInt()
            Lg -> KozmosTokens.space500.toInt()
        }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

@Composable
fun KozmosButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosButtonVariant = KozmosButtonVariant.Primary,
    size: KozmosButtonSize = KozmosButtonSize.Md,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    fullWidth: Boolean = false,
    content: @Composable RowScope.() -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        label = "button_scale"
    )

    val colors = when (variant) {
        KozmosButtonVariant.Primary -> ButtonDefaults.buttonColors(
            containerColor = KozmosTokens.colorInteractivePrimary,
            contentColor = KozmosTokens.colorTextInverse,
            disabledContainerColor = KozmosTokens.colorInteractivePrimary.copy(alpha = KozmosTokens.opacityDisabled),
            disabledContentColor = KozmosTokens.colorTextInverse.copy(alpha = KozmosTokens.opacityDisabled)
        )
        KozmosButtonVariant.Secondary -> ButtonDefaults.buttonColors(
            containerColor = KozmosTokens.colorBackgroundSecondary,
            contentColor = KozmosTokens.colorTextPrimary
        )
        KozmosButtonVariant.Outlined -> ButtonDefaults.outlinedButtonColors(
            contentColor = KozmosTokens.colorTextPrimary
        )
        KozmosButtonVariant.Ghost -> ButtonDefaults.textButtonColors(
            contentColor = KozmosTokens.colorTextPrimary
        )
        KozmosButtonVariant.Destructive -> ButtonDefaults.buttonColors(
            containerColor = KozmosTokens.colorStatusDanger,
            contentColor = KozmosTokens.colorTextInverse
        )
    }

    val border = if (variant == KozmosButtonVariant.Outlined) {
        BorderStroke(1.dp, KozmosTokens.colorBorderDefault)
    } else null

    val buttonModifier = modifier
        .scale(scale)
        .height(size.height.dp)
        .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)

    when (variant) {
        KozmosButtonVariant.Outlined -> {
            OutlinedButton(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled && !isLoading,
                colors = colors,
                border = border,
                shape = RoundedCornerShape(KozmosTokens.radius200.dp),
                contentPadding = PaddingValues(horizontal = size.horizontalPadding.dp),
                interactionSource = interactionSource
            ) {
                ButtonContent(isLoading = isLoading, size = size, content = content)
            }
        }
        KozmosButtonVariant.Ghost -> {
            TextButton(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled && !isLoading,
                colors = colors,
                shape = RoundedCornerShape(KozmosTokens.radius200.dp),
                contentPadding = PaddingValues(horizontal = size.horizontalPadding.dp),
                interactionSource = interactionSource
            ) {
                ButtonContent(isLoading = isLoading, size = size, content = content)
            }
        }
        else -> {
            Button(
                onClick = onClick,
                modifier = buttonModifier,
                enabled = enabled && !isLoading,
                colors = colors,
                shape = RoundedCornerShape(KozmosTokens.radius200.dp),
                contentPadding = PaddingValues(horizontal = size.horizontalPadding.dp),
                interactionSource = interactionSource
            ) {
                ButtonContent(isLoading = isLoading, size = size, content = content)
            }
        }
    }
}

@Composable
private fun RowScope.ButtonContent(
    isLoading: Boolean,
    size: KozmosButtonSize,
    content: @Composable RowScope.() -> Unit
) {
    if (isLoading) {
        CircularProgressIndicator(
            modifier = Modifier.size(
                when (size) {
                    KozmosButtonSize.Sm -> 12.dp
                    KozmosButtonSize.Md -> 16.dp
                    KozmosButtonSize.Lg -> 20.dp
                }
            ),
            strokeWidth = 2.dp,
            color = LocalContentColor.current
        )
    } else {
        content()
    }
}

// -----------------------------------------------------------------------------
// Convenience Overload
// -----------------------------------------------------------------------------

@Composable
fun KozmosButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosButtonVariant = KozmosButtonVariant.Primary,
    size: KozmosButtonSize = KozmosButtonSize.Md,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    fullWidth: Boolean = false
) {
    KozmosButton(
        onClick = onClick,
        modifier = modifier,
        variant = variant,
        size = size,
        enabled = enabled,
        isLoading = isLoading,
        fullWidth = fullWidth
    ) {
        Text(text)
    }
}

// -----------------------------------------------------------------------------
// Preview
// -----------------------------------------------------------------------------

@Preview
@Composable
private fun KozmosButtonPreview() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        KozmosButtonVariant.values().forEach { variant ->
            KozmosButton(
                text = variant.name,
                onClick = {},
                variant = variant
            )
        }

        KozmosButton(
            text = "Loading",
            onClick = {},
            isLoading = true
        )

        KozmosButton(
            text = "Disabled",
            onClick = {},
            enabled = false
        )

        KozmosButton(
            text = "Full Width",
            onClick = {},
            fullWidth = true
        )
    }
}
```

### 4.2 Theme

```kotlin
// packages/android/kozmos-ui/src/main/kotlin/com/pointr/kozmos/theme/KozmosTheme.kt

package com.pointr.kozmos.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import com.pointr.kozmos.tokens.KozmosTokens

// -----------------------------------------------------------------------------
// Brand Configuration
// -----------------------------------------------------------------------------

data class KozmosBrandConfig(
    val primaryColor: Color? = null,
    val backgroundColor: Color? = null,
    val foregroundColor: Color? = null,
    val successColor: Color? = null,
    val dangerColor: Color? = null,
    val alertColor: Color? = null,
    val infoColor: Color? = null
) {
    companion object {
        val Default = KozmosBrandConfig()
    }
}

// -----------------------------------------------------------------------------
// Local Composition
// -----------------------------------------------------------------------------

val LocalKozmosBrandConfig = staticCompositionLocalOf { KozmosBrandConfig.Default }

// -----------------------------------------------------------------------------
// Theme
// -----------------------------------------------------------------------------

@Composable
fun KozmosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    brand: KozmosBrandConfig = KozmosBrandConfig.Default,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = brand.primaryColor ?: KozmosTokens.colorInteractivePrimary,
            background = brand.backgroundColor ?: KozmosTokens.colorBackgroundPrimaryDark,
            onBackground = brand.foregroundColor ?: KozmosTokens.colorTextPrimaryDark,
            surface = KozmosTokens.colorBackgroundSecondaryDark,
            onSurface = KozmosTokens.colorTextPrimaryDark,
            error = brand.dangerColor ?: KozmosTokens.colorStatusDanger
        )
    } else {
        lightColorScheme(
            primary = brand.primaryColor ?: KozmosTokens.colorInteractivePrimary,
            background = brand.backgroundColor ?: KozmosTokens.colorBackgroundPrimary,
            onBackground = brand.foregroundColor ?: KozmosTokens.colorTextPrimary,
            surface = KozmosTokens.colorBackgroundSecondary,
            onSurface = KozmosTokens.colorTextPrimary,
            error = brand.dangerColor ?: KozmosTokens.colorStatusDanger
        )
    }

    CompositionLocalProvider(
        LocalKozmosBrandConfig provides brand
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = KozmosTypography,
            content = content
        )
    }
}
```

---

## 5. React Native Patterns

### 5.1 Basic Component

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

### 5.2 Tokens

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

## 6. Token Patterns

### 6.1 DTCG Format Token File

```json
// packages/tokens/src/foundations/colors.tokens.json
{
  "$type": "color",
  "color": {
    "blue": {
      "50": { "$value": "#eff6ff" },
      "100": { "$value": "#dbeafe" },
      "200": { "$value": "#bfdbfe" },
      "300": { "$value": "#93c5fd" },
      "400": { "$value": "#60a5fa" },
      "500": { "$value": "#3b82f6" },
      "600": { "$value": "#2563eb" },
      "700": { "$value": "#1d4ed8" },
      "800": { "$value": "#1e40af" },
      "900": { "$value": "#1e3a8a" }
    },
    "neutral": {
      "50": { "$value": "#fafafa" },
      "100": { "$value": "#f5f5f5" },
      "200": { "$value": "#e5e5e5" },
      "300": { "$value": "#d4d4d4" },
      "400": { "$value": "#a3a3a3" },
      "500": { "$value": "#737373" },
      "600": { "$value": "#525252" },
      "700": { "$value": "#404040" },
      "800": { "$value": "#262626" },
      "900": { "$value": "#171717" }
    },
    "green": {
      "500": { "$value": "#22c55e" },
      "600": { "$value": "#16a34a" }
    },
    "red": {
      "500": { "$value": "#ef4444" },
      "600": { "$value": "#dc2626" }
    },
    "amber": {
      "500": { "$value": "#f59e0b" },
      "600": { "$value": "#d97706" }
    }
  }
}
```

### 6.2 Semantic Tokens

```json
// packages/tokens/src/semantic/colors.tokens.json
{
  "color": {
    "interactive": {
      "primary": {
        "$value": "{color.blue.600}",
        "$description": "Primary interactive elements (buttons, links)"
      },
      "primary-hover": {
        "$value": "{color.blue.700}"
      }
    },
    "background": {
      "primary": {
        "$value": "{color.neutral.50}",
        "$description": "Default page/surface background"
      },
      "secondary": {
        "$value": "{color.neutral.100}"
      }
    },
    "text": {
      "primary": {
        "$value": "{color.neutral.900}",
        "$description": "Primary text color"
      },
      "secondary": {
        "$value": "{color.neutral.600}"
      },
      "inverse": {
        "$value": "{color.neutral.50}",
        "$description": "Text on dark backgrounds"
      }
    },
    "border": {
      "default": {
        "$value": "{color.neutral.200}"
      }
    },
    "status": {
      "success": { "$value": "{color.green.500}" },
      "danger": { "$value": "{color.red.500}" },
      "alert": { "$value": "{color.amber.500}" },
      "info": { "$value": "{color.blue.500}" }
    }
  }
}
```

### 6.3 Style Dictionary Config

```typescript
// packages/tokens/style-dictionary.config.ts

import StyleDictionary from "style-dictionary";
import type { Config } from "style-dictionary";

const config: Config = {
  source: ["src/**/*.tokens.json"],

  preprocessors: ["tokens-studio"],

  platforms: {
    // Web - CSS Variables
    css: {
      transformGroup: "css",
      buildPath: "dist/web/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: {
            outputReferences: true,
          },
        },
      ],
      transforms: ["attribute/cti", "name/cti/kebab", "color/css"],
      prefix: "kozmos",
    },

    // Web - TypeScript
    ts: {
      transformGroup: "js",
      buildPath: "dist/web/",
      files: [
        {
          destination: "tokens.ts",
          format: "javascript/es6",
        },
        {
          destination: "tokens.d.ts",
          format: "typescript/es6-declarations",
        },
      ],
    },

    // iOS - Swift
    ios: {
      transformGroup: "ios-swift",
      buildPath: "dist/ios/",
      files: [
        {
          destination: "KozmosTokens.swift",
          format: "ios-swift/class.swift",
          className: "KozmosTokens",
          options: {
            accessControl: "public",
          },
        },
      ],
    },

    // Android - Compose
    android: {
      transformGroup: "compose",
      buildPath: "dist/android/",
      files: [
        {
          destination: "KozmosTokens.kt",
          format: "compose/object",
          className: "KozmosTokens",
          packageName: "com.pointr.kozmos.tokens",
        },
      ],
    },

    // React Native - JS
    rn: {
      transformGroup: "react-native",
      buildPath: "dist/react-native/",
      files: [
        {
          destination: "tokens.ts",
          format: "javascript/es6",
        },
      ],
    },
  },
};

export default config;
```

---

## 7. Storybook Patterns

### 7.1 Story with Controls

```tsx
// packages/react/src/components/Button/Button.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";
import { Icon } from "../Icon";

// -----------------------------------------------------------------------------
// Meta
// -----------------------------------------------------------------------------

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Buttons trigger actions or navigation. Use the appropriate variant
for the button's importance and context.

## Usage Guidelines

- **Primary**: Main actions, one per view
- **Secondary**: Alternative actions
- **Outlined**: Less prominent actions
- **Ghost**: Tertiary actions, in toolbars
- **Destructive**: Irreversible/dangerous actions
        `,
      },
    },
    design: {
      type: "figma",
      url: "https://www.figma.com/file/XXXXX/Kozmos?node-id=123:456",
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outlined", "ghost", "destructive"],
      description: "Visual style variant",
      table: {
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading spinner",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
    fullWidth: {
      control: "boolean",
      description: "Makes button full width of container",
    },
    children: {
      control: "text",
      description: "Button label text",
    },
  },
  args: {
    onClick: fn(),
    children: "Button",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: "primary",
    size: "md",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outlined</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button variants.",
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="default">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button leftIcon={<Icon name="action-check" />}>With Left Icon</Button>
      <Button rightIcon={<Icon name="nav-arrow-right" />}>
        With Right Icon
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Loading...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Full Width Button",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

// -----------------------------------------------------------------------------
// Accessibility Story
// -----------------------------------------------------------------------------

export const Accessibility: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3>Keyboard Navigation</h3>
      <p>Tab to focus, Enter/Space to activate</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button>First</Button>
        <Button>Second</Button>
        <Button disabled>Disabled (skipped)</Button>
        <Button>Third</Button>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      // Ensure no a11y violations
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
        ],
      },
    },
  },
};
```

### 7.2 Preview Configuration

```tsx
// packages/react/.storybook/preview.tsx

import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import "../src/tokens/tokens.css";
import "./preview.css";

const preview: Preview = {
  parameters: {
    // Actions
    actions: { argTypesRegex: "^on[A-Z].*" },

    // Controls
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Backgrounds
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#171717" },
        { name: "gray", value: "#f5f5f5" },
      ],
    },

    // Viewport
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "667px" } },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },

    // Docs theme
    docs: {
      theme: themes.light,
    },

    // Accessibility
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },

  // Global decorators
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      document.documentElement.setAttribute("data-kozmos-theme", theme);
      return <Story />;
    },
  ],

  // Global types (toolbar items)
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
```

---

## 8. Testing Patterns

### 8.1 Component Test with Accessibility

```tsx
// packages/react/src/components/Button/Button.test.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

describe("Button", () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders with children", () => {
      render(<Button>Click me</Button>);
      expect(
        screen.getByRole("button", { name: "Click me" }),
      ).toBeInTheDocument();
    });

    it.each([
      "primary",
      "secondary",
      "outlined",
      "ghost",
      "destructive",
    ] as const)("renders %s variant", (variant) => {
      render(<Button variant={variant}>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(`kozmos-btn`);
    });

    it.each(["sm", "md", "lg"] as const)("renders %s size", (size) => {
      render(<Button size={size}>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  describe("interactions", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await userEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>,
      );

      await userEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when loading", async () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} isLoading>
          Click me
        </Button>,
      );

      await userEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("can be focused with keyboard", async () => {
      render(<Button>Focus me</Button>);

      await userEvent.tab();

      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("can be activated with Enter key", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);

      await userEvent.tab();
      await userEvent.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("can be activated with Space key", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);

      await userEvent.tab();
      await userEvent.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  describe("states", () => {
    it("shows loading spinner when isLoading", () => {
      render(<Button isLoading>Loading</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("is disabled when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("is disabled when isLoading", () => {
      render(<Button isLoading>Loading</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<Button>Accessible Button</Button>);

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations when disabled", async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations when loading", async () => {
      const { container } = render(<Button isLoading>Loading Button</Button>);

      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it.each([
      "primary",
      "secondary",
      "outlined",
      "ghost",
      "destructive",
    ] as const)(
      "has no accessibility violations for %s variant",
      async (variant) => {
        const { container } = render(<Button variant={variant}>Button</Button>);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  describe("slots", () => {
    it("renders left icon", () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          With Icon
        </Button>,
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("renders right icon", () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">→</span>}>
          With Icon
        </Button>,
      );

      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });
});
```

### 8.2 Visual Regression Test

```tsx
// packages/react/src/components/Button/Button.visual.test.tsx

import { test, expect } from "@playwright/experimental-ct-react";
import { Button } from "./Button";

test.describe("Button Visual Regression", () => {
  test("default button", async ({ mount }) => {
    const component = await mount(<Button>Click me</Button>);
    await expect(component).toHaveScreenshot("button-default.png");
  });

  test("all variants", async ({ mount }) => {
    const component = await mount(
      <div style={{ display: "flex", gap: "8px" }}>
        <Button variant="default">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outlined</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>,
    );
    await expect(component).toHaveScreenshot("button-variants.png");
  });

  test("all sizes", async ({ mount }) => {
    const component = await mount(
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Button size="sm">Small</Button>
        <Button size="default">Medium</Button>
        <Button size="lg">Large</Button>
      </div>,
    );
    await expect(component).toHaveScreenshot("button-sizes.png");
  });

  test("states", async ({ mount }) => {
    const component = await mount(
      <div style={{ display: "flex", gap: "8px" }}>
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button isLoading>Loading</Button>
      </div>,
    );
    await expect(component).toHaveScreenshot("button-states.png");
  });

  test("hover state", async ({ mount }) => {
    const component = await mount(<Button>Hover me</Button>);
    await component.hover();
    await expect(component).toHaveScreenshot("button-hover.png");
  });

  test("focus state", async ({ mount }) => {
    const component = await mount(<Button>Focus me</Button>);
    await component.focus();
    await expect(component).toHaveScreenshot("button-focus.png");
  });
});
```

---

## 9. Code Connect Patterns

### 9.1 React Code Connect

```tsx
// packages/react/src/components/Button/Button.figma.tsx

import figma from "@figma/code-connect";
import { Button } from "./Button";

const FIGMA_URL = "https://www.figma.com/design/XXXXX/Kozmos?node-id=123:456";

figma.connect(Button, FIGMA_URL, {
  props: {
    // Text content
    children: figma.textContent("Label"),

    // Enum mappings
    variant: figma.enum("Variant", {
      Primary: "primary",
      Secondary: "secondary",
      Outlined: "outlined",
      Ghost: "ghost",
      Destructive: "destructive",
    }),
    size: figma.enum("Size", {
      Small: "sm",
      Medium: "md",
      Large: "lg",
    }),

    // Booleans
    disabled: figma.boolean("Disabled"),
    isLoading: figma.boolean("Loading"),
    fullWidth: figma.boolean("Full Width"),

    // Instance slots
    leftIcon: figma.instance("Leading Icon"),
    rightIcon: figma.instance("Trailing Icon"),
  },

  example: ({
    children,
    variant,
    size,
    disabled,
    isLoading,
    fullWidth,
    leftIcon,
    rightIcon,
  }) => (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      isLoading={isLoading}
      fullWidth={fullWidth}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
    >
      {children}
    </Button>
  ),
});

// Variant-specific connections for complex components
figma.connect(Button, `${FIGMA_URL}&variant=Icon%20Only`, {
  props: {
    icon: figma.instance("Icon"),
    variant: figma.enum("Variant", {
      Primary: "primary",
      Secondary: "secondary",
      Ghost: "ghost",
    }),
    size: figma.enum("Size", {
      Small: "sm",
      Medium: "md",
      Large: "lg",
    }),
  },
  example: ({ icon, variant, size }) => (
    <Button variant={variant} size={size} aria-label="Icon button">
      {icon}
    </Button>
  ),
});
```

### 9.2 SwiftUI Code Connect

```swift
// packages/ios/Sources/KozmosUI/Components/KozmosButton.figma.swift

import Figma
import SwiftUI

struct KozmosButton_Doc: FigmaConnect {
    let component = KozmosButton<Text>.self
    let figmaNodeUrl = "https://www.figma.com/design/XXXXX/Kozmos?node-id=123:456"

    // MARK: - Properties

    @FigmaString("Label")
    var label: String

    @FigmaEnum("Variant", mapping: [
        "Primary": KozmosButtonVariant.primary,
        "Secondary": KozmosButtonVariant.secondary,
        "Outlined": KozmosButtonVariant.outlined,
        "Ghost": KozmosButtonVariant.ghost,
        "Destructive": KozmosButtonVariant.destructive,
    ])
    var variant: KozmosButtonVariant

    @FigmaEnum("Size", mapping: [
        "Small": KozmosButtonSize.sm,
        "Medium": KozmosButtonSize.md,
        "Large": KozmosButtonSize.lg,
    ])
    var size: KozmosButtonSize

    @FigmaBoolean("Disabled")
    var isDisabled: Bool

    @FigmaBoolean("Loading")
    var isLoading: Bool

    @FigmaBoolean("Full Width")
    var fullWidth: Bool

    // MARK: - Example

    var body: some View {
        KozmosButton(
            label,
            variant: variant,
            size: size,
            isLoading: isLoading,
            isDisabled: isDisabled,
            fullWidth: fullWidth
        ) {
            // Action
        }
    }
}
```

### 9.3 Compose Code Connect

```kotlin
// packages/android/kozmos-ui/src/main/kotlin/components/KozmosButton.figma.kt

package com.pointr.kozmos.components

import com.figma.code.connect.*

@FigmaConnect(
    url = "https://www.figma.com/design/XXXXX/Kozmos?node-id=123:456"
)
@Composable
fun KozmosButtonDoc(
    @FigmaProperty("Label")
    label: String,

    @FigmaVariant("Variant")
    variant: String = Figma.mapping(
        "Primary" to "Primary",
        "Secondary" to "Secondary",
        "Outlined" to "Outlined",
        "Ghost" to "Ghost",
        "Destructive" to "Destructive",
    ),

    @FigmaVariant("Size")
    size: String = Figma.mapping(
        "Small" to "Sm",
        "Medium" to "Md",
        "Large" to "Lg",
    ),

    @FigmaBoolean("Disabled")
    enabled: Boolean = true,

    @FigmaBoolean("Loading")
    isLoading: Boolean = false,

    @FigmaBoolean("Full Width")
    fullWidth: Boolean = false,
) {
    KozmosButton(
        text = label,
        onClick = {},
        variant = KozmosButtonVariant.valueOf(variant),
        size = KozmosButtonSize.valueOf(size),
        enabled = enabled,
        isLoading = isLoading,
        fullWidth = fullWidth
    )
}
```

---

## 10. Icon Generation Patterns

### 10.1 SVG Optimization Script

```typescript
// packages/icons/scripts/optimize.ts

import { optimize, Config } from "svgo";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SVGO_CONFIG: Config = {
  multipass: true,
  plugins: [
    "preset-default",
    "removeDimensions",
    {
      name: "removeAttrs",
      params: {
        attrs: ["fill", "stroke"],
      },
    },
    {
      name: "addAttributesToSVGElement",
      params: {
        attributes: [{ fill: "currentColor" }, { "aria-hidden": "true" }],
      },
    },
  ],
};

async function optimizeSvgs() {
  const inputDir = join(__dirname, "../svg");
  const outputDir = join(__dirname, "../dist/optimized");

  await mkdir(outputDir, { recursive: true });

  const files = await readdir(inputDir);
  const svgFiles = files.filter((f) => f.endsWith(".svg"));

  for (const file of svgFiles) {
    const input = await readFile(join(inputDir, file), "utf8");
    const result = optimize(input, SVGO_CONFIG);

    if ("data" in result) {
      await writeFile(join(outputDir, file), result.data);
      console.log(`Optimized: ${file}`);
    }
  }
}

optimizeSvgs().catch(console.error);
```

### 10.2 React Icon Component Generator

```typescript
// packages/icons/scripts/generate-react.ts

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

async function generateReactIcons() {
  const inputDir = join(__dirname, "../dist/optimized");
  const outputDir = join(__dirname, "../dist/react");

  await mkdir(outputDir, { recursive: true });

  const files = await readdir(inputDir);
  const svgFiles = files.filter((f) => f.endsWith(".svg"));

  const exports: string[] = [];

  for (const file of svgFiles) {
    const name = basename(file, ".svg");
    const componentName = `Icon${toPascalCase(name)}`;
    const svgContent = await readFile(join(inputDir, file), "utf8");

    // Extract SVG content (remove outer <svg> tag attributes we'll add in React)
    const innerContent = svgContent
      .replace(/<svg[^>]*>/, "")
      .replace(/<\/svg>/, "")
      .trim();

    const component = `
import * as React from 'react';
import type { IconProps } from './types';

export const ${componentName}: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    className={className}
    aria-hidden="true"
    {...props}
  >
    ${innerContent}
  </svg>
);

${componentName}.displayName = '${componentName}';
`;

    await writeFile(join(outputDir, `${componentName}.tsx`), component.trim());
    exports.push(`export { ${componentName} } from './${componentName}';`);
  }

  // Generate index file
  const indexContent = `
// Auto-generated - DO NOT EDIT
${exports.join("\n")}
export type { IconProps } from './types';
`;

  await writeFile(join(outputDir, "index.ts"), indexContent.trim());

  // Generate types file
  const typesContent = `
import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}
`;

  await writeFile(join(outputDir, "types.ts"), typesContent.trim());

  console.log(`Generated ${svgFiles.length} React icon components`);
}

generateReactIcons().catch(console.error);
```

---

## Quick Reference

### File Naming Conventions

| File Type         | Convention                  | Example              |
| ----------------- | --------------------------- | -------------------- |
| React Component   | PascalCase                  | `Button.tsx`         |
| React Story       | PascalCase + `.stories`     | `Button.stories.tsx` |
| React Test        | PascalCase + `.test`        | `Button.test.tsx`    |
| Code Connect      | PascalCase + `.figma`       | `Button.figma.tsx`   |
| SwiftUI Component | `Kozmos` + PascalCase       | `KozmosButton.swift` |
| Compose Component | `Kozmos` + PascalCase       | `KozmosButton.kt`    |
| Token File        | kebab-case + `.tokens.json` | `colors.tokens.json` |
| CSS               | kebab-case                  | `tokens.css`         |

### Import Patterns

```tsx
// ✅ Correct - named imports
import { Button, Input } from "@kozmos/react";

// ✅ Correct - individual import (tree-shaking)
import { Button } from "@kozmos/react/Button";

// ✅ Correct - tokens
import { tokens } from "@kozmos/tokens";

// ❌ Wrong - default import
import Button from "@kozmos/react/Button";
```

---

_Last updated: 2025-02-07_
_Maintainer: Kozmos Design System Team_
