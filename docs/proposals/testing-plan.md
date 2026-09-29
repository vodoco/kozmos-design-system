# Proposal: not built — the planned test suites

> **Proposal: not built.** These are the tests, setup and helpers written before the code. None of
> their files exists: there is no `src/test/utils.tsx`, `src/test/a11y.ts`, `a11y.test.tsx`,
> `performance.test.tsx` or `scripts/test-bundle-size.ts`, and no Modal. The examples use
> `jest-axe`, which Kozmos does not install (its tests use `vitest-axe`), render budgets nothing
> measures, and bundle budgets that are not the real ones. The native tests do not match the code
> either: SwiftUI's module is `Kozmos`, not `KozmosSwiftUI`, and its tests are in
> `packages/ios/Tests/KozmosTests`; Compose's tests are Paparazzi snapshots in
> `com.kozmos.components.<name>`, not `com.kozmos.compose`, and no Compose UI test rule is
> installed. It is kept as planning history; the sections below were in
> `.ai-skills/testing-patterns.md` until 2026-09-29.

## Proposal: from `.ai-skills/testing-patterns.md`

These sections were in [`testing-patterns.md`](../../.ai-skills/testing-patterns.md), where each heading now says what is built instead.

#### Proposal: Testing Pyramid

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

#### Proposal: Test Requirements by Component Maturity

| Maturity | Unit Tests | A11y Tests | Visual Tests | Integration |
| -------- | ---------- | ---------- | ------------ | ----------- |
| Alpha    | Optional   | Required   | Optional     | Optional    |
| Beta     | Required   | Required   | Required     | Optional    |
| Stable   | Required   | Required   | Required     | Required    |

#### Proposal: Setup

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

#### Proposal: Test Setup File

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

#### Proposal: Test Utilities

```tsx
// packages/react/src/test/utils.tsx
import * as React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "../theme/ThemeProvider";

interface WrapperProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  return <ThemeProvider defaultTheme="light">{children}</ThemeProvider>;
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
```

#### Proposal: Button Component Tests

```tsx
// packages/react/src/components/Button/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "./Button";

describe("Button", () => {
  // =========================================================================
  // Rendering
  // =========================================================================

  describe("Rendering", () => {
    it("renders children correctly", () => {
      render(<Button>Click me</Button>);
      expect(
        screen.getByRole("button", { name: "Click me" }),
      ).toBeInTheDocument();
    });

    it("renders as a button element by default", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("forwards ref to button element", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Click</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("spreads additional props to button", () => {
      render(<Button data-testid="custom-button">Click</Button>);
      expect(screen.getByTestId("custom-button")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Variants
  // =========================================================================

  describe("Variants", () => {
    it.each(["solid", "outline", "ghost", "link"] as const)(
      "renders %s variant",
      (variant) => {
        render(<Button variant={variant}>Click</Button>);
        expect(screen.getByRole("button")).toHaveClass(
          `kozmos-button--${variant}`,
        );
      },
    );

    it.each(["sm", "md", "lg"] as const)("renders %s size", (size) => {
      render(<Button size={size}>Click</Button>);
      expect(screen.getByRole("button")).toHaveClass(`kozmos-button--${size}`);
    });

    it("applies default variant and size", () => {
      render(<Button>Click</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("kozmos-button--solid");
      expect(button).toHaveClass("kozmos-button--md");
    });
  });

  // =========================================================================
  // Interactions
  // =========================================================================

  describe("Interactions", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Click
        </Button>,
      );
      await user.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when loading", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} loading>
          Click
        </Button>,
      );
      await user.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("supports keyboard navigation", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole("button");

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // States
  // =========================================================================

  describe("States", () => {
    it("shows disabled state", () => {
      render(<Button disabled>Click</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows loading state with spinner", () => {
      render(<Button loading>Click</Button>);
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("hides text when loading", () => {
      render(<Button loading>Click</Button>);
      expect(screen.getByText("Click")).toHaveClass(
        "kozmos-button__text--hidden",
      );
    });

    it("is disabled when loading", () => {
      render(<Button loading>Click</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  describe("Accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<Button>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations when disabled", async () => {
      const { container } = render(<Button disabled>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations when loading", async () => {
      const { container } = render(<Button loading>Click</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("supports aria-label", () => {
      render(<Button aria-label="Submit form">→</Button>);
      expect(
        screen.getByRole("button", { name: "Submit form" }),
      ).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <Button aria-describedby="help">Click</Button>
          <span id="help">This button submits the form</span>
        </>,
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-describedby",
        "help",
      );
    });
  });

  // =========================================================================
  // Type Attribute
  // =========================================================================

  describe("Type Attribute", () => {
    it('defaults to type="button"', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it('supports type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it('supports type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "reset");
    });
  });

  // =========================================================================
  // Polymorphism (if supported)
  // =========================================================================

  describe("Polymorphism", () => {
    it("renders as anchor when asChild with Link", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );

      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveClass("kozmos-button");
    });
  });
});
```

#### Proposal: Input Component Tests

```tsx
// packages/react/src/components/Input/Input.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Input } from "./Input";

describe("Input", () => {
  describe("Controlled Input", () => {
    it("renders with controlled value", () => {
      render(<Input value="test" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("test");
    });

    it("calls onChange with new value", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input value="" onChange={handleChange} />);
      await user.type(screen.getByRole("textbox"), "hello");

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange.mock.calls[0][0].target.value).toBe("h");
    });
  });

  describe("Uncontrolled Input", () => {
    it("renders with defaultValue", () => {
      render(<Input defaultValue="default" />);
      expect(screen.getByRole("textbox")).toHaveValue("default");
    });

    it("updates value on user input", async () => {
      const user = userEvent.setup();

      render(<Input defaultValue="" />);
      await user.type(screen.getByRole("textbox"), "typed");

      expect(screen.getByRole("textbox")).toHaveValue("typed");
    });
  });

  describe("Validation", () => {
    it("shows error state", () => {
      render(<Input invalid errorMessage="This field is required" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("associates error message with input", () => {
      render(<Input invalid errorMessage="Error" id="test-input" />);

      const input = screen.getByRole("textbox");
      const errorId = input.getAttribute("aria-describedby");
      expect(screen.getByText("Error")).toHaveAttribute("id", errorId);
    });
  });

  describe("Accessibility", () => {
    it("has no violations", async () => {
      const { container } = render(<Input aria-label="Test input" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations with label", async () => {
      const { container } = render(
        <>
          <label htmlFor="input">Name</label>
          <Input id="input" />
        </>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations in error state", async () => {
      const { container } = render(
        <Input aria-label="Test" invalid errorMessage="Error" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

#### Proposal: Modal Component Tests

```tsx
// packages/react/src/components/Modal/Modal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Modal } from "./Modal";

describe("Modal", () => {
  describe("Opening and Closing", () => {
    it("renders when open", () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test Modal</Modal.Title>
          </Modal.Content>
        </Modal>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(
        <Modal open={false} onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test Modal</Modal.Title>
          </Modal.Content>
        </Modal>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onOpenChange when close button clicked", async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <Modal.Close>Close</Modal.Close>
          </Modal.Content>
        </Modal>,
      );

      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("closes on Escape key", async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
          </Modal.Content>
        </Modal>,
      );

      await user.keyboard("{Escape}");
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("closes on overlay click", async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={handleOpenChange}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
          </Modal.Content>
        </Modal>,
      );

      // Click the overlay (outside the content)
      const overlay = document.querySelector(".kozmos-modal__overlay");
      if (overlay) await user.click(overlay);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Focus Management", () => {
    it("focuses first focusable element when opened", async () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <button>First</button>
            <button>Second</button>
          </Modal.Content>
        </Modal>,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
      });
    });

    it("traps focus within modal", async () => {
      const user = userEvent.setup();

      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <button>First</button>
            <button>Last</button>
          </Modal.Content>
        </Modal>,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
      });

      // Tab to last button
      await user.tab();
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();

      // Tab should wrap to first
      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
      });
    });

    it("returns focus to trigger after close", async () => {
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

      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Close" }));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe("Accessibility", () => {
    it("has no violations", async () => {
      const { container } = render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Accessible Modal</Modal.Title>
            <Modal.Description>This is the description</Modal.Description>
          </Modal.Content>
        </Modal>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has correct ARIA attributes", () => {
      render(
        <Modal open onOpenChange={() => {}}>
          <Modal.Content>
            <Modal.Title>Test</Modal.Title>
            <Modal.Description>Description</Modal.Description>
          </Modal.Content>
        </Modal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby");
      expect(dialog).toHaveAttribute("aria-describedby");
    });
  });
});
```

### Proposal: 3. iOS Testing

#### Proposal: Test Setup

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

#### Proposal: Button Tests (Swift)

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

### Proposal: 4. Android Testing

#### Proposal: Test Setup

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

#### Proposal: Button Tests (Kotlin)

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

#### Proposal: axe-core Integration

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

#### Proposal: Automated A11y Tests for All Components

```tsx
// packages/react/src/test/a11y.test.tsx
import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import * as Components from "../index";

const componentTestCases = [
  { name: "Button", component: <Components.Button>Click</Components.Button> },
  { name: "Input", component: <Components.Input aria-label="Test input" /> },
  { name: "Checkbox", component: <Components.Checkbox label="Accept terms" /> },
  {
    name: "Select",
    component: <Components.Select aria-label="Choose" options={[]} />,
  },
  // Add all components...
];

describe("Accessibility", () => {
  componentTestCases.forEach(({ name, component }) => {
    it(`${name} has no accessibility violations`, async () => {
      const { container } = render(component);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

#### Proposal: Bundle Size Tests

```typescript
// scripts/test-bundle-size.ts
import { readFileSync } from "fs";
import { gzipSync } from "zlib";

const BUDGETS = {
  "@kozmos-ds/react": 80 * 1024, // 80KB
  "@kozmos-ds/tokens": 8 * 1024, // 8KB
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

testBundleSize("@kozmos-ds/react", "packages/react/dist/index.js");
testBundleSize("@kozmos-ds/tokens", "packages/tokens/build/js/tokens.js");
```

#### Proposal: Render Performance Tests

```tsx
// packages/react/src/test/performance.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "../components/Button";

describe("Performance", () => {
  it("Button renders within 1ms", () => {
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

  it("Form with 20 inputs renders within 50ms", () => {
    const start = performance.now();

    render(
      <form>
        {Array.from({ length: 20 }, (_, i) => (
          <Input key={i} label={`Field ${i}`} />
        ))}
      </form>,
    );

    const duration = performance.now() - start;

    console.log(`Form render: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50);
  });
});
```

#### Proposal: Test File Naming

```
Component.test.tsx     # Unit tests
Component.a11y.test.tsx # A11y-specific tests
Component.perf.test.tsx # Performance tests
```
