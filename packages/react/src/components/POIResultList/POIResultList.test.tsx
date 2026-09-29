import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import {
  POIResultList,
  type POIResultListEntry,
  type POIResultListItem,
} from "./POIResultList";

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

    expect(screen.getAllByRole("button", { current: "location" })).toHaveLength(
      1,
    );
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
    expect(screen.getAllByRole("button", { current: "location" })).toHaveLength(
      1,
    );
  });

  it("numbers its results, grouped or not, only when the product asks", () => {
    // Quick access: a category chosen in the browse grid lists its places and
    // the map numbers their pins. Kozmos cannot tell that list from another,
    // so the product turns numbering on; it draws each result's own index and
    // never renumbers. A featured result keeps Featured, as its pin keeps its
    // logo.
    const featured = createItem("featured", 0);
    const items: POIResultListEntry[] = [
      { ...featured, result: { ...featured.result, featured: true } },
      createItem("one", 1),
      {
        id: "starbucks",
        label: "Starbucks, 2 results",
        items: [createItem("two", 2), createItem("three", 3)],
        defaultExpanded: true,
      },
    ];
    const numbers = (container: HTMLElement) =>
      Array.from(container.querySelectorAll("[data-tab='number']")).map(
        (node) => node.textContent,
      );
    const { container, rerender } = render(
      <POIResultList
        items={items}
        onSelect={vi.fn()}
        resultCountLabel="4 results"
      />,
    );
    expect(numbers(container)).toEqual([]);

    rerender(
      <POIResultList
        items={items}
        numbered
        onSelect={vi.fn()}
        resultCountLabel="4 results"
        selectedPoiId="two"
      />,
    );
    expect(numbers(container)).toEqual(["1", "2", "3"]);
    expect(container.querySelector("[data-tab='featured']")).not.toBeNull();
    // The selected one fills, wherever it is.
    expect(
      container.querySelector("[data-tab='number'][data-selected]"),
    ).toHaveTextContent(/^2$/);
    expect(
      screen.getByRole("button", { name: /^2, Burger King/ }),
    ).toHaveAttribute("aria-current", "location");
    // The list's own element is not given the flag as an attribute.
    expect(container.querySelector("section")).not.toHaveAttribute("numbered");
  });

  it("holds a notice inside the list, above the results it qualifies", () => {
    // The allergen notice belongs to the results: as a sibling it could
    // outlive a list that failed to render, and be read as qualifying
    // whatever came next.
    render(
      <POIResultList
        header={<p>Check allergens with the venue.</p>}
        items={[createItem("one", 0)]}
        onSelect={vi.fn()}
        resultCountLabel="1 result"
      />,
    );

    const notice = screen.getByText("Check allergens with the venue.");
    const region = screen.getByRole("region", { name: "Points of interest" });
    expect(region).toContainElement(notice);
    // Above the results, not after them.
    const results = screen.getByRole("article");
    expect(
      notice.compareDocumentPosition(results) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("says a group's two words in the visitor's language, and reports which group opened", () => {
    const onGroupExpandedChange = vi.fn();
    const a = createItem("one", 0);
    const b = createItem("two", 1);
    const { rerender } = render(
      <POIResultList
        hideLabel="閉じる"
        items={[{ id: "starbucks", label: "Starbucks", items: [a, b] }]}
        onGroupExpandedChange={onGroupExpandedChange}
        onSelect={vi.fn()}
        resultCountLabel="2 results"
        showMoreLabel={(hidden) => `他${hidden}件を表示`}
      />,
    );

    const more = screen.getByRole("button", { name: "他1件を表示" });
    fireEvent.click(more);
    // The id travels with the change, so one handler can hold several groups.
    expect(onGroupExpandedChange).toHaveBeenCalledWith("starbucks", true);

    // Held open by the product, the group survives a redraw of the list.
    rerender(
      <POIResultList
        hideLabel="閉じる"
        items={[
          {
            expanded: true,
            id: "starbucks",
            label: "Starbucks",
            items: [a, b],
          },
        ]}
        onGroupExpandedChange={onGroupExpandedChange}
        onSelect={vi.fn()}
        resultCountLabel="2 results"
        showMoreLabel={(hidden) => `他${hidden}件を表示`}
      />,
    );
    expect(screen.getByRole("button", { name: "閉じる" })).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("gives every result the product's words for a walk's band, grouped or not", () => {
    // Decision 50: the list shows the band, in the visitor's language. The
    // card holds the words, so the list and its groups must hand them on,
    // or a translated product reads "Nearby" in English in every list.
    const walking = (item: POIResultListItem): POIResultListItem => ({
      ...item,
      result: {
        ...item.result,
        travelEstimate: {
          durationSeconds: 30,
          durationLabel: "1 min",
          band: "nearby",
        },
      },
    });
    render(
      <POIResultList
        items={[
          walking(createItem("one", 0)),
          {
            defaultExpanded: true,
            id: "group",
            label: "Burger King",
            items: [
              walking(createItem("two", 1)),
              walking(createItem("three", 2)),
            ],
          },
        ]}
        onSelect={vi.fn()}
        resultCountLabel="3 results"
        travelTimeBandLabels={{ nearby: "近く" }}
      />,
    );
    expect(screen.getAllByText("近く")).toHaveLength(3);
    expect(screen.queryByText("Nearby")).not.toBeInTheDocument();
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

  it("draws its empty state muted through the class a glass surface turns to ink", () => {
    // Decision 48: on glass, text that is muted elsewhere takes the
    // foreground colour; the empty state's box is see-through, so its text
    // sits on the glass. A `text-muted-foreground` beside the class would
    // outrank it. The results themselves are cards of their own, and keep
    // their muted text: it is on the card, not the glass.
    render(
      <POIResultList
        emptyState="Try removing a filter."
        items={[]}
        onSelect={() => undefined}
        resultCountLabel="No results"
      />,
    );
    const box = screen.getByText("Try removing a filter.");
    expect(box.classList.contains("kozmos-muted-text")).toBe(true);
    expect(box.className).not.toMatch(/\btext-muted-foreground\b/);
  });

  describe("bringing the selected result into view (row 70)", () => {
    // jsdom lays nothing out, so the geometry is stated: a 200px tall view
    // at y=100 over a list that is 1000px tall.
    const view = { top: 100, height: 200 };
    const rect = (top: number, height: number) =>
      new DOMRect(0, top, 320, height);

    function Scroller({
      children,
      overflowY = "auto",
      declares = false,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      overflowY?: React.CSSProperties["overflowY"];
      /** Says it scrolls although it hides its overflow, as the sheet does. */
      declares?: boolean;
    }) {
      return (
        <div
          data-kozmos-scroller={declares ? "" : undefined}
          data-testid="scroller"
          style={{ overflowY }}
          {...props}
        >
          {children}
        </div>
      );
    }

    const results = Array.from({ length: 10 }, (_, index) =>
      createItem(`poi-${index}`, index),
    );

    /** Lay the scroller out, place one card, and spy on every way to scroll. */
    function stage(cardId: string, cardTop: number) {
      const scroller = screen.getByTestId("scroller");
      Object.defineProperty(scroller, "clientHeight", {
        configurable: true,
        value: view.height,
      });
      Object.defineProperty(scroller, "scrollHeight", {
        configurable: true,
        value: 1000,
      });
      scroller.getBoundingClientRect = () => rect(view.top, view.height);
      const scrollBy = vi.fn();
      scroller.scrollBy = scrollBy as typeof scroller.scrollBy;
      const card = document.querySelector<HTMLElement>(
        `[data-poi-id="${cardId}"]`,
      )!;
      card.getBoundingClientRect = () => rect(cardTop, 80);
      const page = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
      return { scrollBy, page };
    }

    function List(
      props: Partial<React.ComponentProps<typeof POIResultList>> & {
        items?: readonly POIResultListEntry[];
      },
    ) {
      return (
        <POIResultList
          items={results}
          onSelect={() => undefined}
          resultCountLabel="10 results"
          {...props}
        />
      );
    }

    it("scrolls its scroller, and only its scroller, to a result below the view", () => {
      const { rerender } = render(
        <Scroller>
          <List />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-8", 500);

      rerender(
        <Scroller>
          <List selectedPoiId="poi-8" />
        </Scroller>,
      );

      // The card's bottom (580) to the view's (300), and 12px of the next.
      expect(scrollBy).toHaveBeenCalledWith({ top: 292, behavior: "smooth" });
      expect(page).not.toHaveBeenCalled();
      page.mockRestore();
    });

    it("scrolls back up to a result above the view", () => {
      const { rerender } = render(
        <Scroller>
          <List selectedPoiId="poi-8" />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-1", 20);

      rerender(
        <Scroller>
          <List selectedPoiId="poi-1" />
        </Scroller>,
      );

      expect(scrollBy).toHaveBeenCalledWith({ top: -92, behavior: "smooth" });
      page.mockRestore();
    });

    it("scrolls a sheet that hides its overflow, where a finger cannot", () => {
      // Below its largest detent AdaptiveMapShell's sheet is overflow: hidden
      // and every touch moves the sheet: the product had to scroll it itself.
      // It says so with data-kozmos-scroller.
      const { rerender } = render(
        <Scroller declares overflowY="hidden">
          <List />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-8", 500);
      rerender(
        <Scroller declares overflowY="hidden">
          <List selectedPoiId="poi-8" />
        </Scroller>,
      );
      expect(scrollBy).toHaveBeenCalledTimes(1);
      page.mockRestore();
    });

    it("leaves a box that only clips alone", () => {
      // A box that hides its overflow to clip - a group's rounded corners -
      // is not a scroller, even when rounding leaves it a pixel of overflow.
      const { rerender } = render(
        <Scroller overflowY="hidden">
          <List />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-8", 500);
      rerender(
        <Scroller overflowY="hidden">
          <List selectedPoiId="poi-8" />
        </Scroller>,
      );
      expect(scrollBy).not.toHaveBeenCalled();
      page.mockRestore();
    });

    it("brings in a result that is already selected as the list appears", () => {
      // A pin's tap can open the results with its result selected: the list
      // mounts with the selection, and nothing changes after that.
      const scrollBy = vi.fn();
      const spies = [
        vi
          .spyOn(HTMLElement.prototype, "getBoundingClientRect")
          .mockImplementation(function (this: HTMLElement) {
            if (this.dataset.testid === "scroller")
              return rect(view.top, view.height);
            if (this.dataset.poiId === "poi-8") return rect(500, 80);
            return rect(0, 0);
          }),
        vi
          .spyOn(HTMLElement.prototype, "clientHeight", "get")
          .mockImplementation(function (this: HTMLElement) {
            return this.dataset.testid === "scroller" ? view.height : 0;
          }),
        vi
          .spyOn(HTMLElement.prototype, "scrollHeight", "get")
          .mockImplementation(function (this: HTMLElement) {
            return this.dataset.testid === "scroller" ? 1000 : 0;
          }),
      ];
      const original = HTMLElement.prototype.scrollBy;
      HTMLElement.prototype.scrollBy = scrollBy as typeof original;
      try {
        render(
          <Scroller>
            <List selectedPoiId="poi-8" />
          </Scroller>,
        );
        expect(scrollBy).toHaveBeenCalledWith({ top: 292, behavior: "smooth" });
        expect(scrollBy.mock.instances[0]).toBe(screen.getByTestId("scroller"));
      } finally {
        HTMLElement.prototype.scrollBy = original;
        spies.forEach((spy) => spy.mockRestore());
      }
    });

    it("scrolls the page when nothing around the list does", () => {
      // A list in the page's own flow: the page is its scroller.
      const { rerender } = render(<List />);
      const html = document.documentElement;
      const sizes = [
        vi.spyOn(html, "clientHeight", "get").mockReturnValue(600),
        vi.spyOn(html, "scrollHeight", "get").mockReturnValue(2000),
      ];
      const card = document.querySelector<HTMLElement>(
        '[data-poi-id="poi-8"]',
      )!;
      card.getBoundingClientRect = () => rect(900, 80);
      const page = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
      try {
        rerender(<List selectedPoiId="poi-8" />);
        // The card's bottom (980) to the viewport's (600), and 12px more.
        expect(page).toHaveBeenCalledWith({ top: 392, behavior: "smooth" });
      } finally {
        page.mockRestore();
        sizes.forEach((spy) => spy.mockRestore());
      }
    });

    it("leaves a result that is already in view where it is", () => {
      const { rerender } = render(
        <Scroller overflowY="auto">
          <List />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-2", 150);
      rerender(
        <Scroller overflowY="auto">
          <List selectedPoiId="poi-2" />
        </Scroller>,
      );
      expect(scrollBy).not.toHaveBeenCalled();
      page.mockRestore();
    });

    it("jumps rather than glides when motion is reduced", () => {
      const { rerender } = render(
        <div data-kozmos-motion="reduced">
          <Scroller>
            <List />
          </Scroller>
        </div>,
      );
      const { scrollBy, page } = stage("poi-8", 500);
      rerender(
        <div data-kozmos-motion="reduced">
          <Scroller>
            <List selectedPoiId="poi-8" />
          </Scroller>
        </div>,
      );
      expect(scrollBy).toHaveBeenCalledWith({ top: 292, behavior: "auto" });
      page.mockRestore();
    });

    it("stays put when told to, for a product that scrolls the panel itself", () => {
      const { rerender } = render(
        <Scroller>
          <List scrollSelectedIntoView={false} />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-8", 500);
      rerender(
        <Scroller>
          <List scrollSelectedIntoView={false} selectedPoiId="poi-8" />
        </Scroller>,
      );
      expect(scrollBy).not.toHaveBeenCalled();
      page.mockRestore();
    });

    it("brings the card in again once its action row has opened, whatever the product re-renders meanwhile", () => {
      const { rerender } = render(
        <Scroller>
          <List items={[...results]} />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-8", 500);
      rerender(
        <Scroller>
          <List items={[...results]} selectedPoiId="poi-8" />
        </Scroller>,
      );
      // A product building its items in render hands over a new array.
      rerender(
        <Scroller>
          <List items={[...results]} selectedPoiId="poi-8" />
        </Scroller>,
      );
      expect(scrollBy).toHaveBeenCalledTimes(1);

      // The action row has opened: the card is 140px now, and still low.
      const card = document.querySelector<HTMLElement>(
        '[data-poi-id="poi-8"]',
      )!;
      card.getBoundingClientRect = () => rect(208, 140);
      const row = card.querySelector(".kozmos-poi-result-actions") ?? card;
      fireEvent.animationEnd(row);

      expect(scrollBy).toHaveBeenCalledTimes(2);
      expect(scrollBy).toHaveBeenLastCalledWith({
        top: 60,
        behavior: "smooth",
      });
      page.mockRestore();
    });

    describe("a selection whose result is not in the list yet (F2)", () => {
      // A pin's tap sets the selection, and the results it belongs to can
      // still be loading. Laid out by prototype, so a card is placed as it
      // mounts: the effect that brings it in runs before a test could place
      // it by hand.
      function layOut(
        cards: Record<string, number>,
        groups: Record<string, number> = {},
      ) {
        const scrollBy = vi.fn();
        const original = HTMLElement.prototype.scrollBy;
        HTMLElement.prototype.scrollBy = scrollBy as typeof original;
        const spies = [
          vi
            .spyOn(HTMLElement.prototype, "getBoundingClientRect")
            .mockImplementation(function (this: HTMLElement) {
              if (this.dataset.testid === "scroller")
                return rect(view.top, view.height);
              const card = this.dataset.poiId;
              if (card !== undefined && card in cards)
                return rect(cards[card], 80);
              const group = this.dataset.resultGroup;
              if (group !== undefined && group in groups)
                return rect(groups[group], 120);
              return rect(0, 0);
            }),
          vi
            .spyOn(HTMLElement.prototype, "clientHeight", "get")
            .mockImplementation(function (this: HTMLElement) {
              return this.dataset.testid === "scroller" ? view.height : 0;
            }),
          vi
            .spyOn(HTMLElement.prototype, "scrollHeight", "get")
            .mockImplementation(function (this: HTMLElement) {
              return this.dataset.testid === "scroller" ? 1000 : 0;
            }),
        ];
        const page = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
        return {
          scrollBy,
          page,
          restore() {
            HTMLElement.prototype.scrollBy = original;
            spies.forEach((spy) => spy.mockRestore());
            page.mockRestore();
          },
        };
      }

      it("brings the result in when the results arrive after the selection", () => {
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <Scroller>
              <List items={[]} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).not.toHaveBeenCalled();

          rerender(
            <Scroller>
              <List items={results} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);
          expect(layout.scrollBy).toHaveBeenCalledWith({
            top: 292,
            behavior: "smooth",
          });
          expect(layout.scrollBy.mock.instances[0]).toBe(
            screen.getByTestId("scroller"),
          );
          expect(layout.page).not.toHaveBeenCalled();
        } finally {
          layout.restore();
        }
      });

      it("waits through a batch without the result, and brings it in from the batch that has it", () => {
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <Scroller>
              <List items={results.slice(0, 5)} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).not.toHaveBeenCalled();

          rerender(
            <Scroller>
              <List items={results} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);
          expect(layout.scrollBy).toHaveBeenCalledWith({
            top: 292,
            behavior: "smooth",
          });
        } finally {
          layout.restore();
        }
      });

      it("brings in a late result's group when the group holds it folded away", () => {
        const group: POIResultListEntry = {
          id: "starbucks",
          label: "Starbucks, 3 results",
          items: [
            createItem("s-1", 0),
            createItem("s-2", 1),
            createItem("s-3", 2),
          ],
        };
        const layout = layOut({}, { starbucks: 900 });
        try {
          const { rerender } = render(
            <Scroller>
              <List items={results} selectedPoiId="s-3" />
            </Scroller>,
          );
          expect(layout.scrollBy).not.toHaveBeenCalled();

          rerender(
            <Scroller>
              <List items={[...results, group]} selectedPoiId="s-3" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledWith({
            top: 732,
            behavior: "smooth",
          });
        } finally {
          layout.restore();
        }
      });

      it("brings in, when turned on, the selection it was told to leave", () => {
        // Off, the list leaves scrolling to the product. A selection made
        // meanwhile was never brought in, so turning it on brings it in, as
        // a list that appears with a selection does. One it has brought in
        // is not brought in again.
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <Scroller>
              <List scrollSelectedIntoView={false} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).not.toHaveBeenCalled();

          rerender(
            <Scroller>
              <List selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);

          rerender(
            <Scroller>
              <List scrollSelectedIntoView={false} selectedPoiId="poi-8" />
            </Scroller>,
          );
          rerender(
            <Scroller>
              <List selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);
        } finally {
          layout.restore();
        }
      });

      it("brings a late result in once, whatever new arrays of the same results follow, and still follows its action row", () => {
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <Scroller>
              <List items={[]} selectedPoiId="poi-8" />
            </Scroller>,
          );
          rerender(
            <Scroller>
              <List items={[...results]} selectedPoiId="poi-8" />
            </Scroller>,
          );
          // A product building its items in render hands over a new array
          // every time, with the same results in it.
          rerender(
            <Scroller>
              <List items={[...results]} selectedPoiId="poi-8" />
            </Scroller>,
          );
          rerender(
            <Scroller>
              <List
                items={results.map((item) => ({ ...item }))}
                selectedPoiId="poi-8"
              />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);

          // The action row has opened, and the card is taller now.
          const card = document.querySelector<HTMLElement>(
            '[data-poi-id="poi-8"]',
          )!;
          fireEvent.animationEnd(card);
          expect(layout.scrollBy).toHaveBeenCalledTimes(2);
        } finally {
          layout.restore();
        }
      });

      it("brings a result in again when it leaves the list and comes back", () => {
        // A new search that loses the selected place, then finds it again:
        // its card is a new one, wherever the new results put it.
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <Scroller>
              <List items={results} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);

          rerender(
            <Scroller>
              <List items={results.slice(0, 5)} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(1);

          rerender(
            <Scroller>
              <List items={results} selectedPoiId="poi-8" />
            </Scroller>,
          );
          expect(layout.scrollBy).toHaveBeenCalledTimes(2);
        } finally {
          layout.restore();
        }
      });

      it("jumps rather than glides to a late result when motion is reduced", () => {
        const layout = layOut({ "poi-8": 500 });
        try {
          const { rerender } = render(
            <div data-kozmos-motion="reduced">
              <Scroller>
                <List items={[]} selectedPoiId="poi-8" />
              </Scroller>
            </div>,
          );
          rerender(
            <div data-kozmos-motion="reduced">
              <Scroller>
                <List items={results} selectedPoiId="poi-8" />
              </Scroller>
            </div>,
          );
          expect(layout.scrollBy).toHaveBeenCalledWith({
            top: 292,
            behavior: "auto",
          });
        } finally {
          layout.restore();
        }
      });
    });

    it("brings in the group that holds a result it has not drawn", () => {
      // A collapsed group draws only its first member, so a pin on the third
      // has no card to scroll to: the group is the nearest thing that is.
      const group: POIResultListEntry = {
        id: "starbucks",
        label: "Starbucks, 3 results",
        items: [
          createItem("s-1", 0),
          createItem("s-2", 1),
          createItem("s-3", 2),
        ],
      };
      const items = [...results, group];
      const { rerender } = render(
        <Scroller>
          <List items={items} />
        </Scroller>,
      );
      const { scrollBy, page } = stage("poi-2", 150);
      const groupEntry = document.querySelector<HTMLElement>(
        '[data-result-group="starbucks"]',
      );
      expect(groupEntry).not.toBeNull();
      groupEntry!.getBoundingClientRect = () => rect(900, 120);

      rerender(
        <Scroller>
          <List items={items} selectedPoiId="s-3" />
        </Scroller>,
      );

      expect(scrollBy).toHaveBeenCalledWith({ top: 732, behavior: "smooth" });
      page.mockRestore();
    });
  });
});
