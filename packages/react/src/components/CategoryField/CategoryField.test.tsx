import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryField } from "./CategoryField";

describe("CategoryField", () => {
  it("names itself by the category and its count, and clears on the button", () => {
    const onClear = vi.fn();
    render(
      <CategoryField
        label="Gates"
        count={2}
        tint={{
          accent: "var(--semantics-category-accent-yellow)",
          fill: "var(--semantics-category-fill-yellow)",
          onFill: "var(--semantics-category-on-fill-yellow)",
        }}
        onClear={onClear}
        icon={<svg />}
      />,
    );
    const field = screen.getByRole("group", { name: "Gates, 2 places" });
    expect(field).toHaveClass("h-12", "rounded-control", "border");
    expect(field.style.getPropertyValue("--kozmos-category-tint")).toBe(
      "var(--semantics-category-accent-yellow)",
    );
    const pill = field.querySelector('[data-slot="counter"]') as HTMLElement;
    // The group already supplies the localized count. A second label on a
    // generic span is unsupported and risks a duplicate count announcement.
    expect(pill).toHaveAttribute("aria-hidden", "true");
    expect(pill).not.toHaveAttribute("aria-label");
    expect(pill.style.getPropertyValue("background")).toBe(
      "var(--semantics-category-fill-yellow)",
    );
    expect(pill.style.getPropertyValue("color")).toBe(
      "var(--semantics-category-on-fill-yellow)",
    );
    expect(pill).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: "Clear category" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("draws the name and the clear in the foreground, the colour on the icon, the border and the wash", () => {
    const { container } = render(
      <CategoryField
        label="Gates"
        tint={{
          accent: "var(--semantics-category-accent-yellow)",
          fill: "var(--semantics-category-fill-yellow)",
          onFill: "var(--semantics-category-on-fill-yellow)",
        }}
        onClear={() => undefined}
        icon={<svg data-testid="category-icon" />}
      />,
    );
    const field = screen.getByRole("group", { name: "Gates" });
    // The yellow name on its own 12 % wash read 1.77:1; the foreground reads
    // 19.4 (Olcay, 2026-09-21).
    expect(field).toHaveClass("text-foreground");
    expect(field.style.getPropertyValue("color")).toBe("");
    expect(field.style.getPropertyValue("border-color")).toBe(
      "var(--kozmos-category-tint)",
    );
    expect(field.style.getPropertyValue("background")).toContain(
      "var(--kozmos-category-tint) 12%",
    );
    const iconBox = screen.getByTestId("category-icon")
      .parentElement as HTMLElement;
    expect(iconBox).toHaveAttribute("aria-hidden", "true");
    expect(iconBox.style.getPropertyValue("color")).toBe(
      "var(--kozmos-category-tint)",
    );
    const clear = screen.getByRole("button", { name: "Clear category" });
    expect(clear).toHaveClass("text-current");
    expect(clear.style.getPropertyValue("color")).toBe("");
    expect(container.querySelector("[style*='--kozmos-category-tint']")).toBe(
      field,
    );
  });

  it("puts the 32 clear in a 44 hit area, as the search bar's", () => {
    render(<CategoryField label="Gates" onClear={() => undefined} />);
    const clear = screen.getByRole("button", { name: "Clear category" });
    // The button is the target, 44; the circle inside it is what shows, 32,
    // while Core IconButton now owns one focus ring around the target.
    expect(clear).toHaveClass("h-11", "w-11");
    expect(clear).toHaveClass("kozmos-button");
    const circle = clear.firstElementChild as HTMLElement;
    expect(circle).toHaveClass("h-8", "w-8", "rounded-pill");
    expect(circle).not.toHaveClass("group-focus-visible:ring-2");
    // The trailing padding gives back the 6 the target adds on each side, so
    // the circle stays 8 from the field's edge.
    expect(screen.getByRole("group", { name: "Gates" })).toHaveClass("pr-0.5");
  });

  it("shows no pill without a count", () => {
    render(<CategoryField label="Bookmarks" onClear={() => undefined} />);
    expect(
      screen.getByRole("group", { name: "Bookmarks" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/places/)).toBeNull();
  });
});
