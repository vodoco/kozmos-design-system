import { fireEvent, render, screen } from "@testing-library/react";
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

// The bottom sheet's detents (docs/pointr-prototype-initial-sheet-2026-09-20.md):
// jsdom lays nothing out, so the shell is told it is 390 x 600 through the
// same properties it reads live, and the sheet's height is read from its style.
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
