import { fireEvent, render, screen } from "@testing-library/react";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIResultList, type POIResultListItem } from "./POIResultList";

const createItem = (id: string, index: number): POIResultListItem => {
  const poi: POIPresentation = {
    id,
    name: id === "one" ? "Baskin-Robbins" : "Burger King",
    floorId: "2",
    floorLabel: "Second floor",
    media: [],
    actions: ["navigate"],
  };
  return {
    poi,
    result: {
      poiId: id,
      resultIndex: index,
      selected: false,
      featured: false,
      floorId: "2",
    },
  };
};

describe("POIResultList", () => {
  it("controls one selected result and emits its stable ID", () => {
    const onSelect = vi.fn();
    render(
      <POIResultList
        items={[createItem("one", 1), createItem("two", 2)]}
        onSelect={onSelect}
        resultCountLabel="2 results"
        selectedPoiId="two"
      />,
    );

    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Baskin-Robbins/i }));
    expect(onSelect).toHaveBeenCalledWith("one");
    expect(screen.getByText("2 results")).toHaveClass("sr-only");
  });

  it("forwards a result's action to the caller", () => {
    // Without this the action row draws in a list and does nothing when
    // pressed: the card is never used on its own in a product.
    const onAction = vi.fn();
    const item = createItem("one", 0);
    render(
      <POIResultList
        items={[
          {
            ...item,
            result: {
              ...item.result,
              selected: true,
              actions: [
                { action: "navigate" as const, label: "Go", primary: true },
                { action: "details" as const, label: "Details" },
              ],
            },
          },
        ]}
        onAction={onAction}
        onSelect={vi.fn()}
        resultCountLabel="1 result"
        selectedPoiId="one"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onAction).toHaveBeenCalledWith("navigate", "one");
  });

  it("draws a group inline, and still decides which member is selected", () => {
    // Olcay: the group is a container INSIDE the results list, holding the
    // same items. A grouped result must highlight the way an ungrouped one
    // does, or the list and the map disagree.
    const a = createItem("one", 0);
    const b = createItem("two", 1);
    render(
      <POIResultList
        items={[
          { id: "starbucks", label: "Starbucks, 2 results", items: [a, b] },
          createItem("three", 2),
        ]}
        onSelect={vi.fn()}
        resultCountLabel="3 results"
        selectedPoiId="two"
      />,
    );

    // Collapsed: the representative plus the ungrouped row.
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Show 1 more/ })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Show 1 more/ }));
    // The selected member is the one the list was told about, inside the group.
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });

  it("renders a directed empty state", () => {
    render(
      <POIResultList
        emptyState="Try removing a filter."
        items={[]}
        onSelect={() => undefined}
        resultCountLabel="No results"
      />,
    );

    expect(screen.getByText("Try removing a filter.")).toBeVisible();
  });
});
