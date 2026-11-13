import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Container } from "./Container";

describe("Container", () => {
  it("renders content", () => {
    render(<Container>Content</Container>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies max-width by default", () => {
    const { container } = render(<Container>Content</Container>);
    expect(container.firstChild).toHaveClass("max-w-7xl");
    expect(container.firstChild).toHaveClass("mx-auto");
  });

  it("does not apply max-width when centered is false", () => {
    const { container } = render(
      <Container centered={false}>Content</Container>,
    );
    expect(container.firstChild).not.toHaveClass("max-w-7xl");
    expect(container.firstChild).not.toHaveClass("mx-auto");
  });

  // GAP-116: the block (top and bottom) inset.
  it("pads no top or bottom without block, as before", () => {
    const { container } = render(<Container>Content</Container>);
    const classes = (container.firstChild as HTMLElement).className;
    expect(classes).not.toMatch(/\bp[tby]-/);
  });

  it.each([
    ["sm", "pt-4", "pb-4"],
    ["md", "pt-6", "pb-6"],
    ["lg", "pt-8", "pb-8"],
  ] as const)(
    'block="%s" pads the top and the bottom alike',
    (block, top, bottom) => {
      const { container } = render(
        <Container block={block}>Content</Container>,
      );
      expect(container.firstChild).toHaveClass(top, bottom);
    },
  );

  it('block="none" pads neither', () => {
    const { container } = render(<Container block="none">Content</Container>);
    expect((container.firstChild as HTMLElement).className).not.toMatch(
      /\bp[tby]-/,
    );
  });

  it("block={{ start, end }} pads the top and the bottom apart", () => {
    const { container } = render(
      <Container block={{ start: "lg", end: "md" }}>Content</Container>,
    );
    expect(container.firstChild).toHaveClass("pt-8", "pb-6");
    expect(container.firstChild).not.toHaveClass("pt-6", "pb-8");
  });

  it("an edge left out of block={{ ... }} takes none", () => {
    const { container } = render(
      <Container block={{ start: "sm" }}>Content</Container>,
    );
    expect(container.firstChild).toHaveClass("pt-4");
    expect((container.firstChild as HTMLElement).className).not.toMatch(
      /\bpb-/,
    );
  });

  it("keeps its side padding with a block inset, in a panel too", () => {
    const { container } = render(
      <Container inset="panel" block="sm">
        Content
      </Container>,
    );
    expect(container.firstChild).toHaveClass("px-4", "pt-4", "pb-4");
  });

  it("a caller's own top padding wins over the block step", () => {
    const { container } = render(
      <Container block="lg" className="pt-2">
        Content
      </Container>,
    );
    expect(container.firstChild).toHaveClass("pt-2", "pb-8");
    expect(container.firstChild).not.toHaveClass("pt-8");
  });
});
