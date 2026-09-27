import { fireEvent, render, screen } from "@testing-library/react";
import { Heart, ShoppingBag01 as ShoppingBag } from "@kozmos-ds/icons";
import { describe, expect, it, vi } from "vitest";
import { BrowseCategoriesPanel } from "./BrowseCategoriesPanel";

describe("BrowseCategoriesPanel", () => {
  it("keeps search, actions, and category controls in a predictable order", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <BrowseCategoriesPanel
        actions={<button type="button">Filters</button>}
        categories={[
          { id: "favourites", label: "Favourites", selected: false },
          { id: "shopping", label: "Shopping", selected: true },
        ]}
        onSelect={onSelect}
        renderIcon={(category) =>
          category.id === "shopping" ? <ShoppingBag /> : <Heart />
        }
        search={<input aria-label="Search places" />}
      />,
    );

    const controls = Array.from(container.querySelectorAll("input, button"));
    expect(
      controls.map(
        (control) => control.getAttribute("aria-label") ?? control.textContent,
      ),
    ).toEqual(["Search places", "Filters", "Favourites", "Shopping"]);
    fireEvent.click(screen.getByRole("button", { name: "Shopping" }));
    expect(onSelect).toHaveBeenCalledWith("shopping");
  });

  it("renders a directed empty state", () => {
    render(
      <BrowseCategoriesPanel
        categories={[]}
        emptyState="No categories are available on this floor."
        onSelect={() => undefined}
        renderIcon={() => null}
      />,
    );
    expect(
      screen.getByText("No categories are available on this floor."),
    ).toBeVisible();
  });

  it("passes a category's colours to its tile", () => {
    render(
      <BrowseCategoriesPanel
        categories={[
          { id: "dining", label: "Dining", selected: false, resultCount: 3 },
        ]}
        onSelect={() => {}}
        renderIcon={() => <svg />}
        tint={() => ({
          accent: "var(--semantics-category-accent-red)",
          fill: "var(--semantics-category-fill-red)",
          onFill: "var(--semantics-category-on-fill-red)",
        })}
      />,
    );
    const counter = screen.getByText("3");
    expect(counter.style.getPropertyValue("background-color")).toBe(
      "var(--semantics-category-fill-red)",
    );
    expect(
      (counter.parentElement as HTMLElement).style.getPropertyValue(
        "--kozmos-category-tint",
      ),
    ).toBe("var(--semantics-category-accent-red)");
  });
});
