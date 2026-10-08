import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Counter, formatCounterValue } from "./Counter";

describe("Counter", () => {
  it("renders numeric content", () => {
    render(<Counter>12</Counter>);
    expect(screen.getByText("12")).toHaveAttribute("data-slot", "counter");
  });

  it("supports tone and size variants", () => {
    render(
      <Counter tone="brand" size="sm">
        4
      </Counter>,
    );

    expect(screen.getByText("4")).toHaveClass(
      "h-[18px]",
      "bg-theme-fill",
      "text-theme-fill-foreground",
    );
  });

  it("normalizes legacy parenthesized values", () => {
    render(<Counter>(8)</Counter>);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.queryByText("(8)")).not.toBeInTheDocument();
  });

  it("keeps non-text children unchanged", () => {
    const child = <span data-testid="custom-counter">99+</span>;
    expect(formatCounterValue(child)).toBe(child);
  });

  describe("emotion", () => {
    it("leaves the tone untouched when it is not set", () => {
      render(<Counter tone="brand">7</Counter>);
      const counter = screen.getByText("7");
      expect(counter.style.getPropertyValue("--kz-emotion-surface")).toBe("");
      expect(counter).toHaveClass("bg-theme-fill");
    });

    it("fills with the emotion's own pair", () => {
      render(<Counter emotion="informative">12</Counter>);
      const counter = screen.getByText("12");
      expect(counter.style.getPropertyValue("--kz-emotion-surface")).toBe(
        "var(--semantics-emotion-informative-surface)",
      );
      expect(counter).toHaveClass("text-[var(--kz-emotion-on-surface)]");
    });

    it("keeps its own className alongside the emotion", () => {
      render(
        <Counter className="ml-2" emotion="danger">
          3
        </Counter>,
      );
      expect(screen.getByText("3")).toHaveClass("ml-2");
    });
  });
});
