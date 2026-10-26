import type React from "react";

/**
 * Backdrop's cut-out (GAP-189): what a target can be, where it is, and the
 * scrim's clip-path that leaves it out of the dim.
 */

/** A box in the viewport's coordinates, as `getBoundingClientRect()` gives one. */
export interface BackdropRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Something that says where it is when asked: a virtual element. */
export interface BackdropVirtualElement {
  getBoundingClientRect(): BackdropRect;
}

/** One thing to light. */
export type BackdropTargetItem =
  | Element
  | React.RefObject<Element | null>
  | BackdropVirtualElement
  | BackdropRect
  | null
  | undefined;

/** What to light: one thing, or a list lit as the one box round them all. */
export type BackdropTarget = BackdropTargetItem | readonly BackdropTargetItem[];

/** A resolved target: an element, a virtual element, or a fixed rect. */
type Source = Element | BackdropVirtualElement | BackdropRect;

/** The cut-out, in the backdrop's own coordinates. */
interface Hole {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** The focus ring's width: the ring sits this far outside the cut-out. */
const RING = 2;

const isElement = (value: unknown): value is Element =>
  !!value && (value as Node).nodeType === 1;

const measures = (value: unknown): value is BackdropVirtualElement =>
  typeof (value as BackdropVirtualElement)?.getBoundingClientRect ===
  "function";

/** The things `target` names now: a ref is read as it stands. */
function resolve(target: BackdropTarget): Source[] {
  const sources: Source[] = [];
  for (let item of (Array.isArray(target) ? target : [target]) as unknown[]) {
    if (item && typeof item === "object" && "current" in item)
      item = (item as React.RefObject<unknown>).current;
    if (
      isElement(item) ||
      measures(item) ||
      (item && Number.isFinite((item as BackdropRect).width))
    )
      sources.push(item as Source);
  }
  return sources;
}

const box = (rect: BackdropRect | null): Box | null =>
  rect && (rect.width > 0 || rect.height > 0)
    ? {
        l: rect.left,
        t: rect.top,
        r: rect.left + rect.width,
        b: rect.top + rect.height,
      }
    : null;

const unite = (boxes: (Box | null)[]) =>
  boxes.reduce<Box | null>(
    (all, next) =>
      !next || !all
        ? all || next
        : {
            l: Math.min(all.l, next.l),
            t: Math.min(all.t, next.t),
            r: Math.max(all.r, next.r),
            b: Math.max(all.b, next.b),
          },
    null,
  );

/**
 * A source's box. An element that draws no box of its own
 * (`display: contents`, as the Vue harness's wrappers are) is the box round
 * its children; one with no box at all (`display: none`) lights nothing.
 */
function boxOf(source: Source): Box | null {
  if (isElement(source)) {
    const view = source.ownerDocument.defaultView;
    if (view?.getComputedStyle(source).display === "contents")
      return unite(Array.from(source.children).map(boxOf));
  }
  return box(measures(source) ? source.getBoundingClientRect() : source);
}

/** The elements that draw a source's box: a `display: contents` one's children. */
const drawers = (element: Element, view: Window): Element[] =>
  view.getComputedStyle(element).display === "contents"
    ? Array.from(element.children).flatMap((child) => drawers(child, view))
    : [element];

/** Every ancestor that can scroll the element, across shadow roots. */
function scrollers(element: Element, view: Window) {
  const found: (Element | Window)[] = [view];
  let node: Element | null = element;
  while (
    (node =
      node.parentElement ?? ((node.getRootNode() as ShadowRoot).host || null))
  ) {
    const style = view.getComputedStyle(node);
    if (
      /auto|scroll|overlay|hidden/.test(
        style.overflow + style.overflowX + style.overflowY,
      )
    )
      found.push(node);
  }
  return found;
}

const n = (value: number) => Math.round(value * 100) / 100;

/**
 * The scrim's clip-path: its own box, clockwise, and the cut-out as a rounded
 * rectangle drawn the other way, so the default nonzero rule leaves it out.
 * Hit testing follows clip-path, so the cut-out takes no pointer either.
 */
function clipPath(width: number, height: number, { x, y, w, h, r }: Hole) {
  const arc = (toX: number, toY: number) =>
    `A${n(r)} ${n(r)} 0 0 0 ${n(toX)} ${n(toY)}`;
  return `path("M0 0H${n(width)}V${n(height)}H0ZM${n(x + r)} ${n(y)}${arc(x, y + r)}V${n(y + h - r)}${arc(x + r, y + h)}H${n(x + w - r)}${arc(x + w, y + h - r)}V${n(y + r)}${arc(x + w - r, y)}Z")`;
}

/** A CSS `cubic-bezier()` as a function of progress; else the standard curve. */
function easing(value: string): (t: number) => number {
  const parts = value
    .match(/cubic-bezier\(([^)]*)\)/)?.[1]
    .split(",")
    .map(Number);
  const [x1, y1, x2, y2] =
    parts?.length === 4 && parts.every(Number.isFinite)
      ? parts
      : [0.4, 0, 0.2, 1];
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (progress) => {
    // x is monotonic in t for a CSS easing: bisect for the t that gives it.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
      const t = (lo + hi) / 2;
      if (at(x1, x2, t) < progress) lo = t;
      else hi = t;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

const token = (style: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

const same = (a: Source, b: Source) =>
  a === b ||
  (!isElement(a) &&
    !isElement(b) &&
    ["top", "left", "width", "height"].every(
      (key) =>
        (measures(a) ? a.getBoundingClientRect() : a)[key as "top"] ===
        (measures(b) ? b.getBoundingClientRect() : b)[key as "top"],
    ));

/**
 * One backdrop's cut-out: it reads the target, draws the scrim's clip-path
 * and the ring, and listens where the target can move. A new target is
 * glided to from where the cut-out was, over the standard duration, unless
 * motion is reduced or the cut-out has not been painted yet; a scroll, a
 * resize or a render draws it where the target is at once.
 */
export function createCutout() {
  let root: HTMLElement | null = null;
  let ring: HTMLElement | null = null;
  let sources: Source[] = [];
  let padding: number | undefined;
  let radius: number | undefined;
  let drawn: Hole | null = null;
  let glide: {
    from: Hole;
    start: number;
    ms: number;
    ease: (t: number) => number;
  } | null = null;
  let frame = 0;
  // Whether a frame has painted the cut-out: only then is it glided from.
  let seen = false;
  let seeing = 0;
  let unlisten: (() => void) | null = null;

  const view = () => root?.ownerDocument.defaultView ?? null;

  const measure = (): Hole | null => {
    const lit = unite(sources.map(boxOf));
    const win = view();
    if (!root || !win || !lit) return null;
    const style = win.getComputedStyle(root);
    const p = padding ?? token(style, "--primitives-layout-spacing-100", 8);
    const origin = root.getBoundingClientRect();
    return {
      x: lit.l - origin.left - p,
      y: lit.t - origin.top - p,
      w: lit.r - lit.l + 2 * p,
      h: lit.b - lit.t + 2 * p,
      r: radius ?? token(style, "--semantics-radius-control", 16),
    };
  };

  const paint = (hole: Hole | null) => {
    const win = view();
    const appearing = !drawn;
    drawn = hole;
    if (!root || !win) return;
    if (!hole) {
      win.cancelAnimationFrame(seeing);
      seen = false;
      seeing = 0;
      root.style.removeProperty("clip-path");
      root.removeAttribute("data-lit");
      return;
    }
    if (appearing && !seen && !seeing)
      seeing = win.requestAnimationFrame(() => {
        seeing = win.requestAnimationFrame(() => {
          seen = true;
          seeing = 0;
        });
      });
    const r = Math.max(0, Math.min(hole.r, hole.w / 2, hole.h / 2));
    const origin = root.getBoundingClientRect();
    root.style.setProperty(
      "clip-path",
      clipPath(origin.width, origin.height, { ...hole, r }),
    );
    root.setAttribute("data-lit", "");
    if (ring)
      Object.assign(ring.style, {
        transform: `translate(${hole.x - RING}px, ${hole.y - RING}px)`,
        width: `${hole.w + 2 * RING}px`,
        height: `${hole.h + 2 * RING}px`,
        borderRadius: `${r + RING}px`,
      });
  };

  const stop = () => {
    view()?.cancelAnimationFrame(frame);
    glide = null;
  };

  /** One frame of a glide: from where it began to where the target is now. */
  const step = () => {
    const win = view();
    const to = measure();
    if (!glide || !win || !to) {
      stop();
      if (!to) paint(null);
      return;
    }
    const progress = Math.min(
      1,
      (win.performance.now() - glide.start) / glide.ms,
    );
    const e = glide.ease(progress);
    const from = glide.from;
    const mix = (key: keyof Hole) => from[key] + (to[key] - from[key]) * e;
    paint({ x: mix("x"), y: mix("y"), w: mix("w"), h: mix("h"), r: mix("r") });
    if (progress < 1) frame = win.requestAnimationFrame(step);
    else glide = null;
  };

  const update = (retarget: boolean) => {
    const win = view();
    const hole = measure();
    if (!root || !win || !hole) {
      stop();
      if (drawn) paint(null);
      return;
    }
    if (retarget && drawn && seen) {
      const style = win.getComputedStyle(root);
      const time = style
        .getPropertyValue("--semantics-motion-duration-standard")
        .trim();
      const ms =
        (time ? parseFloat(time) * (time.endsWith("ms") ? 1 : 1000) : 280) *
        token(style, "--semantics-motion-duration-scale", 1);
      const reduced =
        !!root.closest('[data-kozmos-motion="reduced"]') ||
        !!win.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && ms > 0) {
        stop();
        glide = {
          from: drawn,
          start: win.performance.now(),
          ms,
          ease: easing(
            style.getPropertyValue("--semantics-motion-easing-standard"),
          ),
        };
        frame = win.requestAnimationFrame(step);
        return;
      }
    }
    // A glide in flight reads the target every frame.
    if (!glide) paint(hole);
  };

  /** Listen where the target can move: its scrollers, its size, the window's. */
  const listen = () => {
    unlisten?.();
    unlisten = null;
    const win = view() as (Window & typeof globalThis) | null;
    if (!root || !win || !sources.length) return;
    const move = () => update(false);
    const scrolled = new Set<Element | Window>([win]);
    const observer = win.ResizeObserver ? new win.ResizeObserver(move) : null;
    observer?.observe(root);
    for (const source of sources)
      if (isElement(source)) {
        for (const drawer of drawers(source, win)) observer?.observe(drawer);
        for (const scroller of scrollers(source, win)) scrolled.add(scroller);
      }
    for (const scroller of scrolled)
      scroller.addEventListener("scroll", move, { passive: true });
    win.addEventListener("resize", move);
    unlisten = () => {
      for (const scroller of scrolled)
        scroller.removeEventListener("scroll", move);
      win.removeEventListener("resize", move);
      observer?.disconnect();
    };
  };

  const release = () => {
    stop();
    unlisten?.();
    unlisten = null;
    sources = [];
    paint(null);
  };

  return {
    /**
     * After every render: read the target again (a ref is read as it
     * stands), listen afresh if it names other things, and redraw. With no
     * target to light, the cut-out is let go.
     */
    sync(
      nextRoot: HTMLElement | null,
      nextRing: HTMLElement | null,
      target: BackdropTarget,
      nextPadding?: number,
      nextRadius?: number,
    ) {
      if (nextRoot !== root) release();
      root = nextRoot;
      ring = nextRing;
      padding = nextPadding;
      radius = nextRadius;
      const next = nextRoot && nextRing ? resolve(target) : [];
      const changed =
        next.length !== sources.length ||
        next.some((source, index) => !same(source, sources[index]));
      if (changed) {
        sources = next;
        listen();
      }
      update(changed);
    },
    release,
  };
}
