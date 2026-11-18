import { act, render } from "@testing-library/react";
import type { AdaptiveMapLayoutSnapshot } from "@kozmos-ds/product-contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveMapShell } from "./AdaptiveMapShell";

// GAP-084: on the web the on-screen keyboard overlays the page rather than
// resizing it, so a sheet stayed behind it unless the product measured
// window.visualViewport and passed its height as safeAreaInsets.bottom. The
// shell measures it itself now: what the keyboard covers of the shell is a
// bottom exclusion, as if the product had passed it.

class FakeVisualViewport extends EventTarget {
  height = 600;
  offsetTop = 0;
  scale = 1;
  width = 390;
}

describe("AdaptiveMapShell and the on-screen keyboard (GAP-084)", () => {
  let viewport: FakeVisualViewport;
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 390,
      bottom: 600,
      width: 390,
      height: 600,
      toJSON: () => ({}),
    } as DOMRect);
    vi.stubGlobal("innerHeight", 600);
    viewport = new FakeVisualViewport();
    vi.stubGlobal("visualViewport", viewport);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const shell = (
    props: Partial<React.ComponentProps<typeof AdaptiveMapShell>> = {},
  ) => {
    let layout: AdaptiveMapLayoutSnapshot | undefined;
    const view = render(
      <AdaptiveMapShell
        map={<div />}
        panel={<div>Search results</div>}
        panelPresentation="bottom"
        onLayoutChange={(next) => (layout = next)}
        {...props}
      />,
    );
    return { view, layout: () => layout! };
  };

  const keyboardUp = (height: number) =>
    act(() => {
      viewport.height = 600 - height;
      viewport.dispatchEvent(new Event("resize"));
    });

  it("keeps the sheet above the keyboard with no safeAreaInsets from the product", () => {
    const expected = shell({ safeAreaInsets: { bottom: 300 } }).layout();
    const expectedPanel = expected.panelBounds;
    document.body.innerHTML = "";
    const { layout } = shell();
    const before = layout().panelBounds;
    keyboardUp(300);
    expect(layout().panelBounds).toEqual(expectedPanel);
    expect(layout().panelBounds).not.toEqual(before);
  });

  it("goes back down when the keyboard does", () => {
    const { layout } = shell();
    const before = layout().panelBounds;
    keyboardUp(300);
    keyboardUp(0);
    expect(layout().panelBounds).toEqual(before);
  });

  it("takes the larger of the keyboard and the product's own bottom inset", () => {
    const expected = shell({ safeAreaInsets: { bottom: 340 } }).layout()
      .panelBounds;
    document.body.innerHTML = "";
    const { layout } = shell({ safeAreaInsets: { bottom: 340 } });
    keyboardUp(300);
    expect(layout().panelBounds).toEqual(expected);
  });

  it("does not take a pinch zoom for a keyboard", () => {
    const { layout } = shell();
    const before = layout().panelBounds;
    act(() => {
      viewport.scale = 2;
      viewport.height = 300;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(layout().panelBounds).toEqual(before);
  });

  it("follows no keyboard when the product says so", () => {
    const { layout } = shell({ followsKeyboard: false });
    const before = layout().panelBounds;
    keyboardUp(300);
    expect(layout().panelBounds).toEqual(before);
  });
});
