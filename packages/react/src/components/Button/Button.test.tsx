import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button, BUTTON_EMOTIONS } from "./Button";

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
