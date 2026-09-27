import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { POIResultList } from "./POIResultList";
import { EmptyState } from "../EmptyState";
import { POIResultCard } from "../POIResultCard";
import { Container } from "../Container";
import { CategoryField } from "../CategoryField";
import { poiLocationLabel } from "../../utils";

const poi = {
  id: "p",
  name: "Cafe",
  floorLabel: "Level 2",
  buildingLabel: "Terminal 2",
  media: [],
  actions: [],
};

describe("search polish", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  });
  afterEach(() => vi.restoreAllMocks());

  it("pads a string in the empty slot and never pads a component", () => {
    // The reported bug: the slot added p-6 and EmptyState added p-8, so a
    // one-line no-result became a 222px box. A flag would not have fixed it —
    // nothing in this repository was passing one.
    const { container: withString } = render(
      <POIResultList
        emptyState="Try removing a filter."
        items={[]}
        onSelect={vi.fn()}
        resultCountLabel="No results"
      />,
    );
    expect(withString.querySelector(".border-dashed")?.className).toMatch(
      /\bp-6\b/,
    );

    const { container: withComponent } = render(
      <POIResultList
        emptyState={<EmptyState title="No results" />}
        items={[]}
        onSelect={vi.fn()}
        resultCountLabel="No results"
      />,
    );
    expect(
      withComponent.querySelector(".border-dashed")?.className,
    ).not.toMatch(/\bp-6\b/);
  });

  it("centres an EmptyState's own text", () => {
    // Text aligns from the start now, so a centred block has to say so.
    render(<EmptyState description="Try another word." title="No results" />);
    expect(screen.getByText("No results").className).toMatch(/text-center/);
    expect(screen.getByText("Try another word.").className).toMatch(
      /text-center/,
    );
  });

  it("joins floor and building the way every platform does", () => {
    // Kotlin and Swift both derive this with " · ". The web built it by hand
    // in two components and POIDetailPanel had drifted to " / ".
    expect(poiLocationLabel(poi)).toBe("Level 2 · Terminal 2");
    expect(poiLocationLabel({ buildingLabel: "Terminal 2" })).toBe(
      "Terminal 2",
    );
    expect(poiLocationLabel({})).toBe("");

    render(
      <POIResultCard
        onSelect={vi.fn()}
        poi={poi}
        result={{
          poiId: "p",
          resultIndex: 0,
          selected: false,
          featured: false,
        }}
      />,
    );
    expect(screen.getByText("Level 2 · Terminal 2")).toBeVisible();
  });

  it("owns the row when a category field has something beside it", () => {
    // Alone, the field is the whole component — no wrapper, and nothing that
    // would make it grow.
    const { container: alone } = render(
      <CategoryField label="Gates" onClear={vi.fn()} />,
    );
    const field = alone.querySelector('[role="group"]')!;
    expect(field).toBe(alone.firstElementChild);
    expect(field.className).not.toMatch(/flex-1/);

    // With a trailing control the component draws the row, so the caller no
    // longer has to know to pass flex-1 through className.
    const { container: row } = render(
      <CategoryField
        label="Gates"
        onClear={vi.fn()}
        trailing={<button type="button">AI</button>}
      />,
    );
    const rowEl = row.firstElementChild!;
    expect(rowEl.getAttribute("role")).not.toBe("group");
    expect(rowEl.className).toMatch(/\bflex\b/);
    expect(rowEl.querySelector('[role="group"]')!.className).toMatch(/flex-1/);
    // Two controls in the slot keep the row's gap between them.
    expect(rowEl.lastElementChild!.className).toMatch(/gap-2/);
  });

  it("gives a side panel the space the sheet's grip makes", () => {
    // A sheet's content starts below its grip. A side panel has no grip, and
    // nothing was standing in for it, so the search field sat 1px under the
    // panel's top edge.
    const shell = (
      props: Partial<React.ComponentProps<typeof AdaptiveMapShell>> = {},
    ) => {
      const { container } = render(
        <AdaptiveMapShell
          map={<div />}
          panel={<p>Places</p>}
          panelLabel="Places"
          {...props}
        />,
      );
      return container.querySelector(".overscroll-contain")!;
    };
    expect(shell({ panelPresentation: "side" }).className).toMatch(/\bpt-4\b/);
    expect(shell({ panelPresentation: "bottom" }).className).not.toMatch(
      /\bpt-4\b/,
    );
  });

  it("pads a Container by its own width when it sits in a panel", () => {
    // lg:px-8 reads the WINDOW, so a 390px side panel in a 1280px window took
    // the widest step: 32px each side against a phone's 16.
    const { container: page } = render(<Container>page</Container>);
    expect(page.firstElementChild?.className).toMatch(/lg:px-8/);

    const { container: panel } = render(
      <Container inset="panel">panel</Container>,
    );
    expect(panel.firstElementChild?.className).not.toMatch(/lg:px-8/);
    expect(panel.firstElementChild?.className).toMatch(/\bpx-4\b/);
  });
});
