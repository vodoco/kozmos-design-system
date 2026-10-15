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
// A click with its own count and time, as a browser stamps them.
const pressAt = (detail: number, timeStamp: number) => {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    detail,
  });
  Object.defineProperty(event, "timeStamp", { value: timeStamp });
  return event;
};
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

  it("selects, not opens, when the first click of a double click landed elsewhere", () => {
    // A browser counts clicks by time and place, not by element: a first
    // click that moves the list (a group's "Show more") can put another
    // result under the pointer for the second, which arrives as detail 2.
    const { onSelect, onOpen, button } = setup();
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Tessel Shoes/ })[0],
      {
        detail: 1,
      },
    );
    fireEvent.click(button(/Tessel Shoes Outlet/), { detail: 2 });
    expect(onOpen).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenLastCalledWith("shoes-2");
    fireEvent.click(button(/Bean & Leaf Café/), { detail: 2 });
    expect(onOpen).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenLastCalledWith("cafe");
  });

  it("selects, not opens, when this result's own first press is long past", () => {
    // Select a result, then minutes later double-click something above it
    // that moves it under the pointer: the second click arrives on it as
    // detail 2, but its own press was another gesture.
    const { onSelect, onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    fireEvent(cafe, pressAt(1, 1_000));
    fireEvent(cafe, pressAt(2, 121_000));
    expect(onOpen).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("ignores a third quick tap on a touch browser, as SwiftUI and Compose do", () => {
    const { onSelect, onOpen, button } = setup();
    const cafe = button(/Bean & Leaf Café/);
    for (const at of [1_000, 1_150, 1_300]) fireEvent(cafe, pressAt(1, at));
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
