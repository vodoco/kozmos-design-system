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

  it("keeps each branch's summary in its own language, shown or unfolded (GAP-125)", () => {
    const [first, second] = nine;
    render(
      <POIResultGroup
        items={[
          {
            ...first,
            result: {
              ...first.result,
              summary: "La sucursal más cercana.",
              summaryLanguage: "es",
            },
          },
          {
            ...second,
            result: { ...second.result, summary: "The quietest branch." },
          },
        ]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("La sucursal más cercana.")).toHaveAttribute(
      "lang",
      "es",
    );
    fireEvent.click(screen.getByRole("button", { name: /Show 1 more/ }));
    expect(screen.getByText("The quietest branch.")).not.toHaveAttribute(
      "lang",
    );
  });

  it("offers no control when there is nothing folded away", () => {
    render(
      <POIResultGroup
        items={[branch("only", "Current floor")]}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Show|Hide/ }),
    ).not.toBeInTheDocument();
  });

  it("draws its members as rows, so nine borders do not sit inside one", () => {
    const { container } = render(
      <POIResultGroup defaultExpanded items={nine} onSelect={vi.fn()} />,
    );
    const rows = container.querySelectorAll("[data-appearance='row']");
    expect(rows).toHaveLength(9);
    for (const row of rows) expect(row.className).not.toMatch(/\bborder\b/);
  });

  it("numbers each member before its name when told to, and only then", () => {
    const numbered = [0, 1, 2].map((index) => {
      const item = branch(`n${index}`, `Floor ${index + 1}`);
      return { ...item, result: { ...item.result, resultIndex: index + 4 } };
    });
    const { container, rerender } = render(
      <POIResultGroup defaultExpanded items={numbered} onSelect={vi.fn()} />,
    );
    expect(container.querySelectorAll("[data-tab='number']")).toHaveLength(0);

    rerender(
      <POIResultGroup
        defaultExpanded
        items={numbered}
        numbered
        onSelect={vi.fn()}
      />,
    );
    expect(
      Array.from(container.querySelectorAll("[data-tab='number']")).map(
        (node) => node.textContent,
      ),
    ).toEqual(["4", "5", "6"]);
    expect(
      screen.getAllByRole("button", { name: /^\d, Starbucks/ }),
    ).toHaveLength(3);
    expect(container.querySelector("section")).not.toHaveAttribute("numbered");
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
