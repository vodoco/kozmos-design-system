import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveMapShell } from "./AdaptiveMapShell";

describe("AdaptiveMapShell", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  });
  afterEach(() => vi.restoreAllMocks());
  it("labels renderer and panel regions without impersonating a map", () => {
    render(
      <AdaptiveMapShell
        controls={<button type="button">Focus</button>}
        map={<canvas data-testid="sdk-renderer" />}
        mapLabel="Level one map"
        panel={<div>Place details</div>}
        panelLabel="Selected place"
      />,
    );

    expect(
      screen.getByRole("region", { name: "Level one map" }),
    ).toContainElement(screen.getByTestId("sdk-renderer"));
    expect(
      screen.getByRole("complementary", { name: "Selected place" }),
    ).toHaveTextContent("Place details");
    expect(screen.getByRole("button", { name: "Focus" })).toBeVisible();
  });

  it("renders explicit map failure content as an alert", () => {
    render(
      <AdaptiveMapShell
        map={<div />}
        mapStatus="error"
        mapStatusContent="The map could not load. Check your connection."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The map could not load. Check your connection.",
    );
  });

  it("puts the panel on the surface style, solid by default", () => {
    const { rerender } = render(
      <AdaptiveMapShell
        map={<div />}
        panel={<p>Details</p>}
        panelLabel="Details"
      />,
    );
    const aside = screen.getByRole("complementary", { name: "Details" });
    expect(aside).toHaveClass("kozmos-reset", "kozmos-surface-solid");
    rerender(
      <AdaptiveMapShell
        map={<div />}
        panel={<p>Details</p>}
        panelLabel="Details"
        panelSurface="glass"
      />,
    );
    expect(aside).toHaveClass("kozmos-surface-glass");
    expect(aside).not.toHaveClass("kozmos-surface-solid");
  });

  it("fits a bottom panel to its content when asked", () => {
    // jsdom lays nothing out: the shell is told it is 400 tall and that the
    // panel holds 120 pixels, through the same properties it reads live.
    const sizes = { clientWidth: 360, clientHeight: 400, scrollHeight: 120 };
    const spies = [
      vi
        .spyOn(HTMLElement.prototype, "clientWidth", "get")
        .mockReturnValue(sizes.clientWidth),
      vi
        .spyOn(HTMLElement.prototype, "clientHeight", "get")
        .mockReturnValue(sizes.clientHeight),
      vi
        .spyOn(HTMLElement.prototype, "scrollHeight", "get")
        .mockReturnValue(sizes.scrollHeight),
    ];
    try {
      render(
        <AdaptiveMapShell
          map={<div />}
          panel={<p>Details</p>}
          panelLabel="Details"
          panelPresentation="bottom"
          panelSizing="content"
        />,
      );
      const aside = screen.getByRole("complementary", { name: "Details" });
      expect(aside.style.height).toBe("120px");
      expect(aside.style.top).toBe("280px");
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});

// The bottom sheet's detents, the Pointr prototype's (measured by
// scripts/measure-prototype-sheet.cjs): jsdom lays nothing out, so the shell
// is told it is 390 x 600 through the same properties it reads live, and the
// sheet's height is read from its style.
describe("AdaptiveMapShell sheet detents", () => {
  const spies: ReturnType<typeof vi.spyOn>[] = [];
  beforeEach(() => {
    spies.push(
      vi
        .spyOn(HTMLElement.prototype, "clientWidth", "get")
        .mockReturnValue(390),
      vi
        .spyOn(HTMLElement.prototype, "clientHeight", "get")
        .mockReturnValue(600),
    );
  });
  afterEach(() => spies.splice(0).forEach((spy) => spy.mockRestore()));

  const sheet = (
    props: Partial<React.ComponentProps<typeof AdaptiveMapShell>> = {},
  ) => {
    render(
      <AdaptiveMapShell
        map={<div />}
        panel={<p>Places</p>}
        panelLabel="Places"
        panelPresentation="bottom"
        {...props}
      />,
    );
    return screen.getByRole("complementary", { name: "Places" });
  };

  it("rests at medium, 54 % of the shell, with a handle that names the detent", () => {
    const aside = sheet();
    expect(aside.style.height).toBe("324px");
    expect(aside.style.top).toBe("276px");
    const handle = screen.getByRole("slider", { name: "Panel height" });
    expect(handle).toHaveAttribute("aria-valuetext", "Half height");
    expect(handle).toHaveAttribute("aria-valuenow", "1");
    expect(handle).toHaveAttribute("aria-valuemax", "2");
  });

  it("follows a controlled detent: collapsed is a fifth, large 94 %", () => {
    expect(sheet({ panelDetent: "collapsed" }).style.height).toBe("120px");
  });

  it("clamps large to 94 %", () => {
    expect(sheet({ panelDetent: "large" }).style.height).toBe("564px");
  });

  it("keeps a single fraction as the one detent, without a handle", () => {
    const aside = sheet({ panelFraction: 0.3 });
    expect(aside.style.height).toBe("180px");
    expect(screen.queryByRole("slider")).toBeNull();
  });

  // GAP-083: what the panel leaves empty above its content, so a part with
  // its own top padding tops it up rather than adding to it.
  const insetTop = (aside: HTMLElement) =>
    aside
      .querySelector<HTMLElement>("[data-kozmos-scroller]")!
      .style.getPropertyValue("--kozmos-panel-inset-top");

  it("tells its content it leaves the grip's row above it", () => {
    expect(insetTop(sheet())).toBe(
      "calc(var(--primitives-layout-spacing-200) * 1px)",
    );
  });

  it("tells its content it leaves nothing above it without a grip", () => {
    expect(insetTop(sheet({ panelFraction: 0.3 }))).toBe("0px");
  });

  it("tells its content it leaves nothing above it under a panel header", () => {
    expect(
      insetTop(sheet({ panelHeader: <input aria-label="Search" /> })),
    ).toBe("0px");
  });

  it("tells a side panel's content it leaves 16 above it", () => {
    expect(insetTop(sheet({ panelPresentation: "side" }))).toBe("1rem");
  });

  // And how far the content's first control must still keep below that, so
  // the grip's 16px target keeps its WCAG 2.5.8 spacing.
  const clearanceTop = (aside: HTMLElement) =>
    aside
      .querySelector<HTMLElement>("[data-kozmos-scroller]")!
      .style.getPropertyValue("--kozmos-panel-clearance-top");

  it("asks its content to keep the grip's target clear", () => {
    expect(clearanceTop(sheet())).toBe(
      "calc((24px - var(--primitives-layout-spacing-200) * 1px) / 2)",
    );
  });

  it("asks no clearance with no grip", () => {
    expect(clearanceTop(sheet({ panelFraction: 0.3 }))).toBe("0px");
  });

  it("asks no clearance under a panel header, which keeps it itself", () => {
    expect(
      clearanceTop(sheet({ panelHeader: <input aria-label="Search" /> })),
    ).toBe("0px");
  });

  it("asks no clearance in a side panel, which has no grip", () => {
    expect(clearanceTop(sheet({ panelPresentation: "side" }))).toBe("0px");
  });

  // Decision 43: the panel's surface is the one surface, so a part that
  // fills its own box standing alone paints nothing on it. Said on the
  // panel's content and its header, where what the panel hosts sits.
  const partFill = (element: HTMLElement | null) =>
    element!.style.getPropertyValue("--kozmos-panel-part-fill");

  it("tells what it hosts to paint no fill of its own, glass or solid, sheet or side panel", () => {
    for (const props of [
      {},
      { panelSurface: "glass" as const },
      { panelPresentation: "side" as const },
      { panelPresentation: "side" as const, panelSurface: "glass" as const },
    ]) {
      const aside = sheet({
        ...props,
        panelHeader: <input aria-label="Find" />,
      });
      expect(
        partFill(aside.querySelector<HTMLElement>("[data-kozmos-scroller]")),
      ).toBe("transparent");
      expect(
        partFill(
          aside.querySelector<HTMLElement>("[data-kozmos-panel-header]"),
        ),
      ).toBe("transparent");
      // Not on the aside itself: axe reports a landmark by its opening tag,
      // and past 300 characters cuts every attribute value to 20, so the
      // site's GAP-17 exclusion, which reads its class, stopped matching.
      expect(partFill(aside)).toBe("");
      cleanup();
    }
  });

  it("names its panel with a short data-slot, which axe keeps however long the panel's tag", () => {
    // GAP-17's exclusion on the website names the panel by this attribute.
    // Past 300 characters axe cuts every attribute value in a node's
    // snippet to 20, and the class it first matched lost its words; a value
    // of 20 or fewer keeps them.
    for (const panelPresentation of ["bottom", "side"] as const) {
      const aside = sheet({ panelPresentation });
      const slot = aside.getAttribute("data-slot");
      expect(slot).toBe("map-shell-panel");
      expect(slot!.length).toBeLessThanOrEqual(20);
      cleanup();
    }
  });

  it("steps the detents from the keyboard and cycles them on a tap", () => {
    const onPanelDetentChange = vi.fn();
    sheet({ onPanelDetentChange });
    const handle = screen.getByRole("slider", { name: "Panel height" });
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(onPanelDetentChange).toHaveBeenLastCalledWith("large");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(onPanelDetentChange).toHaveBeenLastCalledWith("medium");
    fireEvent.click(handle);
    expect(onPanelDetentChange).toHaveBeenLastCalledWith("large");
    fireEvent.click(handle);
    expect(onPanelDetentChange).toHaveBeenLastCalledWith("collapsed");
  });

  it("lets the content scroll only at the largest detent", () => {
    const { container: atMedium } = {
      container: sheet({ panelDetent: "medium" }),
    };
    const scroller = atMedium.querySelector<HTMLElement>("p")!.parentElement!;
    expect(scroller.style.overflowY).toBe("hidden");
    expect(scroller.style.touchAction).toBe("none");
  });

  describe("a panel header (row 73)", () => {
    // The sheet scrolled as one piece, so the search field and the assistant
    // button scrolled away with the results they were searching.
    it("draws it under the grip and outside the content that scrolls", () => {
      const aside = sheet({
        panelHeader: <input aria-label="Search places" />,
      });
      const header = screen.getByRole("textbox", { name: "Search places" });
      const scroller = aside.querySelector<HTMLElement>("p")!.parentElement!;
      const handle = screen.getByRole("slider", { name: "Panel height" });

      expect(scroller.contains(header)).toBe(false);
      expect(aside.contains(header)).toBe(true);
      const order = Array.from(aside.children);
      const headerRow = order.find((child) => child.contains(header))!;
      expect(order.indexOf(handle)).toBeLessThan(order.indexOf(headerRow));
      expect(order.indexOf(headerRow)).toBeLessThan(order.indexOf(scroller));
    });

    it("keeps its first control clear of the grab handle's target", () => {
      // WCAG 2.5.8: the handle is a 16px row, so a control directly under it
      // leaves its target a 16px clear space, not 24 - the Storybook audit's
      // target-size failure on the header story. Half the shortfall below it,
      // derived from the handle's own height token.
      const aside = sheet({
        panelHeader: <input aria-label="Search places" />,
      });
      expect(
        screen.getByRole("slider", { name: "Panel height" }),
      ).toBeVisible();
      const header = aside.querySelector<HTMLElement>(
        "[data-kozmos-panel-header]",
      )!;
      expect(header.style.paddingTop).toBe(
        "calc((24px - var(--primitives-layout-spacing-200) * 1px) / 2)",
      );
    });

    it("gives vertical drags on it to the sheet and keeps sideways ones for a row that scrolls", () => {
      const aside = sheet({
        panelHeader: <input aria-label="Search places" />,
      });
      const header = aside.querySelector<HTMLElement>(
        "[data-kozmos-panel-header]",
      );
      expect(header).not.toBeNull();
      expect(header!.style.touchAction).toBe("pan-x");
    });

    it("counts the grab handle too, when a fitted sheet offers another detent", () => {
      // iOS measures its fitted sheet with the grabber in it; the web counted
      // only the content, so a sheet offering `content` and `large` was the
      // handle's 16px short and clipped its last line.
      const heights = [
        vi
          .spyOn(HTMLElement.prototype, "scrollHeight", "get")
          .mockReturnValue(120),
        vi
          .spyOn(HTMLElement.prototype, "offsetHeight", "get")
          .mockImplementation(function (this: HTMLElement) {
            if (this.hasAttribute("data-kozmos-panel-header")) return 56;
            if (this.classList.contains("kozmos-map-sheet-handle")) return 16;
            return 0;
          }),
      ];
      try {
        const aside = sheet({
          panelHeader: <input aria-label="Search places" />,
          panelDetents: ["content", "large"],
          panelDetent: "content",
        });
        expect(
          screen.getByRole("slider", { name: "Panel height" }),
        ).toBeInTheDocument();
        expect(aside.style.height).toBe("192px");
      } finally {
        heights.forEach((spy) => spy.mockRestore());
      }
    });

    it("counts it in a sheet fitted to its content", () => {
      const heights = [
        vi
          .spyOn(HTMLElement.prototype, "scrollHeight", "get")
          .mockReturnValue(120),
        vi
          .spyOn(HTMLElement.prototype, "offsetHeight", "get")
          .mockImplementation(function (this: HTMLElement) {
            return this.hasAttribute("data-kozmos-panel-header") ? 56 : 0;
          }),
      ];
      try {
        const aside = sheet({
          panelHeader: <input aria-label="Search places" />,
          panelSizing: "content",
        });
        expect(aside.style.height).toBe("176px");
      } finally {
        heights.forEach((spy) => spy.mockRestore());
      }
    });
  });

  it("frees the content's scroll at the largest detent", () => {
    const aside = sheet({ panelDetent: "large" });
    const scroller = aside.querySelector<HTMLElement>("p")!.parentElement!;
    expect(scroller.style.overflowY).toBe("auto");
    expect(scroller.style.touchAction).toBe("pan-down");
  });
});
