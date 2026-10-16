import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Switch } from "./Switch";
import "@testing-library/jest-dom/vitest";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveClass("h-6", "w-11");
  });

  it("renders label with correct htmlFor association", () => {
    render(<Switch label="Enable notifications" />);
    const switchEl = screen.getByRole("switch");
    const label = screen.getByText("Enable notifications");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", switchEl.id);
  });

  it("renders error message with aria-describedby linkage", () => {
    render(<Switch error="Required field" />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-invalid", "true");
    expect(switchEl).toHaveAttribute("aria-describedby");

    const errorMessage = screen.getByText("Required field");
    expect(errorMessage).toBeInTheDocument();
    expect(switchEl.getAttribute("aria-describedby")).toBe(errorMessage.id);
  });

  it("renders boolean error without error text", () => {
    render(<Switch error={true} />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-invalid", "true");
    expect(switchEl).not.toHaveAttribute("aria-describedby");
  });

  it("renders error label styling", () => {
    render(<Switch label="Enable notifications" error />);
    expect(screen.getByRole("switch")).toHaveClass("border-destructive");
    expect(screen.getByText("Enable notifications")).toHaveClass(
      "text-destructive-text",
    );
  });

  it("keeps a caller's aria-describedby", () => {
    render(
      <>
        <p id="switch-hint">Sends a push when your gate changes</p>
        <Switch label="Gate alerts" aria-describedby="switch-hint" />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-describedby",
      "switch-hint",
    );
  });

  it("joins a caller's aria-describedby with its own error", () => {
    render(
      <>
        <p id="switch-hint">Sends a push when your gate changes</p>
        <Switch
          label="Gate alerts"
          aria-describedby="switch-hint"
          error="Turn this on to continue"
        />
      </>,
    );
    const ids = screen
      .getByRole("switch")
      .getAttribute("aria-describedby")
      ?.split(" ");
    const errorId = screen.getByText("Turn this on to continue").id;
    expect(ids).toEqual(["switch-hint", errorId]);
  });

  it("keeps a caller's aria-invalid when it sets no error", () => {
    render(<Switch label="Gate alerts" aria-invalid />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
  });
});
