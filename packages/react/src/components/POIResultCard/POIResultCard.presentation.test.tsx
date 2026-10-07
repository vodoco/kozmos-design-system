import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard } from "./POIResultCard";
import { POIResultGroup } from "../POIResultGroup";
import type {
  POIPresentation,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";

const poi: POIPresentation = {
  id: "bakery",
  name: "Northfield Artisan Bakery and Coffee Roastery",
  media: [],
  actions: ["navigate"],
};
const result: POIResultPresentation = {
  poiId: poi.id,
  resultIndex: 1234,
  selected: true,
  featured: true,
  actions: [{ action: "navigate", label: "Go", primary: true }],
};

describe("SDK result presentation", () => {
  it("defaults to SDK and offers an explicit legacy migration path", () => {
    const { container, rerender } = render(
      <POIResultCard poi={poi} result={result} onSelect={vi.fn()} numbered />,
    );
    expect(screen.getByRole("article")).toHaveAttribute(
      "data-presentation-style",
      "sdk",
    );
    expect(container.querySelector("[data-tab=featured]")).toHaveTextContent(
      "1234Featured",
    );
    rerender(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={vi.fn()}
        numbered
        presentationStyle="legacy"
      />,
    );
    expect(screen.getByRole("article")).toHaveClass("ring-2");
    expect(container.querySelector("[data-tab=featured]")).toHaveTextContent(
      /^Featured$/,
    );
  });
  it("combines the original index and Featured with a decorative star, without offsetting the name", () => {
    const { container } = render(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={vi.fn()}
        numbered
        presentationStyle="sdk"
      />,
    );
    const tab = container.querySelector("[data-tab=featured]")!;
    expect(tab.closest("button")).toBe(
      screen.getByRole("button", { current: "location" }),
    );
    expect(tab.textContent).toMatch(/1234\s*Featured/);
    expect(tab.querySelectorAll("svg")).toHaveLength(1);
    expect(tab.textContent).not.toMatch(/[—·]/);
    expect(
      screen.getByRole("button", { current: "location" }),
    ).toHaveAccessibleName(`1234, Featured, ${poi.name}`);
    expect(container.querySelector("[data-placement=inline]")).toBeNull();
    expect(screen.getByRole("article")).not.toHaveClass("ring-2");
  });

  it("keeps an Alternative label beside its number and honors a custom accessible name", () => {
    const { container } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, featured: false, badge: { label: "Alternative" } }}
        onSelect={vi.fn()}
        numbered
        presentationStyle="sdk"
        selectionLabel="Choose bakery 1234"
      />,
    );
    expect(container.querySelector("[data-tab=badge]")?.textContent).toMatch(
      /1234\s*Alternative/,
    );
    expect(
      screen.getByRole("button", { name: "Choose bakery 1234" }),
    ).toBeVisible();
  });

  it("gives Go a decorative navigation icon without changing its name or selecting the card", () => {
    const onSelect = vi.fn();
    const onAction = vi.fn();
    render(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={onSelect}
        onAction={onAction}
        presentationStyle="sdk"
      />,
    );
    const go = screen.getByRole("button", { name: "Go" });
    expect(go.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    fireEvent.click(go);
    expect(onAction).toHaveBeenCalledWith("navigate", poi.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("forwards presentation to every grouped row and keeps group selection independent from disclosure", () => {
    const onSelect = vi.fn();
    render(
      <POIResultGroup
        presentationStyle="sdk"
        numbered
        onSelect={onSelect}
        items={[
          { poi, result },
          {
            poi: { ...poi, id: "second" },
            result: {
              ...result,
              poiId: "second",
              featured: false,
              selected: false,
              resultIndex: 9876,
            },
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Show 1 more/ }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    for (const card of screen.getAllByRole("article")) {
      expect(card).toHaveAttribute("data-presentation-style", "sdk");
      expect(card.querySelector('[data-placement="inline"]')).toBeNull();
    }
    expect(
      within(screen.getAllByRole("article")[1]).getByText("9876"),
    ).toBeVisible();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
