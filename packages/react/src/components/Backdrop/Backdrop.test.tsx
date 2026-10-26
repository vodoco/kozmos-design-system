import { act, render } from "@testing-library/react";
import React from "react";
import { flushSync } from "react-dom";
import { Backdrop } from "./Backdrop";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

describe("Backdrop", () => {
  it("renders correctly", () => {
    const { container } = render(<Backdrop />);
    expect(container.firstChild).toHaveClass("fixed inset-0");
  });

  it("does not render when not visible", () => {
    const { container } = render(<Backdrop visible={false} />);
    expect(container.firstChild).toBeNull();
  });
});

// GAP-189: a tour dims the page and lifts the one control a step points at.
// jsdom lays nothing out, so each test places its boxes: every element reads
// the viewport (1024 × 768 from 0, 0) unless it is given a box of its own.
const boxes = new Map<Element, DOMRect>();
function place(
  element: Element,
  left: number,
  top: number,
  w: number,
  h: number,
) {
  boxes.set(element, new DOMRect(left, top, w, h));
}

/** The ring's box, as its inline style draws it. */
function ringOf(root: Element) {
  const ring = root.querySelector<HTMLElement>(".kozmos-backdrop-ring");
  if (!ring) return null;
  const match = ring.style.transform.match(
    /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/,
  );
  return {
    element: ring,
    left: match ? Number(match[1]) : NaN,
    top: match ? Number(match[2]) : NaN,
    width: parseFloat(ring.style.width),
    height: parseFloat(ring.style.height),
    radius: parseFloat(ring.style.borderRadius),
  };
}

/**
 * The cut-out in the scrim's clip-path: the bounding box of every subpath
 * after the first, which is the scrim's own outline.
 */
function holeOf(root: HTMLElement) {
  const clip = root.style.getPropertyValue("clip-path");
  const body = clip.match(/path\("([^"]*)"\)/)?.[1];
  if (!body) return null;
  const subpaths = body.split(/(?=M)/).slice(1);
  if (subpaths.length === 0) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const subpath of subpaths) {
    // Absolute commands only: M x y, H x, V y, A rx ry rot large sweep x y.
    for (const [, command, args] of subpath.matchAll(/([MHVA])([^MHVAZ]*)/g)) {
      const n = args
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (command === "M") {
        xs.push(n[0]);
        ys.push(n[1]);
      }
      if (command === "H") xs.push(n[0]);
      if (command === "V") ys.push(n[0]);
      if (command === "A") {
        xs.push(n[5]);
        ys.push(n[6]);
      }
    }
  }
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

describe("Backdrop target (GAP-189)", () => {
  beforeEach(() => {
    boxes.clear();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return boxes.get(this) ?? new DOMRect(0, 0, 1024, 768);
      },
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("with no target dims the whole page, as it did: no cut-out and no ring", () => {
    const { container } = render(<Backdrop />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("fixed inset-0 z-50 bg-overlay-scrim");
    expect(root.style.getPropertyValue("clip-path")).toBe("");
    expect(root.querySelector(".kozmos-backdrop-ring")).toBeNull();
    expect(root).not.toHaveAttribute("data-lit");
  });

  function Tour(
    props: Partial<React.ComponentProps<typeof Backdrop>> & {
      onTarget?: (node: HTMLButtonElement | null) => void;
    },
  ) {
    const ref = React.useRef<HTMLButtonElement>(null);
    const { onTarget, ...rest } = props;
    return (
      <>
        <button
          ref={(node) => {
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current =
              node;
            if (node) place(node, 100, 50, 120, 44);
            onTarget?.(node);
          }}
          style={{ position: "relative", zIndex: 1 }}
        >
          Update
        </button>
        <Backdrop data-testid="backdrop" target={ref} {...rest} />
      </>
    );
  }

  it("cuts a ref's element out of the dim, 8 out and rounded 16, and rings it 2 beyond", () => {
    const { getByTestId } = render(<Tour />);
    const root = getByTestId("backdrop");
    expect(root).toHaveAttribute("data-lit");
    // The target's 100, 50, 120 × 44, padded by layout.spacing.100 (8).
    expect(holeOf(root)).toEqual({
      left: 92,
      top: 42,
      right: 228,
      bottom: 102,
    });
    // The ring is the focus ring's 2 outside the cut-out, its radius the
    // cut-out's radius.control (16) and its own 2.
    expect(ringOf(root)).toMatchObject({
      left: 90,
      top: 40,
      width: 140,
      height: 64,
      radius: 18,
    });
    expect(ringOf(root)!.element).toHaveAttribute("aria-hidden", "true");
  });

  it("takes targetPadding and targetRadius in pixels", () => {
    const { getByTestId } = render(<Tour targetPadding={0} targetRadius={4} />);
    const root = getByTestId("backdrop");
    expect(holeOf(root)).toEqual({
      left: 100,
      top: 50,
      right: 220,
      bottom: 94,
    });
    expect(ringOf(root)).toMatchObject({
      left: 98,
      top: 48,
      width: 124,
      height: 48,
      radius: 6,
    });
  });

  it("reads its default padding and radius from the tokens", () => {
    const { getByTestId } = render(
      <Tour
        style={
          {
            "--primitives-layout-spacing-100": "12",
            "--semantics-radius-control": "10",
          } as React.CSSProperties
        }
      />,
    );
    expect(ringOf(getByTestId("backdrop"))).toMatchObject({
      left: 86,
      top: 36,
      width: 148,
      height: 72,
      radius: 12,
    });
  });

  it("lights an element, a virtual element, a rect, and a list as one box", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);
    place(a, 10, 10, 20, 20);
    place(b, 200, 300, 50, 10);
    const virtual = {
      getBoundingClientRect: () => new DOMRect(40, 60, 10, 10),
    };
    const cases: [React.ComponentProps<typeof Backdrop>["target"], object][] = [
      [a, { left: 10, top: 10, right: 30, bottom: 30 }],
      [virtual, { left: 40, top: 60, right: 50, bottom: 70 }],
      [
        { top: 5, left: 6, width: 7, height: 8 },
        { left: 6, top: 5, right: 13, bottom: 13 },
      ],
      [[a, b], { left: 10, top: 10, right: 250, bottom: 310 }],
      [[a, null, virtual], { left: 10, top: 10, right: 50, bottom: 70 }],
    ];
    for (const [target, hole] of cases) {
      const { getByTestId, unmount } = render(
        <Backdrop data-testid="backdrop" target={target} targetPadding={0} />,
      );
      expect(holeOf(getByTestId("backdrop"))).toEqual(hole);
      unmount();
    }
    a.remove();
    b.remove();
  });

  it("lights an element that draws no box of its own by its children's box, as the Vue harness's wrappers are", () => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "contents";
    const first = document.createElement("span");
    const second = document.createElement("span");
    wrapper.append(first, second);
    document.body.append(wrapper);
    place(wrapper, 0, 0, 0, 0);
    place(first, 20, 30, 10, 10);
    place(second, 50, 30, 10, 20);
    const { getByTestId } = render(
      <Backdrop data-testid="backdrop" target={wrapper} targetPadding={0} />,
    );
    expect(holeOf(getByTestId("backdrop"))).toEqual({
      left: 20,
      top: 30,
      right: 60,
      bottom: 50,
    });
    wrapper.remove();
  });

  it("measures the cut-out from its own box, so a backdrop that is not at 0, 0 still lines up", () => {
    const { getByTestId } = render(
      <Tour onTarget={() => {}} className="absolute" targetPadding={0} />,
    );
    const root = getByTestId("backdrop");
    place(root, 40, 20, 600, 400);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(holeOf(root)).toEqual({ left: 60, top: 30, right: 180, bottom: 74 });
  });

  it("dims the whole page when the target is not there: a ref to nothing, an element with no box, an empty list", () => {
    const hidden = document.createElement("div");
    document.body.append(hidden);
    place(hidden, 0, 0, 0, 0);
    for (const target of [{ current: null }, hidden, []]) {
      const { getByTestId, unmount } = render(
        <Backdrop data-testid="backdrop" target={target} />,
      );
      const root = getByTestId("backdrop");
      expect(root.style.getPropertyValue("clip-path")).toBe("");
      expect(root).not.toHaveAttribute("data-lit");
      unmount();
    }
    hidden.remove();
  });

  it("follows the target when a scroll ancestor or the page scrolls", () => {
    let target: HTMLButtonElement | null = null;
    const { getByTestId } = render(
      <div data-testid="scroller" style={{ overflow: "auto", height: 100 }}>
        <Tour onTarget={(node) => (target = node)} targetPadding={0} />
      </div>,
    );
    const root = getByTestId("backdrop");
    place(target!, 100, 10, 120, 44);
    act(() => {
      getByTestId("scroller").dispatchEvent(new Event("scroll"));
    });
    expect(holeOf(root)).toEqual({
      left: 100,
      top: 10,
      right: 220,
      bottom: 54,
    });
    place(target!, 100, -20, 120, 44);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(holeOf(root)).toEqual({
      left: 100,
      top: -20,
      right: 220,
      bottom: 24,
    });
  });

  it("follows the target as it resizes, through a ResizeObserver on it", () => {
    const observers: {
      callback: ResizeObserverCallback;
      observed: Element[];
    }[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observed: Element[] = [];
        constructor(public callback: ResizeObserverCallback) {
          observers.push(this);
        }
        observe(element: Element) {
          this.observed.push(element);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    let target: HTMLButtonElement | null = null;
    const { getByTestId } = render(
      <Tour onTarget={(node) => (target = node)} targetPadding={0} />,
    );
    const observer = observers.find((o) => o.observed.includes(target!));
    expect(observer).toBeDefined();
    place(target!, 100, 50, 200, 44);
    act(() => observer!.callback([], observer as unknown as ResizeObserver));
    expect(holeOf(getByTestId("backdrop"))).toEqual({
      left: 100,
      top: 50,
      right: 300,
      bottom: 94,
    });
    vi.unstubAllGlobals();
  });

  it("leaves the target where it is: its parent, its place among its siblings and its own style", () => {
    let target: HTMLButtonElement | null = null;
    const { getByTestId } = render(
      <section data-testid="host">
        <Tour onTarget={(node) => (target = node)} />
      </section>,
    );
    expect(target!.parentElement).toBe(getByTestId("host"));
    expect(target!.nextElementSibling).toBe(getByTestId("backdrop"));
    expect(target!.getAttribute("style")).toBe(
      "position: relative; z-index: 1;",
    );
    expect(getByTestId("backdrop").contains(target)).toBe(false);
  });

  it("puts nothing focusable in the dim, and keeps it out of the accessibility tree", () => {
    const { getByTestId } = render(<Tour />);
    const root = getByTestId("backdrop");
    expect(root).not.toHaveAttribute("tabindex");
    expect(
      root.querySelectorAll("a, button, input, select, textarea, [tabindex]"),
    ).toHaveLength(0);
    for (const child of Array.from(root.children))
      expect(child).toHaveAttribute("aria-hidden", "true");
  });

  function stubMotion(reduced: boolean) {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: reduced && query.includes("prefers-reduced-motion: reduce"),
          media: query,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
  }

  function Steps({ step }: { step: number }) {
    const first = React.useRef<HTMLButtonElement>(null);
    const second = React.useRef<HTMLButtonElement>(null);
    return (
      <>
        <button
          ref={(node) => {
            (
              first as React.MutableRefObject<HTMLButtonElement | null>
            ).current = node;
            if (node) place(node, 0, 0, 100, 40);
          }}
        >
          One
        </button>
        <button
          ref={(node) => {
            (
              second as React.MutableRefObject<HTMLButtonElement | null>
            ).current = node;
            if (node) place(node, 400, 300, 100, 40);
          }}
        >
          Two
        </button>
        <Backdrop
          data-testid="backdrop"
          target={step === 0 ? first : second}
          targetPadding={0}
        />
      </>
    );
  }

  it("glides to a new target over the standard duration", () => {
    stubMotion(false);
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "performance", "Date"],
    });
    const { getByTestId, rerender } = render(<Steps step={0} />);
    const root = getByTestId("backdrop");
    expect(holeOf(root)).toEqual({ left: 0, top: 0, right: 100, bottom: 40 });
    // The first cut-out is painted.
    act(() => vi.advanceTimersByTime(40));
    flushSync(() => rerender(<Steps step={1} />));
    // The glide has begun from where the cut-out was.
    expect(holeOf(root)).toEqual({ left: 0, top: 0, right: 100, bottom: 40 });
    act(() => vi.advanceTimersByTime(140));
    const mid = holeOf(root)!;
    expect(mid.left).toBeGreaterThan(0);
    expect(mid.left).toBeLessThan(400);
    act(() => vi.advanceTimersByTime(400));
    expect(holeOf(root)).toEqual({
      left: 400,
      top: 300,
      right: 500,
      bottom: 340,
    });
    vi.unstubAllGlobals();
  });

  it("draws a target that arrives before the first cut-out is painted where it is, with no glide", () => {
    stubMotion(false);
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "performance", "Date"],
    });
    const { getByTestId, rerender } = render(<Steps step={0} />);
    flushSync(() => rerender(<Steps step={1} />));
    expect(holeOf(getByTestId("backdrop"))).toEqual({
      left: 400,
      top: 300,
      right: 500,
      bottom: 340,
    });
    vi.unstubAllGlobals();
  });

  it("under reduced motion moves to a new target at once", () => {
    stubMotion(true);
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "performance", "Date"],
    });
    const { getByTestId, rerender } = render(<Steps step={0} />);
    act(() => vi.advanceTimersByTime(40));
    flushSync(() => rerender(<Steps step={1} />));
    expect(holeOf(getByTestId("backdrop"))).toEqual({
      left: 400,
      top: 300,
      right: 500,
      bottom: 340,
    });
    vi.unstubAllGlobals();
  });

  it("under the config's reduced motion moves at once too", () => {
    stubMotion(false);
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "performance", "Date"],
    });
    const { getByTestId, rerender } = render(
      <div data-kozmos-motion="reduced">
        <Steps step={0} />
      </div>,
    );
    act(() => vi.advanceTimersByTime(40));
    flushSync(() =>
      rerender(
        <div data-kozmos-motion="reduced">
          <Steps step={1} />
        </div>,
      ),
    );
    expect(holeOf(getByTestId("backdrop"))).toEqual({
      left: 400,
      top: 300,
      right: 500,
      bottom: 340,
    });
    vi.unstubAllGlobals();
  });

  it("still forwards its ref, and renders nothing while hidden", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender, container } = render(
      <Backdrop
        ref={ref}
        target={{ top: 0, left: 0, width: 10, height: 10 }}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    rerender(
      <Backdrop
        ref={ref}
        visible={false}
        target={{ top: 0, left: 0, width: 10, height: 10 }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
