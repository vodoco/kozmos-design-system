import { fireEvent, render, screen } from "@testing-library/react";
import type {
  POIPresentation,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard, getPOIResultDomId } from "./POIResultCard";

const poi: POIPresentation = {
  id: "burger-king/a",
  name: "Burger King",
  categoryLabel: "Dining",
  floorId: "1",
  floorLabel: "First floor",
  buildingLabel: "Building A",
  media: [],
  availability: "open",
  availabilityLabel: "Open",
  actions: ["navigate"],
};

const result: POIResultPresentation = {
  poiId: poi.id,
  resultIndex: 2,
  selected: true,
  featured: true,
  floorId: poi.floorId,
  travelEstimate: { durationSeconds: 180, durationLabel: "3 min" },
};

describe("POIResultCard", () => {
  it("renders synchronized result metadata and calls selection", () => {
    const onSelect = vi.fn();
    render(<POIResultCard poi={poi} result={result} onSelect={onSelect} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("id", getPOIResultDomId(poi.id));
    expect(card).toHaveAttribute("data-selected", "true");
    expect(screen.getByText("Featured")).toBeVisible();
    expect(screen.getByText("First floor · Building A")).toBeVisible();
    expect(screen.getByText("3 min")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { pressed: true }));
    expect(onSelect).toHaveBeenCalledWith(poi.id);
  });

  it("prevents selection when a result is unavailable", () => {
    const onSelect = vi.fn();
    render(
      <POIResultCard
        poi={poi}
        result={{
          ...result,
          selected: false,
          available: false,
          unavailableReason: "This floor is temporarily unavailable.",
        }}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("button")).toBeDisabled();
    expect(
      screen.getByText("This floor is temporarily unavailable."),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("reveals its actions only on the selected result, and reports which was pressed", () => {
    const onAction = vi.fn();
    const actions = [
      { action: "navigate" as const, label: "Go", primary: true },
      { action: "details" as const, label: "Details" },
      { action: "bookmark" as const, label: "Book" },
    ];

    const { rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: false, actions }}
        onSelect={vi.fn()}
        onAction={onAction}
      />,
    );
    // Unselected: the actions are not merely hidden, they are not rendered.
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go" })).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");

    rerender(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: true, actions }}
        onSelect={vi.fn()}
        onAction={onAction}
      />,
    );
    const row = screen.getByRole("group", { name: "Actions for this result" });
    expect(row).toBeVisible();
    // Whatever the product gave, in the order it gave it — not a fixed pair.
    expect(
      screen.getAllByRole("button").map((node) => node.textContent),
    ).toEqual(expect.arrayContaining(["Go", "Details", "Book"]));

    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onAction).toHaveBeenCalledWith("details", poi.id);
  });

  it("never nests a button inside the select button", () => {
    const { container } = render(
      <POIResultCard
        poi={poi}
        result={{
          ...result,
          selected: true,
          actions: [{ action: "navigate" as const, label: "Go" }],
        }}
        onSelect={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    // The reason the card could not simply gain two more buttons: a button
    // inside a button is invalid, and the browser silently closes the outer
    // one. This fails against any implementation that puts them inside.
    for (const node of container.querySelectorAll("button")) {
      expect(node.querySelector("button")).toBeNull();
    }
  });

  it("draws a badge as a quiet tab, and lets featured win when a result is both", () => {
    const badge = { label: "Alternative" };
    const { rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, featured: false, badge }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Alternative")).toBeVisible();
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();

    // Featured is the CMS's word and the map marker acts on it too, so it is
    // the one that shows.
    rerender(
      <POIResultCard
        poi={poi}
        result={{ ...result, featured: true, badge }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Featured")).toBeVisible();
    expect(screen.queryByText("Alternative")).not.toBeInTheDocument();
  });

  it("offers no actions on an unavailable result, however many it is given", () => {
    render(
      <POIResultCard
        poi={poi}
        result={{
          ...result,
          selected: true,
          available: false,
          unavailableReason: "Closed for maintenance.",
          actions: [{ action: "navigate" as const, label: "Go" }],
        }}
        onSelect={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("shows a result's attributes, and draws a restriction apart from them", () => {
    // Change #4: access restrictions, dietary, accessibility and services.
    // Four meanings, one shape -- but a restriction is the reason a visitor
    // cannot go, so it must not read as another thing on offer.
    render(
      <POIResultCard
        poi={{
          ...poi,
          accessRestrictions: "present",
          accessRestrictionsLabel: "Staff only",
          services: [
            { id: "s1", label: "Vegan", kind: "dietary" },
            { id: "s2", label: "Step-free", kind: "accessibility" },
            { id: "s3", label: "Takeaway" },
          ],
        }}
        result={{ ...result, selected: false }}
        onSelect={vi.fn()}
      />,
    );

    for (const label of ["Staff only", "Vegan", "Step-free", "Takeaway"]) {
      expect(screen.getByText(label)).toBeVisible();
    }
    // The restriction comes first and carries the warning tone; the rest are quiet.
    const chips = screen.getAllByRole("listitem");
    expect(chips[0]).toHaveTextContent("Staff only");
    expect(chips[0].className).toMatch(/warning/);
    expect(chips[1].className).not.toMatch(/warning/);
  });

  it("shows no attribute row when a result has none", () => {
    render(
      <POIResultCard poi={poi} result={{ ...result, selected: false }} onSelect={vi.fn()} />,
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("draws closing soon apart from open and from closed", () => {
    // Three tones, not two: "closing soon" is a reason to hurry, and drawing
    // it as plain open is the difference between arriving and arriving late.
    const tone = (availability: "open" | "closingSoon" | "closed") => {
      const { container, unmount } = render(
        <POIResultCard
          poi={{ ...poi, availability, availabilityLabel: "label" }}
          result={{ ...result, selected: false }}
          onSelect={vi.fn()}
        />,
      );
      const node = screen.getByText("label");
      const className = node.className;
      unmount();
      return className;
    };
    const open = tone("open");
    const soon = tone("closingSoon");
    const closed = tone("closed");
    expect(open).not.toEqual(soon);
    expect(soon).not.toEqual(closed);
    expect(soon).toMatch(/warning/);
  });

  it("draws a venue with no levels without inventing one", () => {
    // Story 15 edge case: a single-storey venue, where every result reading
    // "Ground Floor" is noise.
    const { poi: _drop, ...rest } = { poi };
    render(
      <POIResultCard
        poi={{ ...poi, floorId: undefined, floorLabel: undefined }}
        result={{ ...result, selected: false, floorId: undefined }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Building A")).toBeVisible();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("is the prototype's row: 80 tall, no number, a dot before the floor when it is the current one", () => {
    const { container, rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, featured: false, selected: false }}
        onSelect={vi.fn()}
        currentFloorId={result.floorId}
      />,
    );
    expect(screen.getByRole("button")).toHaveClass("min-h-20");
    expect(
      screen.queryByText(String(result.resultIndex)),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-current-floor='true']"),
    ).not.toBeNull();
    rerender(
      <POIResultCard
        poi={poi}
        result={{ ...result, featured: false, selected: false }}
        onSelect={vi.fn()}
        currentFloorId="somewhere-else"
      />,
    );
    expect(container.querySelector("[data-current-floor='true']")).toBeNull();
  });
});
