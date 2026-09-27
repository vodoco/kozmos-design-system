import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Text } from "./Text";
import { SearchBar } from "../SearchBar";
import { NavigationItem } from "../NavigationItem";
import { CategoryTile } from "../CategoryTile";
import { POIResultCard } from "../POIResultCard";

/**
 * Story 2 reads this interface in Arabic and Japanese. These are the six places
 * that pinned text to a physical edge, hard-coded an English control name, or
 * broke a word that should not break — asserted together because they are one
 * concern and would otherwise be six lonely tests nobody connects.
 */
describe("language and accessibility", () => {
  it("aligns Text from the start, not the left", () => {
    // The default matters more than the option: almost nothing passes align,
    // so whatever it defaults to is what an Arabic interface gets.
    const { container, rerender } = render(<Text>body</Text>);
    expect(container.querySelector(".kozmos-text-start")).not.toBeNull();
    expect(container.querySelector(".kozmos-text-left")).toBeNull();

    // left stays available for the rare thing that means LEFT in any language.
    rerender(<Text align="left">body</Text>);
    expect(container.querySelector(".kozmos-text-left")).not.toBeNull();
  });

  it("lets a product name the search clear button", () => {
    const { rerender } = render(
      <SearchBar onChange={vi.fn()} value="coffee" />,
    );
    expect(screen.getByRole("button", { name: "Clear search" })).toBeVisible();

    rerender(
      <SearchBar clearLabel="Aramayı temizle" onChange={vi.fn()} value="coffee" />,
    );
    expect(
      screen.getByRole("button", { name: "Aramayı temizle" }),
    ).toBeVisible();
  });

  it("uses logical margins in the search field", () => {
    // me-2/ms-1 sit after and before in either direction; mr-2/ml-1 always sit
    // right and left, which is the wrong side of an Arabic field.
    const { container } = render(<SearchBar onChange={vi.fn()} value="x" />);
    expect(container.innerHTML).not.toMatch(/\bmr-2\b|\bml-1\b/);
    expect(container.innerHTML).toMatch(/\bme-2\b/);
  });

  it("wraps a rail label over two lines instead of truncating it", () => {
    // "Overvi…" loses the word; two lines shorten nothing.
    const { container, rerender } = render(
      <NavigationItem label="SDK Configuration" placement="rail" />,
    );
    const rail = container.querySelector(".line-clamp-2");
    expect(rail).not.toBeNull();
    expect(rail?.className).not.toMatch(/truncate/);

    // A side row is wide, so one truncated line is still the right compromise.
    rerender(<NavigationItem label="SDK Configuration" placement="side" />);
    expect(container.querySelector(".truncate")).not.toBeNull();
  });

  it("aligns a result row from the start", () => {
    const { container } = render(
      <POIResultCard
        poi={{ id: "p", name: "Cafe", floorLabel: "Level 2", media: [], actions: [] }}
        result={{ poiId: "p", resultIndex: 0, selected: false, featured: false }}
        onSelect={vi.fn()}
      />,
    );
    const row = container.querySelector("button");
    expect(row?.className).toMatch(/text-start/);
    expect(row?.className).not.toMatch(/text-left/);
  });

  it("does not break a CJK category name mid-word", () => {
    // line-clamp alone splits レストラン across lines as two words that do not
    // exist.
    const { container } = render(
      <CategoryTile
        category={{ id: "c", label: "レストラン", selected: false }}
        icon={<svg />}
        onSelect={vi.fn()}
      />,
    );
    const label = container.querySelector(".line-clamp-2");
    expect(label?.className).toMatch(/keep-all/);
    expect(label?.className).toMatch(/break-words/);
  });
});
