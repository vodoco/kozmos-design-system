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

    fireEvent.click(screen.getByRole("button", { current: "location" }));
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
    expect(
      screen.queryByRole("button", { name: "Go" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

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

  it("moves through its states on owned rules, not on utilities", () => {
    // The card recolours as selection changes, so the rule that times that
    // change has to reach every browser — including one without @scope, which
    // the utility layer does not reach. A class the component owns does.
    const { container, rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: false }}
        onSelect={vi.fn()}
      />,
    );
    const card = container.querySelector("article");
    expect(card).toHaveClass("kozmos-poi-result-card");
    // The old rule was `transition-shadow`, a utility, and it only ever timed
    // the shadow: the border and the fill that also change snapped.
    expect(card).not.toHaveClass("transition-shadow");
    expect(container.querySelector(".kozmos-poi-result-actions")).toBeNull();
  });

  it("opens its action row inside the element that owns the move", () => {
    // Splitting this from the card's own transition is deliberate: if the two
    // shared a test, the first failing assertion would hide whether the second
    // still held.
    const { container, rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: false }}
        onSelect={vi.fn()}
      />,
    );
    rerender(
      <POIResultCard
        poi={poi}
        result={{
          ...result,
          selected: true,
          actions: [{ action: "navigate" as const, label: "Go" }],
        }}
        onSelect={vi.fn()}
      />,
    );
    // The row opens inside a wrapper that owns the move, so the group keeps
    // its own role, its label and its id — the button still points at it.
    const opener = container.querySelector(".kozmos-poi-result-actions");
    expect(opener).not.toBeNull();
    const row = screen.getByRole("group", { name: "Actions for this result" });
    expect(opener).toContainElement(row);
    expect(
      container.querySelector(`button[aria-controls="${row.id}"]`),
    ).not.toBeNull();
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
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: false }}
        onSelect={vi.fn()}
      />,
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

  it("says what the contract already knew: the unit, the name's language, and the summary", () => {
    // Three fields shipped in the contract for 0.4.0 and were drawn by
    // nothing. GAP-022, GAP-004 and GAP-029.
    const { container } = render(
      <POIResultCard
        poi={{ ...poi, name: "空港ラウンジ", floorLabel: "Level 2" }}
        result={{
          ...result,
          nameLanguage: "ja",
          summary: "Quietest of the three lounges before security.",
          unitLabel: "Unit 214",
        }}
        onSelect={vi.fn()}
      />,
    );

    // The unit leads the line, because it is narrower than the floor and the
    // visitor is told both.
    expect(screen.getByText("Unit 214 · Level 2 · Building A")).toBeVisible();

    // The tag rides on the name itself, not the card: a screen reader has to
    // change voice for those words and no others.
    const name = screen.getByText("空港ラウンジ");
    expect(name).toHaveAttribute("lang", "ja");
    expect(container.firstElementChild).not.toHaveAttribute("lang");

    expect(
      screen.getByText("Quietest of the three lounges before security."),
    ).toBeVisible();
  });

  it("draws nothing for the three when it is given nothing", () => {
    // Most results have no unit, no foreign name and no summary. The card
    // must not leave a separator, an empty line, or a lang="" behind.
    render(<POIResultCard poi={poi} result={result} onSelect={vi.fn()} />);
    const name = screen.getByText(poi.name);
    expect(name).not.toHaveAttribute("lang");
    expect(screen.queryByText(/·\s*$/)).toBeNull();
  });

  it("is the current result, not a button stuck unpressed", () => {
    // GAP-049. `handleSelect` always selects — a second tap never releases —
    // so `aria-pressed` claimed a toggle the card does not implement, and
    // every unselected result announced itself as "not pressed": a state the
    // visitor could not reach and the card could not leave.
    const { container, rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: false }}
        onSelect={vi.fn()}
      />,
    );
    const button = () => container.querySelector("button") as HTMLElement;
    expect(button()).not.toHaveAttribute("aria-pressed");
    expect(button()).not.toHaveAttribute("aria-current");

    rerender(
      <POIResultCard
        poi={poi}
        result={{ ...result, selected: true }}
        onSelect={vi.fn()}
      />,
    );
    // The same word LocationPin uses for the same state, so the pin and the
    // row are announced as one thing.
    expect(button()).toHaveAttribute("aria-current", "location");
    expect(button()).not.toHaveAttribute("aria-pressed");
  });
});
