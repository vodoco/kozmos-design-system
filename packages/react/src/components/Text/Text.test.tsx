import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders correctly", () => {
    render(<Text>Sample Text</Text>);
    expect(screen.getByText("Sample Text")).toBeInTheDocument();
  });

  it("renders as paragraph by default", () => {
    const { container } = render(<Text>Content</Text>);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("renders as span when specified", () => {
    const { container } = render(<Text as="span">Content</Text>);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(
      <Text size="xl" weight="bold" color="primary">
        Content
      </Text>,
    );
    const el = container.firstChild;
    expect(el).toHaveClass("kozmos-text-xl");
    expect(el).toHaveClass("kozmos-text-bold");
    expect(el).toHaveClass("kozmos-text-primary");
  });

  it("takes the display size, bold from its own token unless a weight is given (decision 203)", () => {
    const { container, rerender } = render(<Text size="display">Hero</Text>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("kozmos-text-display");
    // No weight class: the size's own weight, bold, decides.
    expect(el.className).not.toMatch(
      /kozmos-text-(normal|medium|semibold|bold)\b/,
    );
    rerender(
      <Text size="display" weight="normal">
        Hero
      </Text>,
    );
    expect(container.firstChild).toHaveClass(
      "kozmos-text-display",
      "kozmos-text-normal",
    );
    // Every other size keeps its normal weight by default.
    rerender(<Text size="4xl">Hero</Text>);
    expect(container.firstChild).toHaveClass("kozmos-text-normal");
  });
});
