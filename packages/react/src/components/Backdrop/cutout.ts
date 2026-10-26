import type React from "react";

/**
 * Backdrop's cut-out (GAP-189): what a target can be, where it is, and the
 * scrim's clip-path that leaves it out of the dim. While a backdrop lights a
 * target it reads it every frame, as Floating UI's autoUpdate can, so a
 * target moved by layout above it or by a transform is followed, and a ref
 * filled later is lit; it writes only when the cut-out moves.
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

/**
 * A box from a rect. An element's empty box is no box (`display: none`); a
 * virtual element's or a rect's is a point, lit by the padding round it.
 */
const box = (rect: BackdropRect, point: boolean): Box | null =>
  rect.width > 0 || rect.height > 0 || point
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
 * The elements that draw an element's box: an element with
 * `display: contents` (as the Vue harness's wrappers are) has none of its
 * own, so its children's are read.
 */
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

const KEYS = ["x", "y", "w", "h", "r"] as const;

/**
 * One backdrop's cut-out. While it lights a target it reads it every frame
 * and on each render, scroll and resize, and redraws the scrim's clip-path
 * and the ring only when the cut-out moves. A glide is for the tour moving on:
 * when the elements lit change, the cut-out glides from where it was over the
 * standard duration, unless motion is reduced or it has not been painted
 * yet. A rect or a virtual element that moves is followed, never glided to.
 */
export function createCutout() {
  let root: HTMLElement | null = null;
  let scrim: HTMLElement | null = null;
  let ring: HTMLElement | null = null;
  let target: BackdropTarget;
  let padding = 8;
  let radius = 16;
  // What is lit, by identity: the elements, and the elements that draw them.
  let elements: Element[] = [];
  let boxes: Element[] = [];
  let drawn: Hole | null = null;
  let glide: {
    from: Hole;
    start: number;
    ms: number;
    ease: (t: number) => number;
  } | null = null;
  let frame = 0;
  let frames = 0;
  // The frame the cut-out appeared in: two frames on, it has been painted.
  let shown = 0;
  let unlisten: (() => void) | null = null;

  const view = () => root?.ownerDocument.defaultView ?? null;

  const paint = (hole: Hole | null) => {
    if (
      hole === drawn ||
      (hole &&
        drawn &&
        KEYS.every((key) => Math.abs(hole[key] - drawn![key]) < 0.01))
    )
      return;
    if (!drawn) shown = frames;
    drawn = hole;
    if (!root || !scrim) return;
    if (!hole) {
      scrim.style.removeProperty("clip-path");
      root.removeAttribute("data-lit");
      return;
    }
    const r = Math.max(0, Math.min(hole.r, hole.w / 2, hole.h / 2));
    const origin = root.getBoundingClientRect();
    scrim.style.setProperty(
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

  /** Listen where the target can move: its scrollers, its size, the window's. */
  const listen = (win: Window & typeof globalThis) => {
    unlisten?.();
    const move = () => update();
    const scrolled = new Set<Element | Window>([win]);
    const observer = win.ResizeObserver ? new win.ResizeObserver(move) : null;
    boxes = elements.flatMap((element) => drawers(element, win));
    for (const element of [root!, ...boxes]) observer?.observe(element);
    for (const element of elements)
      for (const scroller of scrollers(element, win)) scrolled.add(scroller);
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

  /** Read the target and redraw the cut-out where it belongs. */
  const update = () => {
    const win = view() as (Window & typeof globalThis) | null;
    if (!root || !win) return;
    // A ref is read as it stands, so one filled later is lit.
    const sources = resolve(target);
    const next = sources.filter(isElement);
    const moved =
      next.length !== elements.length ||
      next.some((element, index) => element !== elements[index]) ||
      boxes.some((element) => !element.isConnected);
    if (moved) {
      elements = next;
      listen(win);
    }
    const lit = unite([
      ...boxes.map((element) => box(element.getBoundingClientRect(), false)),
      ...sources
        .filter((source) => !isElement(source))
        .map((source) =>
          box(
            measures(source)
              ? source.getBoundingClientRect()
              : (source as BackdropRect),
            true,
          ),
        ),
    ]);
    if (!lit) {
      glide = null;
      paint(null);
      return;
    }
    const origin = root.getBoundingClientRect();
    const hole: Hole = {
      x: lit.l - origin.left - padding,
      y: lit.t - origin.top - padding,
      w: lit.r - lit.l + 2 * padding,
      h: lit.b - lit.t + 2 * padding,
      r: radius,
    };
    if (moved && drawn && frames - shown > 1) {
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
      glide =
        !reduced && ms > 0
          ? {
              from: drawn,
              start: win.performance.now(),
              ms,
              ease: easing(
                style.getPropertyValue("--semantics-motion-easing-standard"),
              ),
            }
          : null;
    }
    if (glide) {
      // From where the glide began to where the target is now.
      const progress = Math.min(
        1,
        (win.performance.now() - glide.start) / glide.ms,
      );
      const e = glide.ease(progress);
      const from = glide.from;
      const mixed = { ...hole };
      for (const key of KEYS)
        mixed[key] = from[key] + (hole[key] - from[key]) * e;
      if (progress >= 1) glide = null;
      paint(mixed);
      return;
    }
    paint(hole);
  };

  const loop = () => {
    frames += 1;
    update();
    frame = view()?.requestAnimationFrame(loop) ?? 0;
  };

  const release = () => {
    view()?.cancelAnimationFrame(frame);
    frame = 0;
    unlisten?.();
    unlisten = null;
    elements = [];
    boxes = [];
    glide = null;
    paint(null);
  };

  return {
    /**
     * After every render: take the target and the options, read the token
     * defaults, redraw at once, and read the target every frame while it is
     * lit. With nothing to light, the cut-out is let go.
     */
    sync(
      nextRoot: HTMLElement | null,
      nextScrim: HTMLElement | null,
      nextRing: HTMLElement | null,
      nextTarget: BackdropTarget,
      nextPadding?: number,
      nextRadius?: number,
    ) {
      if (nextRoot !== root || !nextScrim) release();
      root = nextRoot;
      scrim = nextScrim;
      ring = nextRing;
      target = nextTarget;
      const win = view();
      if (!root || !scrim || !win) return;
      const style = win.getComputedStyle(root);
      padding =
        nextPadding ?? token(style, "--primitives-layout-spacing-100", 8);
      radius = nextRadius ?? token(style, "--semantics-radius-control", 16);
      update();
      if (!frame) frame = win.requestAnimationFrame(loop);
    },
    release,
  };
}
