import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Grid } from "./Grid";

// GAP-172 (decision 209): a virtualised Grid on the web. Home's site cards
// run to hundreds; a `virtualized` Grid draws only the rows in view and a
// few past them, in reading order, each item said as its place in the whole
// list, and the keyboard is never lost when a focused card scrolls away.
//
// jsdom lays nothing out, so the scroller's size is given here.
let viewport = { width: 960, height: 300 };
beforeEach(() => {
  viewport = { width: 960, height: 300 };
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.virtualScroller !== undefined ? viewport.height : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.virtualScroller !== undefined ? viewport.width : 0;
    },
  );
});
afterEach(() => vi.restoreAllMocks());

const card = (index: number) => <button>Site {index + 1}</button>;
const scroller = () =>
  document.querySelector("[data-virtual-scroller]") as HTMLElement;
const items = () => screen.getAllByRole("listitem");
const scrollTo = (top: number) => {
  scroller().scrollTop = top;
  fireEvent.scroll(scroller());
};

describe("Grid virtualized (GAP-172)", () => {
  it("draws only the rows in view and two past them", () => {
    render(
      <Grid
        virtualized
        cols={3}
        gap={0}
        itemCount={300}
        rowHeight={100}
        renderItem={card}
        aria-label="Sites"
      />,
    );
    // 300 / 100 = 3 rows in view, and 2 below: 5 rows of 3.
    expect(items()).toHaveLength(15);
    expect(screen.getByText("Site 1")).toBeInTheDocument();
    expect(screen.queryByText("Site 16")).toBeNull();
    // The whole list's height, so the scrollbar is the whole list's.
    const spacer = scroller().firstElementChild as HTMLElement;
    expect(spacer.style.height).toBe("10000px");
  });

  it("draws the rows a scroll brings into view, in reading order, each said in the whole list", () => {
    render(
      <Grid
        virtualized
        cols={3}
        gap={0}
        itemCount={300}
        rowHeight={100}
        renderItem={card}
      />,
    );
    scrollTo(1000);
    // Rows 10 to 12 in view, 2 above and 2 below: rows 8 to 14.
    const drawn = items();
    expect(drawn).toHaveLength(21);
    expect(drawn[0]).toHaveTextContent("Site 25");
    expect(drawn[20]).toHaveTextContent("Site 45");
    const places = drawn.map((item) =>
      Number(item.getAttribute("aria-posinset")),
    );
    expect(places).toEqual(places.slice().sort((a, b) => a - b));
    expect(places[0]).toBe(25);
    for (const item of drawn)
      expect(item).toHaveAttribute("aria-setsize", "300");
    // The drawn rows sit where they belong: row 8, 800 down.
    const list = screen.getByRole("list");
    expect(list.style.transform).toBe("translateY(800px)");
  });

  it("reports the range it draws, so a caller can draw only those items", () => {
    const onRangeChange = vi.fn();
    render(
      <Grid
        virtualized
        cols={4}
        gap={0}
        itemCount={100}
        rowHeight={150}
        onRangeChange={onRangeChange}
      >
        <div role="listitem">{"Caller's own item"}</div>
      </Grid>,
    );
    // 300 / 150 = 2 rows in view, 2 below: 4 rows of 4.
    expect(onRangeChange).toHaveBeenLastCalledWith({ start: 0, end: 16 });
    // Children are the caller's window, drawn as given.
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent("Caller's own item");
    // Rows 10 and 11 in view, 2 above and 2 below: rows 8 to 13.
    scrollTo(1500);
    expect(onRangeChange).toHaveBeenLastCalledWith({ start: 32, end: 56 });
  });

  it("fits as many columns of minColumnWidth as the width holds", () => {
    viewport = { width: 1000, height: 300 };
    render(
      <Grid
        virtualized
        gap={0}
        minColumnWidth={240}
        itemCount={50}
        rowHeight={100}
        renderItem={card}
      />,
    );
    const list = screen.getByRole("list");
    expect(list.style.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(items()).toHaveLength(20);
  });

  it("counts the gap between rows", () => {
    render(
      <Grid
        virtualized
        cols={2}
        gap={4}
        itemCount={20}
        rowHeight={84}
        renderItem={card}
      />,
    );
    // gap-4 is 16: 10 rows of 84 and 9 gaps of 16.
    const spacer = scroller().firstElementChild as HTMLElement;
    expect(spacer.style.height).toBe(`${10 * 84 + 9 * 16}px`);
  });

  it("keeps the keyboard: the scroller is focusable, and a focused card that scrolls away hands it focus", () => {
    render(
      <Grid
        virtualized
        cols={3}
        gap={0}
        itemCount={300}
        rowHeight={100}
        renderItem={card}
      />,
    );
    expect(scroller()).toHaveAttribute("tabindex", "0");
    const first = screen.getByRole("button", { name: "Site 1" });
    act(() => first.focus());
    expect(first).toHaveFocus();
    scrollTo(5000);
    expect(screen.queryByText("Site 1")).toBeNull();
    expect(scroller()).toHaveFocus();
  });

  it("a Grid that is not virtualized draws every child, as before", () => {
    render(
      <Grid cols={3}>
        <div>One</div>
        <div>Two</div>
      </Grid>,
    );
    expect(screen.queryByRole("list")).toBeNull();
    expect(document.querySelector("[data-virtual-scroller]")).toBeNull();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });
});
