import { describe, expect, it } from "vitest";
import {
  anchoredCollapsedHeight,
  decidePanelDrag,
  nearestPanelDetent,
  orderPanelDetents,
  panelDetentHeight,
} from "./panel-detents";

// The prototype's numbers on its 874-pixel frame, driven and measured
// (docs/pointr-prototype-initial-sheet-2026-09-20.md §1).
describe("panel detents", () => {
  it("rests at a fifth, 54 % and 94 % of the shell", () => {
    expect(panelDetentHeight("collapsed", 874)).toBeCloseTo(174.8, 5);
    expect(panelDetentHeight("medium", 874)).toBeCloseTo(471.96, 5);
    expect(panelDetentHeight("large", 874)).toBeCloseTo(821.56, 5);
  });

  it("keeps a collapsed sheet tall enough for the handle and a header, but never over 40 %", () => {
    expect(panelDetentHeight("collapsed", 500)).toBe(112);
    expect(panelDetentHeight("collapsed", 200)).toBe(80);
  });

  it("rests the collapsed sheet on the content's peek anchor, within a quarter and three quarters", () => {
    expect(anchoredCollapsedHeight(250, 800)).toBe(266);
    expect(anchoredCollapsedHeight(40, 800)).toBe(192);
    expect(anchoredCollapsedHeight(700, 800)).toBe(576);
    expect(panelDetentHeight("collapsed", 800, { peekBottom: 250 })).toBe(266);
    expect(panelDetentHeight("collapsed", 800, { peekBottom: 0 })).toBe(160);
  });

  it("lets a panel header raise the collapsed sheet only when the header would not fit (row 73)", () => {
    // A header is a floor, not an anchor: a search field under the grip
    // leaves the prototype's collapsed sheet (a fifth, 160 here) as it was...
    expect(panelDetentHeight("collapsed", 800, { headerBottom: 72 })).toBe(160);
    // ...and a header taller than that raises it to show the whole header,
    // with the peek's margin under it,
    expect(panelDetentHeight("collapsed", 800, { headerBottom: 200 })).toBe(
      216,
    );
    // never past the peek's cap.
    expect(panelDetentHeight("collapsed", 800, { headerBottom: 700 })).toBe(
      576,
    );
    // An anchor still rules where there is one.
    expect(
      panelDetentHeight("collapsed", 800, {
        headerBottom: 72,
        peekBottom: 250,
      }),
    ).toBe(266);
  });

  it("fits the content detent between collapsed and large, and reads as medium until measured", () => {
    expect(panelDetentHeight("content", 800)).toBe(432);
    expect(panelDetentHeight("content", 800, { contentHeight: 120 })).toBe(160);
    expect(panelDetentHeight("content", 800, { contentHeight: 300 })).toBe(300);
    expect(panelDetentHeight("content", 800, { contentHeight: 2000 })).toBe(
      752,
    );
  });

  it("clamps a fraction to the usable range and a height to the shell", () => {
    expect(panelDetentHeight({ fraction: 0.05 }, 800)).toBe(96);
    expect(panelDetentHeight({ fraction: 0.99 }, 800)).toBe(752);
    expect(panelDetentHeight({ height: 5000 }, 800)).toBe(752);
  });

  it("orders the offered detents by height and folds equal heights", () => {
    const ordered = orderPanelDetents(
      ["large", "collapsed", "medium", { fraction: 0.54 }],
      800,
    );
    expect(ordered).toEqual(["collapsed", "medium", "large"]);
  });

  it("snaps to the nearest detent by distance", () => {
    const detents = ["collapsed", "medium", "large"] as const;
    // From a fifth (175) of the prototype's frame: +100 stays, +160 reaches half.
    expect(nearestPanelDetent(detents, 275, 874)).toBe("collapsed");
    expect(nearestPanelDetent(detents, 335, 874)).toBe("medium");
    // From half (472): +160 stays, +200 reaches full; from full, −250 falls to half.
    expect(nearestPanelDetent(detents, 632, 874)).toBe("medium");
    expect(nearestPanelDetent(detents, 672, 874)).toBe("large");
    expect(nearestPanelDetent(detents, 572, 874)).toBe("medium");
  });
});

// The prototype's drag rule, decided once at a drag's first move (§2).
describe("decidePanelDrag", () => {
  it("leaves a sideways move to the content", () => {
    expect(
      decidePanelDrag({ dx: 12, dy: -8, atLargestDetent: false, scrollTop: 0 }),
    ).toBe("content");
  });
  it("moves the sheet in either direction below the largest detent", () => {
    expect(
      decidePanelDrag({ dx: 0, dy: -40, atLargestDetent: false, scrollTop: 0 }),
    ).toBe("sheet");
    expect(
      decidePanelDrag({
        dx: 0,
        dy: 40,
        atLargestDetent: false,
        scrollTop: 100,
      }),
    ).toBe("sheet");
  });
  it("scrolls the content at the largest detent on an upward drag", () => {
    expect(
      decidePanelDrag({ dx: 0, dy: -40, atLargestDetent: true, scrollTop: 0 }),
    ).toBe("content");
  });
  it("scrolls the content back to its top before the sheet moves down", () => {
    expect(
      decidePanelDrag({ dx: 0, dy: 40, atLargestDetent: true, scrollTop: 40 }),
    ).toBe("content");
    expect(
      decidePanelDrag({ dx: 0, dy: 40, atLargestDetent: true, scrollTop: 0 }),
    ).toBe("sheet");
  });
});
