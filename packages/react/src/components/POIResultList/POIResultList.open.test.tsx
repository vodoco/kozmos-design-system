import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { POIResultList } from "./POIResultList";

// Decision 72 (GAP-143): a double tap on a result opens its details, once,
// and the second tap is not a second selection.
const poi = (id: string, name: string): POIPresentation => ({
  id,
  name,
  media: [],
  actions: [],
});
const result = (poiId: string, resultIndex: number) => ({
  poiId,
  resultIndex,
  selected: false,
  featured: false,
});
const items = [
  { poi: poi("cafe", "Bean & Leaf Café"), result: result("cafe", 0) },
  {
    id: "shoes",
    label: "Tessel Shoes, 2 results",
    items: [
      { poi: poi("shoes-1", "Tessel Shoes"), result: result("shoes-1", 1) },
      {
        poi: poi("shoes-2", "Tessel Shoes Outlet"),
        result: result("shoes-2", 2),
      },
    ],
    defaultExpanded: true,
  },
];
const setup = (withOpen = true) => {
  const onSelect = vi.fn();
  const onOpen = vi.fn();
  render(
    <POIResultList
      items={items}
      onOpen={withOpen ? onOpen : undefined}
      onSelect={onSelect}
      resultCountLabel="3 results"
    />,
  );
  const button = (name: RegExp) => screen.getByRole("button", { name });
  return { onSelect, onOpen, button };
};

describe("POIResultList onOpen", () => {
  it("opens on a double click: one selection, then one open", () => {
    const { onSelect, onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    fireEvent.click(cafe, { detail: 1 });
    fireEvent.click(cafe, { detail: 2 });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("cafe");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("cafe");
  });

  it("opens on two quick taps a touch browser counts as one each", () => {
    const { onSelect, onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    fireEvent.click(cafe, { detail: 1 });
    fireEvent.click(cafe, { detail: 1 });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("opens once on a triple click", () => {
    const { onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    for (const detail of [1, 2, 3]) fireEvent.click(cafe, { detail });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("opens a group's member", () => {
    const { onSelect, onOpen, button } = setup();
    const outlet = button(/Tessel Shoes Outlet/);
    fireEvent.click(outlet, { detail: 1 });
    fireEvent.click(outlet, { detail: 2 });
    expect(onSelect).toHaveBeenCalledWith("shoes-2");
    expect(onOpen).toHaveBeenCalledWith("shoes-2");
  });

  it("always selects from the keyboard", () => {
    const { onSelect, onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    fireEvent.click(cafe, { detail: 0 });
    fireEvent.click(cafe, { detail: 0 });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("selects on every tap without onOpen, as before", () => {
    const { onSelect, button } = setup(false);
    const cafe = button(/Bean & Leaf Café/);
    fireEvent.click(cafe, { detail: 1 });
    fireEvent.click(cafe, { detail: 2 });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
