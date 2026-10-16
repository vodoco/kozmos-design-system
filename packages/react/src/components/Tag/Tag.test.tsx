import { render, screen, fireEvent } from "@testing-library/react";
import { Tag } from "./Tag";
import { describe, it, expect, vi } from "vitest";

describe("Tag", () => {
  it("renders correctly", () => {
    render(<Tag>Test Tag</Tag>);
    expect(screen.getByText("Test Tag")).toBeInTheDocument();
  });

  it("handles remove click", () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Removable</Tag>);
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(handleRemove).toHaveBeenCalled();
  });

  it("names its remove button in English by default", () => {
    render(<Tag onRemove={() => undefined}>Vegan</Tag>);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("names its remove button with the product's own words", () => {
    const handleRemove = vi.fn();
    render(
      <Tag onRemove={handleRemove} removeLabel="Vegan entfernen">
        Vegan
      </Tag>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Vegan entfernen" }));
    expect(handleRemove).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("marks its remove button for the owned target", () => {
    // The target is a pseudo-element in owned CSS (check-direction-rules.mjs
    // measures it in a browser); the class is what this asserts.
    render(<Tag onRemove={() => undefined}>Vegan</Tag>);
    expect(screen.getByRole("button", { name: "Remove" })).toHaveClass(
      "kozmos-tag-remove",
    );
  });

  describe("emotion", () => {
    it("leaves the variant untouched when it is not set", () => {
      const { container } = render(<Tag variant="secondary">Draft</Tag>);
      const tag = container.firstElementChild as HTMLElement;
      expect(tag.style.getPropertyValue("--kz-emotion-surface")).toBe("");
      expect(tag).toHaveClass("bg-secondary");
    });

    it("fills with the emotion's own pair", () => {
      const { container } = render(<Tag emotion="success">Open</Tag>);
      const tag = container.firstElementChild as HTMLElement;
      expect(tag.style.getPropertyValue("--kz-emotion-surface")).toBe(
        "var(--semantics-emotion-success-surface)",
      );
      expect(tag.style.getPropertyValue("--kz-emotion-on-surface")).toBe(
        "var(--semantics-emotion-success-on-surface)",
      );
      expect(tag).toHaveClass("bg-[var(--kz-emotion-surface)]");
    });

    it("reads as text and an edge when the variant is outline", () => {
      const { container } = render(
        <Tag emotion="danger" variant="outline">
          Closed
        </Tag>,
      );
      const tag = container.firstElementChild as HTMLElement;
      expect(tag).toHaveClass("text-[var(--kz-emotion-text)]");
      expect(tag).not.toHaveClass("bg-[var(--kz-emotion-surface)]");
    });

    it("lets the caller's own style win", () => {
      const { container } = render(
        <Tag emotion="alert" style={{ "--kz-emotion-surface": "red" } as never}>
          Late
        </Tag>,
      );
      const tag = container.firstElementChild as HTMLElement;
      expect(tag.style.getPropertyValue("--kz-emotion-surface")).toBe("red");
    });
  });
});
