import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MapOverlay } from "./MapOverlay";

/**
 * A ResizeObserver the test drives by hand, and the stack's overflow as the
 * test says it is: jsdom lays nothing out, so every size is zero.
 */
const observers: { callback: ResizeObserverCallback; targets: Element[] }[] =
  [];
class DrivenResizeObserver {
  private entry: { callback: ResizeObserverCallback; targets: Element[] };
  constructor(callback: ResizeObserverCallback) {
    this.entry = { callback, targets: [] };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.entry.targets = [];
  }
}
function measure(stack: HTMLElement, scrollHeight: number, clientHeight = 120) {
  Object.defineProperty(stack, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(stack, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
}
function overflow(
  stack: HTMLElement,
  scrollHeight: number,
  clientHeight = 120,
) {
  measure(stack, scrollHeight, clientHeight);
  act(() => {
    for (const { callback, targets } of observers)
      if (targets.includes(stack))
        callback([], {} as unknown as ResizeObserver);
  });
}
const realResizeObserver = globalThis.ResizeObserver;
afterEach(() => {
  globalThis.ResizeObserver = realResizeObserver;
  observers.length = 0;
});

describe("MapOverlay", () => {
  it("renders overlay content", () => {
    render(
      <MapOverlay position="bottom-right">
        <button type="button">Open place</button>
      </MapOverlay>,
    );

    expect(
      screen.getByRole("button", { name: "Open place" }),
    ).toBeInTheDocument();
  });

  it("applies the requested position", () => {
    const { container } = render(
      <MapOverlay position="top-center">Panel</MapOverlay>,
    );

    expect(container.firstChild).toHaveClass("top-[var(--map-overlay-top)]");
    expect(container.firstChild).toHaveClass("left-1/2");
    expect(container.firstChild).toHaveStyle({
      "--map-overlay-top": "calc(env(safe-area-inset-top) + 1rem + 0px)",
    });
  });

  it("marks its stack as scrolling only while what it holds overflows", () => {
    // Decisions 46 and the Linux WebKit fix: the stack passes presses in its
    // room to the map, except while it scrolls. Linux WebKit, as CI runs it,
    // scrolls a scroll box from a wheel only if the box takes presses.
    globalThis.ResizeObserver =
      DrivenResizeObserver as unknown as typeof ResizeObserver;
    const { container } = render(
      <MapOverlay position="top-left">
        <button type="button">Zoom in</button>
      </MapOverlay>,
    );
    const stack = container.querySelector(
      ".kozmos-map-overlay-stack",
    ) as HTMLElement;

    overflow(stack, 120);
    expect(stack).not.toHaveAttribute("data-scrolls");
    overflow(stack, 300);
    expect(stack).toHaveAttribute("data-scrolls");
    overflow(stack, 120);
    expect(stack).not.toHaveAttribute("data-scrolls");
  });

  it("marks its stack again when a part is added or taken away", async () => {
    // A part added can overflow the stack with no change to the stack's own
    // size, which a max height holds, so no resize would tell it.
    globalThis.ResizeObserver =
      DrivenResizeObserver as unknown as typeof ResizeObserver;
    const { container, rerender } = render(
      <MapOverlay position="top-left">
        <button type="button">Zoom in</button>
      </MapOverlay>,
    );
    const stack = container.querySelector(
      ".kozmos-map-overlay-stack",
    ) as HTMLElement;
    expect(stack).not.toHaveAttribute("data-scrolls");

    measure(stack, 300);
    rerender(
      <MapOverlay position="top-left">
        <button type="button">Zoom in</button>
        <button type="button">Zoom out</button>
      </MapOverlay>,
    );
    await waitFor(() => expect(stack).toHaveAttribute("data-scrolls"));
    // The part added is watched for its size too.
    const added = screen.getByRole("button", { name: "Zoom out" });
    expect(observers.some(({ targets }) => targets.includes(added))).toBe(true);

    measure(stack, 120);
    rerender(
      <MapOverlay position="top-left">
        <button type="button">Zoom in</button>
      </MapOverlay>,
    );
    await waitFor(() => expect(stack).not.toHaveAttribute("data-scrolls"));
  });
});
