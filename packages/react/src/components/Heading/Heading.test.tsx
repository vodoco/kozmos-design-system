import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Heading } from "./Heading";

describe("Heading", () => {
  it.each([
    [1, "4xl"],
    [2, "3xl"],
    [3, "2xl"],
    [4, "xl"],
    [5, "lg"],
    [6, "base"],
  ] as const)("preserves level %s typography and semantics", (level, size) => {
    render(<Heading level={level}>Scale</Heading>);
    expect(screen.getByRole("heading", { level })).toHaveClass(
      `kozmos-text-${size}`,
      "kozmos-text-bold",
    );
  });

  it("preserves the null-level base size and h1 fallback", () => {
    render(<Heading level={null}>Base heading</Heading>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "kozmos-text-base",
      "kozmos-text-bold",
    );
  });
  it("renders correctly", () => {
    render(<Heading level={1}>Title</Heading>);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Title").tagName).toBe("H1");
  });

  it("renders correct levels", () => {
    const { container } = render(<Heading level={3}>Subtitle</Heading>);
    expect(container.querySelector("h3")).toBeInTheDocument();
  });

  it("uses owned typography while preserving semantic tag overrides", () => {
    render(
      <Heading level={2} as="h3" className="consumer-title">
        Owned heading
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass(
      "kozmos-text-3xl",
      "kozmos-text-bold",
      "consumer-title",
    );
  });

  it("takes the display size and keeps its level as its rank (decision 203)", () => {
    render(
      <Heading level={1} size="display">
        Digitize your building like never before.
      </Heading>,
    );
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Digitize your building like never before.",
    });
    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveClass("kozmos-text-display", "kozmos-text-bold");
    expect(heading).not.toHaveClass("kozmos-text-4xl");
  });
});
