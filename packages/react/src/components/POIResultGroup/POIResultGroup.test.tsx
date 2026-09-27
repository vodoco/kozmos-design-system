import { fireEvent, render, screen } from "@testing-library/react";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIResultGroup, type POIResultGroupItem } from "./POIResultGroup";

const branch = (id: string, floorLabel: string): POIResultGroupItem => {
  const poi: POIPresentation = {
    id,
    name: "Starbucks",
    floorId: id,
    floorLabel,
    media: [],
    actions: ["navigate"],
  };
  return {
    poi,
    result: {
      poiId: id,
      resultIndex: 0,
      selected: false,
      featured: false,
      floorId: id,
    },
  };
};

const nine = [
  branch("a", "Current floor"),
  ...Array.from({ length: 8 }, (_, i) => branch(`b${i}`, `Floor ${i + 2}`)),
];

describe("POIResultGroup", () => {
  it("shows one branch and counts what it is hiding, not what it holds", () => {
    // Nine Starbucks, one shown: the bar says "Show 8 more", not "Show 9".
    render(<POIResultGroup items={nine} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Show 8 more/ })).toBeVisible();
  });

  it("opens to every branch and closes again", () => {
    render(<POIResultGroup items={nine} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Show 8 more/ }));
    expect(screen.getAllByRole("article")).toHaveLength(9);

    const hide = screen.getByRole("button", { name: /Hide/ });
    expect(hide).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(hide);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("offers no control when there is nothing folded away", () => {
    render(<POIResultGroup items={[branch("only", "Current floor")]} onSelect={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Show|Hide/ })).not.toBeInTheDocument();
  });

  it("draws its members as rows, so nine borders do not sit inside one", () => {
    const { container } = render(
      <POIResultGroup defaultExpanded items={nine} onSelect={vi.fn()} />,
    );
    const rows = container.querySelectorAll("[data-appearance='row']");
    expect(rows).toHaveLength(9);
    for (const row of rows) expect(row.className).not.toMatch(/\bborder\b/);
  });

  it("keeps a grouped result as capable as an ungrouped one", () => {
    // Story 5 AC3 and Story 4 AC6 must hold inside a group too.
    const onSelect = vi.fn();
    const onAction = vi.fn();
    const item = branch("a", "Current floor");
    render(
      <POIResultGroup
        items={[
          {
            ...item,
            result: {
              ...item.result,
              selected: true,
              actions: [{ action: "navigate" as const, label: "Go" }],
            },
          },
        ]}
        onAction={onAction}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onAction).toHaveBeenCalledWith("navigate", "a");
  });

  it("lets a product own the expanded state", () => {
    const onExpandedChange = vi.fn();
    render(
      <POIResultGroup
        expanded={false}
        items={nine}
        onExpandedChange={onExpandedChange}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Show 8 more/ }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});
