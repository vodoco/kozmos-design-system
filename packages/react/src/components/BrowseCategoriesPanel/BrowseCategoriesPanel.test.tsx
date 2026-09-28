import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("tops up only its first row to what a map shell's panel leaves above it", () => {
    // Decision 14: hosted at the top of AdaptiveMapShell's panel, the first
    // row — the search row, or the tiles when there is none — tops its 16 up
    // to what the panel leaves (owned CSS, measured in
    // scripts/check-adaptive-edge-cases.mjs). The tiles under a search row
    // sit under that row and keep their 16, which a `pt-4` would outrank.
    const panel = (search?: ReactNode) =>
      render(
        <BrowseCategoriesPanel
          categories={[{ id: "gates", label: "Gates", selected: false }]}
          onSelect={() => undefined}
          renderIcon={() => <svg />}
          search={search}
        />,
      ).container.querySelector("section")!;
    const firstRow = "kozmos-browse-categories-first-row";

    const withSearch = panel(<input aria-label="Search places" />);
    const [header, tiles] = Array.from(withSearch.children);
    expect(header.tagName).toBe("HEADER");
    expect(header.classList.contains(firstRow)).toBe(true);
    expect(header.className).not.toMatch(/\b(p|pt|py)-/);
    expect(tiles.classList.contains(firstRow)).toBe(false);
    expect(tiles.className).toMatch(/\bpt-4\b/);

    cleanup();
    const alone = panel();
    expect(alone.children).toHaveLength(1);
    expect(alone.firstElementChild!.classList.contains(firstRow)).toBe(true);
    expect(alone.firstElementChild!.className).not.toMatch(/\b(p|pt|py)-/);
  });

  it("paints its fill through the class a map shell's panel can turn off", () => {
    // Decision 43: hosted in AdaptiveMapShell's panel, whose surface is the
    // one surface, the browser paints no fill (owned CSS reads the shell's
    // --kozmos-panel-part-fill; measured in check-adaptive-edge-cases.mjs).
    // Its fill is that class's alone: a `bg-background` beside it would
    // outrank it and paint the block back.
    const section = render(
      <BrowseCategoriesPanel
        categories={[{ id: "gates", label: "Gates", selected: false }]}
        onSelect={() => undefined}
        renderIcon={() => <svg />}
      />,
    ).container.querySelector("section")!;
    expect(section.classList.contains("kozmos-browse-categories")).toBe(true);
    expect(section.className).not.toMatch(/(^|\s)bg-/);
    expect(section.className).toMatch(/\btext-foreground\b/);
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

  it("draws its empty state muted through the class a glass surface turns to ink", () => {
    // Decision 48: on glass, text that is muted elsewhere takes the
    // foreground colour; the empty state's box is see-through, so its text
    // sits on the glass. A `text-muted-foreground` beside the class would
    // outrank it.
    render(
      <BrowseCategoriesPanel
        categories={[]}
        emptyState="No categories are available on this floor."
        onSelect={() => undefined}
        renderIcon={() => null}
      />,
    );
    const box = screen.getByText("No categories are available on this floor.");
    expect(box.classList.contains("kozmos-muted-text")).toBe(true);
    expect(box.className).not.toMatch(/\btext-muted-foreground\b/);
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
