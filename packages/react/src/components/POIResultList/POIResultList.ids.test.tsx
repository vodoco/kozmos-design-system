import * as React from "react";
import { act, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  POIResultList,
  type POIResultListEntry,
  type POIResultListItem,
} from "./POIResultList";
import { POIResultCard, getPOIResultDomId } from "../POIResultCard";
import { LocationPin } from "../LocationPin";

/**
 * T1: one place shown in two lists on one page — the search's results and an
 * assistant's answer — rendered every id twice. A card's id came from the
 * place's id alone, and its action row's and unavailable note's from that, so
 * the second list's `aria-controls` and `aria-describedby` resolved into the
 * first. A list's `idPrefix` names the list's cards apart; left out, the ids
 * are exactly what they were, so a pin built on `getPOIResultDomId` keeps
 * finding its card.
 */
const place = (id: string, name: string): POIPresentation => ({
  id,
  name,
  floorId: "2",
  floorLabel: "Second floor",
  media: [],
  actions: ["navigate"],
});

const shared = place("shared/1", "Coffee");
const closed = place("closed/2", "Pharmacy");

/** The shared place selected, with a Go action, and a closed one with its reason. */
const entries = (reason: string): POIResultListItem[] => [
  {
    poi: shared,
    result: {
      poiId: shared.id,
      resultIndex: 0,
      selected: true,
      featured: false,
      floorId: "2",
      actions: [{ action: "navigate", label: "Go", primary: true }],
    },
  },
  {
    poi: closed,
    result: {
      poiId: closed.id,
      resultIndex: 1,
      selected: false,
      featured: false,
      floorId: "2",
      available: false,
      unavailableReason: reason,
    },
  },
];

/** The same two, as members of one open group. */
const grouped = (reason: string): POIResultListEntry[] => [
  {
    id: "group",
    label: "Two places",
    defaultExpanded: true,
    items: entries(reason),
  },
];

function duplicateIds(root: ParentNode = document) {
  const seen = new Map<string, number>();
  root.querySelectorAll("[id]").forEach((node) => {
    seen.set(node.id, (seen.get(node.id) ?? 0) + 1);
  });
  return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
}

/** Every id a list's references name resolves in the page to a node inside that list. */
function referencesStayIn(list: HTMLElement) {
  const references = [
    ...list.querySelectorAll("[aria-controls], [aria-describedby]"),
  ].flatMap((node) =>
    ["aria-controls", "aria-describedby"]
      .map((name) => node.getAttribute(name))
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(/\s+/)),
  );
  expect(references.length).toBeGreaterThan(0);
  for (const id of references) {
    const target = document.getElementById(id);
    expect(target, `#${id} resolves`).not.toBeNull();
    expect(list.contains(target), `#${id} resolves inside its own list`).toBe(
      true,
    );
  }
}

function TwoLists({
  make,
  prefixes,
}: {
  make: (reason: string) => POIResultListEntry[];
  prefixes: [string | undefined, string | undefined];
}) {
  return (
    <>
      <POIResultList
        idPrefix={prefixes[0]}
        items={make("Closed for the search")}
        label="Search results"
        onSelect={() => undefined}
        resultCountLabel="2 results"
        selectedPoiId={shared.id}
      />
      <POIResultList
        idPrefix={prefixes[1]}
        items={make("Closed for the assistant")}
        label="Assistant's answer"
        onSelect={() => undefined}
        resultCountLabel="2 results"
        selectedPoiId={shared.id}
      />
    </>
  );
}

describe("POIResultList ids (T1)", () => {
  for (const [shape, make] of [
    ["flat", entries],
    ["grouped", grouped],
  ] as const) {
    it(`gives two ${shape} lists showing one place their own ids and references`, () => {
      render(<TwoLists make={make} prefixes={["search", "assistant"]} />);

      expect(duplicateIds()).toEqual([]);
      const search = screen.getByRole("region", { name: "Search results" });
      const assistant = screen.getByRole("region", {
        name: "Assistant's answer",
      });
      referencesStayIn(search);
      referencesStayIn(assistant);

      // Each list's unavailable note is its own, with its own words.
      expect(
        within(search).getByRole("button", { name: /Pharmacy/ }),
      ).toHaveAccessibleDescription("Closed for the search");
      expect(
        within(assistant).getByRole("button", { name: /Pharmacy/ }),
      ).toHaveAccessibleDescription("Closed for the assistant");

      // The action row each list's selected card controls is that list's.
      for (const list of [search, assistant]) {
        const controls = within(list)
          .getByRole("button", { current: "location" })
          .getAttribute("aria-controls")!;
        expect(within(list).getByRole("group", { name: /Actions/ })).toBe(
          document.getElementById(controls),
        );
      }
    });
  }

  it("names a card from the list's prefix, the same way getPOIResultDomId does", () => {
    render(<TwoLists make={entries} prefixes={["search", "assistant"]} />);
    const assistant = screen.getByRole("region", {
      name: "Assistant's answer",
    });
    const card = within(assistant)
      .getByRole("button", { current: "location" })
      .closest("article")!;
    expect(card.id).toBe(getPOIResultDomId(shared.id, "assistant"));
    expect(card.id).not.toBe(getPOIResultDomId(shared.id));

    // A map pin names the card in the list it belongs to.
    render(
      <LocationPin
        label="Coffee"
        onClick={() => undefined}
        resultId={getPOIResultDomId(shared.id, "assistant")}
      />,
    );
    const pin = screen.getByRole("button", { name: "Coffee" });
    expect(document.getElementById(pin.getAttribute("aria-controls")!)).toBe(
      card,
    );
  });

  it("keeps today's ids exactly when no prefix is given", () => {
    render(
      <POIResultList
        items={entries("Closed")}
        onSelect={() => undefined}
        resultCountLabel="2 results"
        selectedPoiId={shared.id}
      />,
    );
    expect(getPOIResultDomId(shared.id)).toBe("poi-result-shared%2F1");
    const card = document.getElementById("poi-result-shared%2F1");
    expect(card).toHaveAttribute("data-poi-id", shared.id);
    expect(document.getElementById("poi-result-shared%2F1-actions")).toBe(
      screen.getByRole("group", { name: /Actions/ }),
    );
    expect(
      document.getElementById("poi-result-closed%2F2-unavailable"),
    ).toHaveTextContent("Closed");
  });

  it("lets a card's own id win over the list's prefix", () => {
    render(
      <POIResultCard
        id="coffee-card"
        idPrefix="assistant"
        onSelect={() => undefined}
        poi={shared}
        result={entries("Closed")[0].result}
      />,
    );
    expect(screen.getByRole("article")).toHaveAttribute("id", "coffee-card");
    expect(screen.getByRole("group", { name: /Actions/ })).toHaveAttribute(
      "id",
      "coffee-card-actions",
    );
  });

  describe("rendered on a server", () => {
    let root: Root | undefined;
    afterEach(() => {
      act(() => root?.unmount());
      root = undefined;
      document.body.replaceChildren();
    });

    /** Two lists, each namespaced by an id React keeps between server and browser. */
    function Page() {
      const search = React.useId();
      const assistant = React.useId();
      return <TwoLists make={grouped} prefixes={[search, assistant]} />;
    }

    /** The server's markup in a container, parsed without running anything. */
    function served(markup: string) {
      const parsed = new DOMParser().parseFromString(
        `<div id="served">${markup}</div>`,
        "text/html",
      );
      const container = document.adoptNode(
        parsed.getElementById("served")!,
      ) as HTMLDivElement;
      document.body.append(container);
      return container;
    }

    it("hydrates to the ids it was served with, and they are unique", async () => {
      const container = served(renderToString(<Page />));
      const ids = () =>
        [...container.querySelectorAll("[id]")].map((node) => node.id);
      const before = ids();
      expect(before.length).toBeGreaterThan(0);
      expect(duplicateIds(container)).toEqual([]);

      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const recoverable = vi.fn();
      try {
        await act(async () => {
          root = hydrateRoot(container, <Page />, {
            onRecoverableError: recoverable,
          });
        });
        expect(recoverable).not.toHaveBeenCalled();
        expect(errors).not.toHaveBeenCalled();
      } finally {
        errors.mockRestore();
      }
      expect(ids()).toEqual(before);
    });
  });
});
