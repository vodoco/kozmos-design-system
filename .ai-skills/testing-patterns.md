# Kozmos Design System - Testing Patterns Guide

> **Purpose:** This document provides comprehensive testing patterns and examples for all platforms in the Kozmos Design System.

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

### Testing Pyramid

```
           /\
          /  \        E2E Tests (5%)
         /----\       - Critical user flows
        /      \      - Cross-browser
       /--------\     Integration Tests (15%)
      /          \    - Component interactions
     /------------\   - API integration
    /              \  Unit Tests (80%)
   /----------------\ - Component behavior
  /                  \- Utility functions
```

### Test Requirements by Component Maturity

| Maturity | Unit Tests | A11y Tests | Visual Tests | Integration |
| -------- | ---------- | ---------- | ------------ | ----------- |
| Alpha    | Optional   | Required   | Optional     | Optional    |
| Beta     | Required   | Required   | Required     | Optional    |
| Stable   | Required   | Required   | Required     | Required    |

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

```typescript
// packages/react/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.stories.tsx",
        "**/*.figma.tsx",
      ],
    },
  },
});
```

### Test Setup File

```typescript
// packages/react/src/test/setup.ts
import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { axe, toHaveNoViolations } from "jest-axe";

// Extend Vitest's expect
expect.extend(matchers);
expect.extend(toHaveNoViolations);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

### Test Utilities

```typescript
// packages/react/src/test/utils.tsx
import * as React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';

interface WrapperProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  return (
    <ThemeProvider defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Button Component Tests

```typescript
// packages/react/src/components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button', () => {
  // =========================================================================
  // Rendering
  // =========================================================================

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders as a button element by default', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Click</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('spreads additional props to button', () => {
      render(<Button data-testid="custom-button">Click</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Variants
  // =========================================================================

  describe('Variants', () => {
    it.each(['solid', 'outline', 'ghost', 'link'] as const)(
      'renders %s variant',
      (variant) => {
        render(<Button variant={variant}>Click</Button>);
        expect(screen.getByRole('button')).toHaveClass(`kozmos-button--${variant}`);
      }
    );

    it.each(['sm', 'md', 'lg'] as const)(
      'renders %s size',
      (size) => {
        render(<Button size={size}>Click</Button>);
        expect(screen.getByRole('button')).toHaveClass(`kozmos-button--${size}`);
      }
    );

    it('applies default variant and size', () => {
      render(<Button>Click</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('kozmos-button--solid');
      expect(button).toHaveClass('kozmos-button--md');
    });
  });

  // =========================================================================
  // Interactions
  // =========================================================================

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} loading>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // States
  // =========================================================================

  describe('States', () => {
    it('shows disabled state', () => {
      render(<Button disabled>Click</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state with spinner', () => {
      render(<Button loading>Click</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('hides text when loading', () => {
      render(<Button loading>Click</Button>);
      expect(screen.getByText('Click')).toHaveClass('kozmos-button__text--hidden');
    });

    it('is disabled when loading', () => {
      render(<Button loading>Click</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations when disabled', async () => {
      const { container } = render(<Button disabled>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations when loading', async () => {
      const { container } = render(<Button loading>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Submit form">→</Button>);
      expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help">Click</Button>
          <span id="help">This button submits the form</span>
        </>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'help');
    });
  });

  // =========================================================================
  // Type Attribute
  // =========================================================================

  describe('Type Attribute', () => {
    it('defaults to type="button"', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('supports type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('supports type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  // =========================================================================
  // Polymorphism (if supported)
  // =========================================================================

  describe('Polymorphism', () => {
    it('renders as anchor when asChild with Link', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('kozmos-button');
    });
  });
});
```

### Input Component Tests

```typescript
// packages/react/src/components/Input/Input.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from './Input';

describe('Input', () => {
  describe('Controlled Input', () => {
    it('renders with controlled value', () => {
      render(<Input value="test" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('test');
    });

    it('calls onChange with new value', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input value="" onChange={handleChange} />);
      await user.type(screen.getByRole('textbox'), 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange.mock.calls[0][0].target.value).toBe('h');
    });
  });

  describe('Uncontrolled Input', () => {
    it('renders with defaultValue', () => {
      render(<Input defaultValue="default" />);
      expect(screen.getByRole('textbox')).toHaveValue('default');
    });

    it('updates value on user input', async () => {
      const user = userEvent.setup();

      render(<Input defaultValue="" />);
      await user.type(screen.getByRole('textbox'), 'typed');

      expect(screen.getByRole('textbox')).toHaveValue('typed');
    });
  });

  describe('Validation', () => {
    it('shows error state', () => {
      render(<Input invalid errorMessage="This field is required" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('associates error message with input', () => {
      render(<Input invalid errorMessage="Error" id="test-input" />);

      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(screen.getByText('Error')).toHaveAttribute('id', errorId);
    });
  });

  describe('Accessibility', () => {
    it('has no violations', async () => {
      const { container } = render(<Input aria-label="Test input" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with label', async () => {
      const { container } = render(
        <>
          <label htmlFor="input">Name</label>
          <Input id="input" />
        </>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations in error state', async () => {
      const { container } = render(
        <Input aria-label="Test" invalid errorMessage="Error" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

### Modal Component Tests

```typescript
// packages/react/src/components/Modal/Modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from './Modal';

describe('Modal', () => {
  describe('Opening and Closing', () => {
    it('renders when open', () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test Modal</Modal.Title>
          </Modal.Content>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <Modal open={false} onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test Modal</Modal.Title>
          </Modal.Content>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close button clicked', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <Modal.Close>Close</Modal.Close>
          </Modal.Content>
        </Modal>
      );

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes on Escape key', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
          </Modal.Content>
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes on overlay click', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
          </Modal.Content>
        </Modal>
      );

      // Click the overlay (outside the content)
      const overlay = document.querySelector('.kozmos-modal__overlay');
      if (overlay) await user.click(overlay);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <button>First</button>
            <button>Second</button>
          </Modal.Content>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      });
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <button>First</button>
            <button>Last</button>
          </Modal.Content>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      });

      // Tab to last button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();

      // Tab should wrap to first
      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      });
    });

    it('returns focus to trigger after close', async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <Modal open={open} onOpenChange={setOpen}>
              <Modal.Content>
                <Modal.Title>Test</Modal.Title>
                <Modal.Close>Close</Modal.Close>
              </Modal.Content>
            </Modal>
          </>
        );
      }

      render(<TestComponent />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no violations', async () => {
      const { container } = render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Accessible Modal</Modal.Title>
            <Modal.Description>This is the description</Modal.Description>
          </Modal.Content>
        </Modal>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <Modal.Description>Description</Modal.Description>
          </Modal.Content>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });
});
```

---

## 3. iOS Testing

### Test Setup

```swift
// packages/ios/Tests/KozmosSwiftUITests/TestHelpers.swift
import XCTest
import SwiftUI
import ViewInspector
@testable import KozmosSwiftUI

extension Inspection: InspectionEmissary {}

final class TestHelpers {
    static func render<V: View>(_ view: V) -> V {
        return view
    }

    static func snapshot<V: View>(_ view: V, named name: String) {
        // Snapshot testing implementation
    }
}
```

### Button Tests (Swift)

```swift
// packages/ios/Tests/KozmosSwiftUITests/Components/ButtonTests.swift
import XCTest
import SwiftUI
import ViewInspector
@testable import KozmosSwiftUI

final class KozmosButtonTests: XCTestCase {

    // MARK: - Rendering

    func testRendersWithLabel() throws {
        let sut = KozmosButton("Click me") {}

        let text = try sut.inspect().find(text: "Click me")
        XCTAssertNotNil(text)
    }

    func testRendersVariants() throws {
        let variants: [ButtonVariant] = [.solid, .outline, .ghost]

        for variant in variants {
            let sut = KozmosButton("Test", variant: variant) {}
            // Verify variant-specific styling
            XCTAssertNotNil(sut)
        }
    }

    func testRendersSizes() throws {
        let sizes: [ButtonSize] = [.sm, .md, .lg]

        for size in sizes {
            let sut = KozmosButton("Test", size: size) {}
            XCTAssertNotNil(sut)
        }
    }

    // MARK: - Interactions

    func testCallsActionOnTap() throws {
        var tapped = false
        let sut = KozmosButton("Tap me") {
            tapped = true
        }

        try sut.inspect().button().tap()
        XCTAssertTrue(tapped)
    }

    func testDisabledStatePreventsTap() throws {
        var tapped = false
        let sut = KozmosButton("Tap me") {
            tapped = true
        }
        .disabled(true)

        // Verify button is disabled
        let button = try sut.inspect().button()
        XCTAssertTrue(try button.isDisabled())
    }

    // MARK: - Loading State

    func testShowsLoadingIndicator() throws {
        let sut = KozmosButton("Submit") {}
            .loading(true)

        let progressView = try sut.inspect().find(ViewType.ProgressView.self)
        XCTAssertNotNil(progressView)
    }

    func testHidesLabelWhenLoading() throws {
        let sut = KozmosButton("Submit") {}
            .loading(true)

        // Label should be hidden but still accessible
        let text = try? sut.inspect().find(text: "Submit")
        // Verify opacity is 0 or similar
    }

    // MARK: - Accessibility

    func testAccessibilityLabel() throws {
        let sut = KozmosButton("Submit form") {}

        let button = try sut.inspect().button()
        let label = try button.accessibilityLabel().string()
        XCTAssertEqual(label, "Submit form")
    }

    func testAccessibilityHint() throws {
        let sut = KozmosButton("Delete") {}
            .accessibilityHint("Double tap to delete item")

        let button = try sut.inspect().button()
        let hint = try button.accessibilityHint().string()
        XCTAssertEqual(hint, "Double tap to delete item")
    }

    // MARK: - Snapshot Tests

    func testSnapshotDefault() {
        let sut = KozmosButton("Default Button") {}
        assertSnapshot(matching: sut, as: .image)
    }

    func testSnapshotAllVariants() {
        let variants: [(ButtonVariant, String)] = [
            (.solid, "Solid"),
            (.outline, "Outline"),
            (.ghost, "Ghost"),
        ]

        for (variant, name) in variants {
            let sut = KozmosButton(name, variant: variant) {}
            assertSnapshot(matching: sut, as: .image, named: "Button_\(name)")
        }
    }
}
```

---

## 4. Android Testing

### Test Setup

```kotlin
// packages/android/kozmos/src/test/kotlin/com/kozmos/compose/TestHelpers.kt
package com.kozmos.compose

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.*
import org.junit.Rule

abstract class ComposeTest {
    @get:Rule
    val composeTestRule = createComposeRule()
}
```

### Button Tests (Kotlin)

```kotlin
// packages/android/kozmos/src/test/kotlin/com/kozmos/compose/components/ButtonTest.kt
package com.kozmos.compose.components

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.kozmos.compose.ComposeTest
import org.junit.Rule
import org.junit.Test

class KozmosButtonTest : ComposeTest() {

    // =========================================================================
    // Rendering
    // =========================================================================

    @Test
    fun rendersWithText() {
        composeTestRule.setContent {
            KozmosButton(text = "Click me", onClick = {})
        }

        composeTestRule
            .onNodeWithText("Click me")
            .assertIsDisplayed()
    }

    @Test
    fun rendersAllVariants() {
        val variants = listOf(
            ButtonVariant.Solid,
            ButtonVariant.Outline,
            ButtonVariant.Ghost
        )

        variants.forEach { variant ->
            composeTestRule.setContent {
                KozmosButton(
                    text = "Test",
                    variant = variant,
                    onClick = {}
                )
            }

            composeTestRule
                .onNodeWithText("Test")
                .assertIsDisplayed()
        }
    }

    @Test
    fun rendersAllSizes() {
        val sizes = listOf(ButtonSize.Sm, ButtonSize.Md, ButtonSize.Lg)

        sizes.forEach { size ->
            composeTestRule.setContent {
                KozmosButton(
                    text = "Test",
                    size = size,
                    onClick = {}
                )
            }

            composeTestRule
                .onNodeWithText("Test")
                .assertIsDisplayed()
        }
    }

    // =========================================================================
    // Interactions
    // =========================================================================

    @Test
    fun callsOnClickWhenTapped() {
        var clicked = false

        composeTestRule.setContent {
            KozmosButton(
                text = "Click me",
                onClick = { clicked = true }
            )
        }

        composeTestRule
            .onNodeWithText("Click me")
            .performClick()

        assert(clicked)
    }

    @Test
    fun doesNotCallOnClickWhenDisabled() {
        var clicked = false

        composeTestRule.setContent {
            KozmosButton(
                text = "Click me",
                enabled = false,
                onClick = { clicked = true }
            )
        }

        composeTestRule
            .onNodeWithText("Click me")
            .performClick()

        assert(!clicked)
    }

    @Test
    fun doesNotCallOnClickWhenLoading() {
        var clicked = false

        composeTestRule.setContent {
            KozmosButton(
                text = "Click me",
                loading = true,
                onClick = { clicked = true }
            )
        }

        composeTestRule
            .onNodeWithContentDescription("Loading")
            .assertIsDisplayed()

        // Button should not be clickable
        assert(!clicked)
    }

    // =========================================================================
    // States
    // =========================================================================

    @Test
    fun showsDisabledState() {
        composeTestRule.setContent {
            KozmosButton(
                text = "Disabled",
                enabled = false,
                onClick = {}
            )
        }

        composeTestRule
            .onNodeWithText("Disabled")
            .assertIsNotEnabled()
    }

    @Test
    fun showsLoadingIndicator() {
        composeTestRule.setContent {
            KozmosButton(
                text = "Loading",
                loading = true,
                onClick = {}
            )
        }

        composeTestRule
            .onNodeWithContentDescription("Loading")
            .assertIsDisplayed()
    }

    // =========================================================================
    // Accessibility
    // =========================================================================

    @Test
    fun hasCorrectSemantics() {
        composeTestRule.setContent {
            KozmosButton(
                text = "Submit Form",
                onClick = {}
            )
        }

        composeTestRule
            .onNodeWithText("Submit Form")
            .assertHasClickAction()
            .assert(hasContentDescription("Submit Form"))
    }

    @Test
    fun announcesLoadingState() {
        composeTestRule.setContent {
            KozmosButton(
                text = "Submit",
                loading = true,
                onClick = {}
            )
        }

        composeTestRule
            .onNode(hasContentDescription("Loading"))
            .assertIsDisplayed()
    }
}
```

---

## 5. React Native Testing

### Test Setup

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

### Setup File

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

### Button Tests (React Native)

```typescript
// packages/react-native/src/components/Button/Button.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders children text', () => {
      render(<Button>Press me</Button>);
      expect(screen.getByText('Press me')).toBeTruthy();
    });

    it('renders with testID', () => {
      render(<Button testID="test-button">Press</Button>);
      expect(screen.getByTestId('test-button')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress}>Press</Button>);

      fireEvent.press(screen.getByText('Press'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress} disabled>Press</Button>);

      fireEvent.press(screen.getByText('Press'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress} loading>Press</Button>);

      // Loading indicator should be visible
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      render(<Button>Press</Button>);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('is accessible when disabled', () => {
      render(<Button disabled>Press</Button>);
      expect(screen.getByRole('button')).toHaveAccessibilityState({ disabled: true });
    });

    it('announces loading state', () => {
      render(<Button loading accessibilityLabel="Submit">Submit</Button>);
      expect(screen.getByLabelText('Submit')).toHaveAccessibilityState({ busy: true });
    });
  });

  describe('Haptic Feedback', () => {
    it('triggers haptic feedback on press', () => {
      const hapticMock = jest.fn();
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Vibration: { vibrate: hapticMock },
      }));

      render(<Button haptic>Press</Button>);
      fireEvent.press(screen.getByText('Press'));

      // Verify haptic was triggered
    });
  });
});
```

---

## 6. Vue Testing

### Test Setup

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

### Web Component Tests

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

```typescript
// packages/react/src/test/a11y.ts
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

export async function checkA11y(container: HTMLElement) {
  const results = await axe(container, {
    rules: {
      // Customize rules as needed
      "color-contrast": { enabled: true },
      label: { enabled: true },
    },
  });

  expect(results).toHaveNoViolations();
}
```

### Automated A11y Tests for All Components

```typescript
// packages/react/src/test/a11y.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import * as Components from '../index';

const componentTestCases = [
  { name: 'Button', component: <Components.Button>Click</Components.Button> },
  { name: 'Input', component: <Components.Input aria-label="Test input" /> },
  { name: 'Checkbox', component: <Components.Checkbox label="Accept terms" /> },
  { name: 'Select', component: <Components.Select aria-label="Choose" options={[]} /> },
  // Add all components...
];

describe('Accessibility', () => {
  componentTestCases.forEach(({ name, component }) => {
    it(`${name} has no accessibility violations`, async () => {
      const { container } = render(component);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

---

## 9. Performance Testing

### Bundle Size Tests

```typescript
// scripts/test-bundle-size.ts
import { readFileSync } from "fs";
import { gzipSync } from "zlib";

const BUDGETS = {
  "@kozmos/react": 80 * 1024, // 80KB
  "@kozmos/tokens": 8 * 1024, // 8KB
};

function getGzipSize(filePath: string): number {
  const content = readFileSync(filePath);
  return gzipSync(content).length;
}

function testBundleSize(packageName: string, bundlePath: string) {
  const size = getGzipSize(bundlePath);
  const budget = BUDGETS[packageName];

  if (size > budget) {
    console.error(
      `❌ ${packageName}: ${(size / 1024).toFixed(2)}KB exceeds budget of ${(budget / 1024).toFixed(2)}KB`,
    );
    process.exit(1);
  }

  console.log(
    `✅ ${packageName}: ${(size / 1024).toFixed(2)}KB (budget: ${(budget / 1024).toFixed(2)}KB)`,
  );
}

testBundleSize("@kozmos/react", "packages/react/dist/index.js");
testBundleSize("@kozmos/tokens", "packages/tokens/build/js/tokens.js");
```

### Render Performance Tests

```typescript
// packages/react/src/test/performance.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../components/Button';

describe('Performance', () => {
  it('Button renders within 1ms', () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(<Button>Click</Button>);
      unmount();
    }

    const duration = performance.now() - start;
    const perRender = duration / iterations;

    console.log(`Button render: ${perRender.toFixed(2)}ms`);
    expect(perRender).toBeLessThan(1);
  });

  it('Form with 20 inputs renders within 50ms', () => {
    const start = performance.now();

    render(
      <form>
        {Array.from({ length: 20 }, (_, i) => (
          <Input key={i} label={`Field ${i}`} />
        ))}
      </form>
    );

    const duration = performance.now() - start;

    console.log(`Form render: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50);
  });
});
```

---

## 10. CI Integration

### Where the Tests Run

There is no `test.yml`: the tests run in `.github/workflows/ci.yml`
([ci-cd-configuration.md](./ci-cd-configuration.md)).

- **`Web Build & Test`:** `pnpm test` (Vitest, React's suite with its `vitest-axe` checks), and the
  built-library checks in Chromium, Firefox and WebKit.
- **Twelve browser shards:** the Storybook suites against the built Storybook, one browser each.
- **`Core Pipeline & POI Gallery`:** React's Playwright tests and the Storybook regressions.
- **`iOS Build`:** `swift test` in `packages/ios` and the POI render tests on a simulator.
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
Component.test.tsx     # Unit tests
Component.a11y.test.tsx # A11y-specific tests
Component.perf.test.tsx # Performance tests
```

---

## Version History

| Version | Date       | Changes                        |
| ------- | ---------- | ------------------------------ |
| 1.0.0   | 2026-02-07 | Initial testing patterns guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
