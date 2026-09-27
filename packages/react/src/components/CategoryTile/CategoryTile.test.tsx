import { fireEvent, render, screen } from "@testing-library/react";
import { ShoppingBag01 as ShoppingBag } from "@kozmos-ds/icons";
import { describe, expect, it, vi } from "vitest";
import { CategoryTile } from "./CategoryTile";

describe("CategoryTile", () => {
  it("exposes controlled selection and emits the category ID", () => {
    const onSelect = vi.fn();
    render(
      <CategoryTile
        category={{ id: "shopping", label: "Shopping", selected: true }}
        icon={<ShoppingBag />}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole("button", { name: "Shopping" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith("shopping");
  });

  it("prevents selection for unavailable categories", () => {
    const onSelect = vi.fn();
    render(
      <CategoryTile
        category={{
          id: "service",
          label: "Customer service",
          selected: false,
          disabled: true,
        }}
        icon={<ShoppingBag />}
        onSelect={onSelect}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Customer service" }),
    ).toBeDisabled();
  });

  it("draws the count as the system's counter at the square's top-right and speaks its label", () => {
    render(
      <CategoryTile
        category={{
          id: "gates",
          label: "Gates",
          selected: false,
          resultCount: 12,
          resultCountLabel: "12 places",
        }}
        icon={<svg />}
        onSelect={() => {}}
      />,
    );
    const counter = screen.getByText("12");
    expect(counter).toHaveAttribute("data-slot", "counter");
    // The counter: brand tone, the default 20 size, four beyond the square's
    // visible top and right edges (five from inside its 1px border).
    expect(counter).toHaveClass(
      "bg-primary",
      "h-5",
      "absolute",
      "-right-[5px]",
      "-top-[5px]",
    );
    expect(counter.parentElement).toHaveClass("relative", "h-16", "w-16");
    // The spoken form is the label, not a caption: it is there for assistive technology only.
    expect(screen.getByText("12 places")).toHaveClass("sr-only");
    expect(
      screen.getByRole("button", { name: /Gates.*12 places/ }),
    ).toBeInTheDocument();
  });

  it("takes its category's colour: the icon and the counter in the tint, the square neutral", () => {
    render(
      <CategoryTile
        category={{
          id: "dining",
          label: "Dining",
          selected: false,
          resultCount: 3,
          resultCountLabel: "3 places",
        }}
        icon={<svg />}
        onSelect={() => {}}
        tint={{
          accent: "var(--semantics-category-accent-red)",
          fill: "var(--semantics-category-fill-red)",
          onFill: "var(--semantics-category-on-fill-red)",
        }}
      />,
    );
    const counter = screen.getByText("3");
    const square = counter.parentElement as HTMLElement;
    expect(square.style.getPropertyValue("--kozmos-category-tint")).toBe(
      "var(--semantics-category-accent-red)",
    );
    expect(square.style.getPropertyValue("color")).toBe(
      "var(--kozmos-category-tint)",
    );
    expect(counter.style.getPropertyValue("background-color")).toBe(
      "var(--semantics-category-fill-red)",
    );
    expect(counter.style.getPropertyValue("color")).toBe(
      "var(--semantics-category-on-fill-red)",
    );
  });

  it("is the prototype's tile: a 64 icon square, radius Control, the label under it", () => {
    const { container } = render(
      <CategoryTile
        category={{ id: "food", label: "Food and drink", selected: false }}
        icon={<svg />}
        onSelect={() => {}}
      />,
    );
    const square = container.querySelector("[aria-hidden='true']");
    expect(square).toHaveClass("h-16", "w-16", "rounded-control", "border");
    expect(screen.getByText("Food and drink")).toHaveClass("line-clamp-2");
    expect(screen.getByRole("button")).toHaveClass("text-[11px]");
  });
});
