import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Button, BUTTON_EMOTIONS, buttonVariants } from "./Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("renders loading state correctly", () => {
    render(
      <Button disabled={undefined} isLoading>
        Loading...
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards the native button ref and click event", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn((event) =>
      expect(event.currentTarget).toBe(ref.current),
    );
    render(
      <Button ref={ref} type="button" onClick={onClick}>
        Click me
      </Button>,
    );
    const button = screen.getByRole("button", { name: /click me/i });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([{ disabled: true }, { isLoading: true }])(
    "prevents activation when unavailable: %j",
    (state) => {
      const onClick = vi.fn();
      render(
        <Button {...state} onClick={onClick}>
          Unavailable
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  describe("subtle", () => {
    // buttonVariants is public, for links: its subtle class must carry the
    // tier's colours itself, as Button sets none with no emotion given
    // (check-theme-fill reads them drawn on a link).
    it("draws through buttonVariants alone: its class sets the tier's properties", () => {
      const css = fs.readFileSync(
        path.resolve(
          __dirname,
          "../../../../styles/src/styles/owned-components.css",
        ),
        "utf8",
      );
      const rule = css.match(/\.kozmos-button-subtle\s*\{([^}]*)\}/)?.[1];
      expect(rule).toBeDefined();
      for (const [property, token] of [
        ["--kz-button-bg", "background-idle"],
        ["--kz-button-bg-hover", "background-hover"],
        ["--kz-button-bg-focus", "background-focus"],
        ["--kz-button-bg-pressed", "background-pressed"],
        ["--kz-button-fg", "foreground-content-idle"],
        ["--kz-button-fg-hover", "foreground-content-hover"],
        ["--kz-button-fg-focus", "foreground-content-focus"],
        ["--kz-button-fg-pressed", "foreground-content-pressed"],
      ])
        expect(rule!.replace(/\s+/g, "")).toContain(
          `${property}:var(--components-subtle-buttons-themed-button-${token})`,
        );
      expect(buttonVariants({ variant: "subtle" })).toContain(
        "kozmos-button-subtle",
      );
    });

    // GAP-200: "+ Add additional field" is one Kozmos Button, a pale theme
    // fill under theme words, with no wrapper. With no emotion its class
    // draws it, as buttonVariants does on a link: no inline colour.
    it("is its own variant, drawn by its class with no emotion given", () => {
      render(<Button variant="subtle">+ Add additional field</Button>);
      const button = screen.getByRole("button", {
        name: "+ Add additional field",
      });
      expect(button.className).toContain("kozmos-button-subtle");
      expect(button.className).not.toContain("kozmos-button-default");
      expect(button.className).not.toContain("kozmos-button-emotion-filled");
      expect(button.getAttribute("style")).toBeNull();
    });

    it("lets a caller's own style win over the subtle tier's", () => {
      render(
        <Button
          variant="subtle"
          style={{ "--kz-button-bg": "red" } as React.CSSProperties}
        >
          Override
        </Button>,
      );
      expect(
        screen.getByRole("button").style.getPropertyValue("--kz-button-bg"),
      ).toBe("red");
    });

    it("fills its row through a class, as every Button does", () => {
      render(
        <Button variant="subtle" className="w-full">
          + Add additional field
        </Button>,
      );
      expect(screen.getByRole("button")).toHaveClass(
        "kozmos-button-subtle",
        "w-full",
      );
    });
  });

  describe("emotion", () => {
    it("changes nothing when it is not set", () => {
      render(<Button>Plain</Button>);
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-bg")).toBe("");
      expect(button.className).toContain("kozmos-button-default");
    });

    it.each(BUTTON_EMOTIONS)("points the filled tier at %s", (emotion) => {
      render(<Button emotion={emotion}>Save</Button>);
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-bg")).toBe(
        `var(--components-primary-buttons-${emotion}-button-background-idle)`,
      );
      expect(button.style.getPropertyValue("--kz-button-fg")).toBe(
        `var(--components-primary-buttons-${emotion}-button-foreground-content-idle)`,
      );
      expect(button.className).toContain("kozmos-button-emotion-filled");
    });

    // Pressed and focused, a filled emotion reads its own tokens, so the
    // default variant's themed pressed and focus rules never show through.
    it.each(BUTTON_EMOTIONS)("gives %s its pressed and focus", (emotion) => {
      render(<Button emotion={emotion}>Save</Button>);
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-bg-pressed")).toBe(
        `var(--components-primary-buttons-${emotion}-button-background-pressed)`,
      );
      expect(button.style.getPropertyValue("--kz-button-bg-focus")).toBe(
        `var(--components-primary-buttons-${emotion}-button-background-focus)`,
      );
    });

    it("reads the secondary tier for a bordered variant", () => {
      render(
        <Button variant="outline" emotion="success">
          Confirm
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-fg")).toBe(
        "var(--components-secondary-buttons-success-button-foreground-content-idle)",
      );
      expect(button.className).toContain("kozmos-button-emotion-outline");
    });

    it("reads the secondary tier for a text variant", () => {
      render(
        <Button variant="ghost" emotion="alert">
          Warn
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-fg")).toBe(
        "var(--components-secondary-buttons-alert-button-foreground-content-idle)",
      );
      expect(button.className).toContain("kozmos-button-emotion-text");
    });

    it("leaves glass alone, because it is an effect and not a weight", () => {
      render(
        <Button variant="glass" emotion="danger">
          Glass
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-bg")).toBe("");
      expect(button.className).toContain("glass");
    });

    it("lets an emotion override what destructive hard-codes", () => {
      render(
        <Button variant="destructive" emotion="informative">
          Reclassified
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button.style.getPropertyValue("--kz-button-bg")).toBe(
        "var(--components-primary-buttons-informative-button-background-idle)",
      );
    });

    // The subtle variant (GAP-200, decision 135) is a fill of its own tier,
    // so an emotion on it reads the Subtle Buttons tokens, not the Primary
    // ones, through the filled treatment: decision 139's destructive tone is
    // `variant="subtle" emotion="danger"`.
    it.each(BUTTON_EMOTIONS)(
      "reads the subtle tier for a subtle %s",
      (emotion) => {
        render(
          <Button variant="subtle" emotion={emotion}>
            Add field
          </Button>,
        );
        const button = screen.getByRole("button");
        const prefix = `--components-subtle-buttons-${emotion}-button`;
        expect(button.style.getPropertyValue("--kz-button-bg")).toBe(
          `var(${prefix}-background-idle)`,
        );
        expect(button.style.getPropertyValue("--kz-button-bg-hover")).toBe(
          `var(${prefix}-background-hover)`,
        );
        expect(button.style.getPropertyValue("--kz-button-bg-pressed")).toBe(
          `var(${prefix}-background-pressed)`,
        );
        expect(button.className).toContain("kozmos-button-subtle");
        expect(button.className).toContain("kozmos-button-emotion-filled");
      },
    );

    // The subtle tier's words step with its fill, so the filled treatment
    // is told the words of every state, not only at rest and hovered.
    it.each([
      ["subtle", "subtle"],
      ["default", "primary"],
    ] as const)(
      "gives a %s emotion its words in every state",
      (variant, tier) => {
        render(
          <Button variant={variant} emotion="danger">
            Delete feature
          </Button>,
        );
        const button = screen.getByRole("button");
        const prefix = `--components-${tier}-buttons-danger-button-foreground-content`;
        for (const [property, state] of [
          ["--kz-button-fg", "idle"],
          ["--kz-button-fg-hover", "hover"],
          ["--kz-button-fg-focus", "focus"],
          ["--kz-button-fg-pressed", "pressed"],
        ])
          expect(button.style.getPropertyValue(property)).toBe(
            `var(${prefix}-${state})`,
          );
      },
    );

    it("lets a caller's own style win", () => {
      render(
        <Button
          emotion="success"
          style={{ "--kz-button-bg": "red" } as React.CSSProperties}
        >
          Override
        </Button>,
      );
      expect(
        screen.getByRole("button").style.getPropertyValue("--kz-button-bg"),
      ).toBe("red");
    });
  });
});
