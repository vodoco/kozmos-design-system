import { fireEvent, render, screen } from "@testing-library/react";
import type {
  POIPresentation,
  POIResultPresentation,
  TravelTimeBand,
} from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard, getPOIResultDomId } from "./POIResultCard";
import { AnalyticsProvider } from "../../utils/analytics";

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
  it("only discloses explicitly unlisted staff language, even with a custom selection name", () => {
    const props = {
      poi,
      onSelect: vi.fn(),
      selectionLabel: "Choose this place",
    };
    const { rerender } = render(
      <POIResultCard
        {...props}
        result={{ ...result, languageNotListed: true }}
      />,
    );
    expect(screen.getByText("Language not listed")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Choose this place" }),
    ).toHaveAccessibleDescription("Language not listed");
    for (const languageNotListed of [false, undefined]) {
      rerender(
        <POIResultCard
          {...props}
          result={{
            ...result,
            languageNotListed,
            nameLanguage: "tr",
            match: "unconfirmed",
          }}
        />,
      );
      expect(screen.queryByText("Language not listed")).not.toBeInTheDocument();
    }
  });

  it("localizes staff-language disclosure independently of unavailable state", () => {
    render(
      <POIResultCard
        poi={poi}
        onSelect={vi.fn()}
        languageNotListedLabel="Türkçe listelenmemiş"
        result={{
          ...result,
          languageNotListed: true,
          available: false,
          unavailableReason: "Closed for repair",
        }}
      />,
    );
    expect(screen.getByRole("button")).toHaveAccessibleDescription(
      "Closed for repair Türkçe listelenmemiş",
    );
    expect(screen.getByText("Türkçe listelenmemiş")).toBeVisible();
  });

  it("keeps actions without a handler disabled and emits no action analytics", () => {
    const onDispatch = vi.fn();
    const onSelect = vi.fn();
    const { unmount } = render(
      <AnalyticsProvider onDispatch={onDispatch}>
        <POIResultCard
          poi={poi}
          onSelect={onSelect}
          result={{ ...result, actions: [{ action: "navigate", label: "Go" }] }}
        />
      </AnalyticsProvider>,
    );
    const action = screen.getByRole("button", { name: "Go" });
    expect(action).toBeDisabled();
    fireEvent.click(action);
    action.click();
    unmount();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onDispatch).not.toHaveBeenCalled();
  });

  it("updates action availability with its handler without overriding explicit disabled state", () => {
    const onAction = vi.fn();
    const props = {
      poi,
      onSelect: vi.fn(),
      result: {
        ...result,
        actions: [
          { action: "navigate" as const, label: "Go" },
          { action: "share" as const, label: "Share", disabled: true },
        ],
      },
    };
    const { rerender } = render(<POIResultCard {...props} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeDisabled();
    rerender(<POIResultCard {...props} onAction={onAction} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("navigate", poi.id);
    rerender(<POIResultCard {...props} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeDisabled();
  });

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
    const { container } = render(
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
      const { unmount } = render(
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
    // The owned rule that holds the 80px minimum, in a browser without @scope too.
    expect(screen.getByRole("button")).toHaveClass("kozmos-poi-result-select");
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

  it("says a summary in the query's language in that language's voice (GAP-125)", () => {
    // MAP-474 US2-EC1: a visitor asks in Spanish on an English device. The
    // model writes the summary in Spanish; the card's own words stay English.
    const summary = "La más tranquila de las tres salas, antes del control.";
    const { container, rerender } = render(
      <POIResultCard
        poi={{ ...poi, name: "空港ラウンジ" }}
        result={{
          ...result,
          nameLanguage: "ja",
          summary,
          summaryLanguage: "es",
        }}
        onSelect={vi.fn()}
      />,
    );

    // A span of its own carries the tag, so a screen reader changes voice for
    // the summary's words and no others: not the card, not the name.
    const spoken = screen.getByText(summary);
    expect(spoken.tagName).toBe("SPAN");
    expect(spoken).toHaveAttribute("lang", "es");
    expect(screen.getByText("空港ラウンジ")).toHaveAttribute("lang", "ja");
    expect(container.firstElementChild).not.toHaveAttribute("lang");
    expect(screen.getByText("Dining")).not.toHaveAttribute("lang");

    // Inside the select button, so its accessible name carries both.
    expect(screen.getByRole("button")).toContainElement(spoken);

    // A summary in the interface language carries no tag, and an empty tag is
    // no tag: lang="" would tell a screen reader the language is unknown.
    for (const summaryLanguage of [undefined, ""]) {
      rerender(
        <POIResultCard
          poi={poi}
          result={{
            ...result,
            nameLanguage: summaryLanguage,
            summary,
            summaryLanguage,
          }}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText(summary)).not.toHaveAttribute("lang");
      expect(screen.getByText(poi.name)).not.toHaveAttribute("lang");
    }
  });

  describe("a walk shown as a band (decision 50, GAP-088)", () => {
    // The product passes the walking time it has, with the band Kozmos's rule
    // gives it; the card draws the band. The exact minutes stay in the
    // estimate for the details card.
    const banded = (
      band: TravelTimeBand,
      durationLabel = "exact minutes",
    ): POIResultPresentation => ({
      ...result,
      selected: false,
      featured: false,
      travelEstimate: { durationSeconds: 45, durationLabel, band },
    });

    it("reads Nearby for a place under a minute away, in the success colour", () => {
      render(
        <POIResultCard
          poi={poi}
          result={banded("nearby", "1 min")}
          onSelect={vi.fn()}
        />,
      );
      const nearby = screen.getByText("Nearby");
      expect(nearby).toBeVisible();
      // An owned rule, so the tone holds in a browser without @scope too:
      // check-owned-css measures its colour and contrast in both themes.
      expect(nearby).toHaveClass("kozmos-travel-time-success");
      expect(nearby).not.toHaveClass("text-foreground");
      expect(screen.queryByText("1 min")).not.toBeInTheDocument();
    });

    it("draws the other four bands in the card's normal colour", () => {
      const words: [TravelTimeBand, string][] = [
        ["oneToTwoMinutes", "1–2 min"],
        ["twoToFiveMinutes", "2–5 min"],
        ["fiveToTenMinutes", "5–10 min"],
        ["moreThanTenMinutes", "More than 10 min"],
      ];
      for (const [band, label] of words) {
        const { unmount } = render(
          <POIResultCard poi={poi} result={banded(band)} onSelect={vi.fn()} />,
        );
        const node = screen.getByText(label);
        expect(node).toHaveClass("text-foreground");
        expect(node).not.toHaveClass("kozmos-travel-time-success");
        expect(screen.queryByText("exact minutes")).not.toBeInTheDocument();
        unmount();
      }
    });

    it("says Nearby in words, so the tone is never carried by colour alone", () => {
      render(
        <POIResultCard
          poi={poi}
          result={banded("nearby")}
          onSelect={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /Burger King.*Nearby/ }),
      ).toBeInTheDocument();
    });

    it("takes the product's words for a band, and keeps English for the rest", () => {
      const { rerender } = render(
        <POIResultCard
          poi={poi}
          result={banded("nearby")}
          onSelect={vi.fn()}
          travelTimeBandLabels={{ nearby: "À proximité" }}
        />,
      );
      expect(screen.getByText("À proximité")).toHaveClass(
        "kozmos-travel-time-success",
      );
      expect(screen.queryByText("Nearby")).not.toBeInTheDocument();
      rerender(
        <POIResultCard
          poi={poi}
          result={banded("twoToFiveMinutes")}
          onSelect={vi.fn()}
          travelTimeBandLabels={{ nearby: "À proximité" }}
        />,
      );
      expect(screen.getByText("2–5 min")).toBeVisible();
    });

    it("keeps the exact minutes, as before, when the product sets no band", () => {
      // The guard: every product that has not adopted bands draws as it did.
      render(
        <POIResultCard
          poi={poi}
          result={{
            ...result,
            travelEstimate: { durationSeconds: 45, durationLabel: "1 min" },
          }}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("1 min")).toHaveClass("text-foreground");
      expect(screen.queryByText("Nearby")).not.toBeInTheDocument();
    });
  });

  describe("the tab: Featured, the number, or a quiet badge (GAP-054)", () => {
    // Olcay, 2026-09-29: quick access numbers its results as its pins are
    // numbered; one tab per card, Featured over the number over the badge;
    // the badge is quiet, and the number is never the selected card's look.
    const plain = { ...result, featured: false, selected: false };
    const tabOf = (container: HTMLElement) =>
      container.querySelector<HTMLElement>("article [data-tab]");

    it("draws a badge quiet: no star, and neither Featured's paint nor its edge", () => {
      const { container } = render(
        <POIResultCard
          poi={poi}
          result={{ ...plain, badge: { label: "Alternative" } }}
          onSelect={vi.fn()}
        />,
      );
      const tab = tabOf(container)!;
      expect(tab).toHaveTextContent("Alternative");
      expect(tab.querySelector("svg")).toBeNull();
      expect(tab).not.toHaveClass("bg-warning");
      expect(tab).toHaveAttribute("data-tab", "badge");
      expect(screen.getByRole("article")).not.toHaveClass("border-warning");
      expect(screen.getByRole("article")).not.toHaveClass(
        "kozmos-poi-result-card-featured",
      );
      expect(screen.getByRole("article")).toHaveClass("border-border");
      // Announced once in the select button's name, not again as a tab.
      expect(tab).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("button")).toHaveAccessibleName(
        expect.stringMatching(/^Alternative, Burger King/),
      );
    });

    it("draws Featured in its amber with a star, and the card's edge in the same amber, selected or not", () => {
      // Olcay, 2026-09-29: the SDK's bright amber under dark words. The
      // tab's paint and the edge are owned rules; the ring still says which
      // card is selected.
      const { container, rerender } = render(
        <POIResultCard
          poi={poi}
          result={{ ...plain, featured: true }}
          onSelect={vi.fn()}
        />,
      );
      const tab = tabOf(container)!;
      expect(tab).toHaveTextContent("Featured");
      expect(tab.querySelector("svg")).not.toBeNull();
      expect(tab).toHaveAttribute("data-tab", "featured");
      const card = screen.getByRole("article");
      expect(card).toHaveClass("kozmos-poi-result-card-featured");
      expect(card).not.toHaveClass("border-warning");
      expect(card).not.toHaveClass("border-border");

      rerender(
        <POIResultCard
          poi={poi}
          result={{ ...plain, featured: true, selected: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(card).toHaveClass("kozmos-poi-result-card-featured");
      expect(card).not.toHaveClass("ring-2");
      expect(card).not.toHaveClass("border-primary");
    });

    it("sits inside the card in its top-start corner, and the name begins below it", () => {
      // Olcay, 2026-09-29 (Figma 9273:45990): no folder tab above the card.
      // The corner is logical, so right to left it is the top-right.
      const { container, rerender } = render(
        <POIResultCard
          poi={poi}
          result={{ ...plain, featured: true }}
          onSelect={vi.fn()}
        />,
      );
      const tab = tabOf(container)!;
      expect(tab).toHaveClass("absolute", "start-0", "top-0");
      expect(tab).toHaveClass("pointer-events-none");
      expect(tab).not.toHaveClass("bottom-full");
      expect(tab).not.toHaveClass("left-0");
      const card = screen.getByRole("article");
      expect(card).not.toHaveClass("mt-3");
      expect(screen.getByRole("button")).not.toHaveClass("pt-6");

      // Without a tab the card keeps its own top padding.
      rerender(<POIResultCard poi={poi} result={plain} onSelect={vi.fn()} />);
      expect(screen.getByRole("button")).not.toHaveClass("pt-6");
    });

    it("draws the result's own number in the tab, only when asked, quiet on the grey edge at rest", () => {
      const { container, rerender } = render(
        <POIResultCard poi={poi} result={plain} onSelect={vi.fn()} />,
      );
      // Off unless the product numbers the list: an upgrade changes nothing.
      expect(tabOf(container)).toBeNull();
      expect(
        screen.getByRole("button", { name: /^Burger King/ }),
      ).toBeVisible();

      rerender(
        <POIResultCard numbered poi={poi} result={plain} onSelect={vi.fn()} />,
      );
      const tab = tabOf(container);
      expect(tab).not.toBeNull();
      expect(tab).toHaveTextContent(/^2$/);
      expect(tab).toHaveAttribute("data-tab", "number");
      expect(tab).not.toHaveAttribute("data-selected");
      const card = screen.getByRole("article");
      expect(card).toHaveClass("border-border");
      expect(card).not.toHaveClass("kozmos-poi-result-card-featured");
      expect(card).not.toHaveClass("border-primary");
      // The prop is the card's, never an attribute on the page.
      expect(card).not.toHaveAttribute("numbered");
    });

    it("fills the selected number's tab while keeping the card edge neutral", () => {
      const { container } = render(
        <POIResultCard
          numbered
          poi={poi}
          result={{ ...plain, selected: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-selected", "true");
      expect(screen.getByRole("article")).toHaveClass("border-border");
    });

    it("says the number at the start of the result's name, and hides the tab that draws it", () => {
      const { container, rerender } = render(
        <POIResultCard numbered poi={poi} result={plain} onSelect={vi.fn()} />,
      );
      expect(
        screen.getByRole("button", { name: /^2, Burger King/ }),
      ).toBeVisible();
      expect(tabOf(container)).toHaveAttribute("aria-hidden", "true");

      // A product's selectionLabel names the result, number and all, in its
      // own words.
      rerender(
        <POIResultCard
          numbered
          poi={poi}
          result={plain}
          selectionLabel="Résultat 2 : Burger King"
          onSelect={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Résultat 2 : Burger King" }),
      ).toBeVisible();
    });

    it("shows the number and Featured together on a featured result", () => {
      const { container } = render(
        <POIResultCard
          numbered
          poi={poi}
          result={{ ...plain, featured: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-tab", "featured");
      expect(screen.getByText("2")).toBeVisible();
      expect(
        screen.getByRole("button", { name: /^2, Featured, Burger King/ }),
      ).toBeVisible();
    });

    it("keeps the badge beside its number", () => {
      const { container } = render(
        <POIResultCard
          numbered
          poi={poi}
          result={{ ...plain, badge: { label: "Alternative" } }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-tab", "badge");
      expect(tabOf(container)).toHaveTextContent("2Alternative");
    });

    it("draws a grouped row's number in the corner, without offsetting its name", () => {
      const { container, rerender } = render(
        <POIResultCard
          appearance="row"
          numbered
          poi={poi}
          result={plain}
          onSelect={vi.fn()}
        />,
      );
      const number = container.querySelector<HTMLElement>(
        "article [data-tab='number']",
      );
      expect(number).not.toBeNull();
      expect(number).toHaveTextContent(/^2$/);
      expect(number).toHaveAttribute("aria-hidden", "true");
      expect(number).not.toHaveAttribute("data-placement", "inline");
      expect(tabOf(container)).toBe(number);
      expect(
        screen.getByRole("button", { name: /^2, Burger King/ }),
      ).toBeVisible();

      rerender(
        <POIResultCard
          appearance="row"
          numbered
          poi={poi}
          result={{ ...plain, selected: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(
        container.querySelector("article [data-tab='number']"),
      ).toHaveAttribute("data-selected", "true");
    });
  });

  describe('the legacy presentation keeps its tab rules (presentationStyle="legacy")', () => {
    // The tab rules before the SDK presentation became the default (#190).
    // Legacy still ships, for a staged migration, so its rules keep their
    // tests: one tab per card, Featured over the number over the badge, the
    // badge read aloud, the selection ring and the number before a row's name.
    const plain = { ...result, featured: false, selected: false };
    const tabOf = (container: HTMLElement) =>
      container.querySelector<HTMLElement>("article > span");

    it("reads a badge aloud: it says why the result is in the list", () => {
      const { container } = render(
        <POIResultCard
          presentationStyle="legacy"
          poi={poi}
          result={{ ...plain, badge: { label: "Alternative" } }}
          onSelect={vi.fn()}
        />,
      );
      const tab = screen.getByText("Alternative");
      expect(tab).toBe(tabOf(container));
      expect(tab).toHaveAttribute("data-tab", "badge");
      expect(tab).not.toHaveAttribute("aria-hidden");
    });

    it("rings the selected card, Featured or not", () => {
      render(
        <POIResultCard
          presentationStyle="legacy"
          poi={poi}
          result={{ ...plain, featured: true, selected: true }}
          onSelect={vi.fn()}
        />,
      );
      const card = screen.getByRole("article");
      expect(card).toHaveClass("kozmos-poi-result-card-featured", "ring-2");
      expect(card).not.toHaveClass("border-primary");
    });

    it("starts the name below the corner tab", () => {
      const { container, rerender } = render(
        <POIResultCard
          presentationStyle="legacy"
          poi={poi}
          result={{ ...plain, featured: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveClass("absolute", "start-0", "top-0");
      expect(
        screen.getByRole("button").querySelector(":scope > span"),
      ).toHaveClass("pt-6");
      rerender(
        <POIResultCard
          presentationStyle="legacy"
          poi={poi}
          result={plain}
          onSelect={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button").querySelector(":scope > span"),
      ).not.toHaveClass("pt-6");
    });

    it("edges the selected numbered card in the primary colour", () => {
      const { container } = render(
        <POIResultCard
          presentationStyle="legacy"
          numbered
          poi={poi}
          result={{ ...plain, selected: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-selected", "true");
      expect(screen.getByRole("article")).toHaveClass("border-primary");
    });

    it("shows Featured, not a number, on a featured result", () => {
      const { container } = render(
        <POIResultCard
          presentationStyle="legacy"
          numbered
          poi={poi}
          result={{ ...plain, featured: true }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-tab", "featured");
      expect(screen.queryByText("2")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Burger King/ }),
      ).toBeVisible();
    });

    it("shows the number, not a badge, on a numbered result that has one", () => {
      const { container } = render(
        <POIResultCard
          presentationStyle="legacy"
          numbered
          poi={poi}
          result={{ ...plain, badge: { label: "Alternative" } }}
          onSelect={vi.fn()}
        />,
      );
      expect(tabOf(container)).toHaveAttribute("data-tab", "number");
      expect(screen.queryByText("Alternative")).not.toBeInTheDocument();
    });

    it("draws a grouped row's number before its name", () => {
      const { container } = render(
        <POIResultCard
          presentationStyle="legacy"
          appearance="row"
          numbered
          poi={poi}
          result={plain}
          onSelect={vi.fn()}
        />,
      );
      const number = container.querySelector<HTMLElement>(
        "button [data-tab='number']",
      );
      expect(number).toHaveTextContent(/^2$/);
      expect(number).toHaveAttribute("data-placement", "inline");
      expect(tabOf(container)).toBeNull();
      expect(
        screen.getByRole("button", { name: /^2, Burger King/ }),
      ).toBeVisible();
    });
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
