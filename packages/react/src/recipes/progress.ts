/**
 * Progress's recipe: the bar, the ring and the track, for every framework
 * that draws them. React's `Progress` and `ProgressTrack` and Vue's
 * `KozmosProgress` and `KozmosProgressTrack` build their elements from it:
 * the value each draws, the ring's geometry and tone, the classes, when a
 * wait speaks and which span a track paints. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { EMOTIONS, type Emotion } from "./emotion";

/**
 * A ring's diameter and stroke width, in px, by size: the layout spacing
 * tokens 600, 900 and 1000 across, and 50, 100 and 150 thick. The box takes
 * its size from the same tokens in the stylesheet; these draw inside it.
 */
export const PROGRESS_RING = {
  sm: [48, 4],
  md: [96, 8],
  lg: [128, 12],
} as const;

export type ProgressRingSize = keyof typeof PROGRESS_RING;

/**
 * What a value draws, against its total: the total (`max` when it is a
 * number over 0, else 100), the value drawn, whether it is a value in range,
 * which draws a fill, and how much is done, 0 to 100. A tuple, so React's
 * bundle carries no property names for it.
 *
 * A value over the total is all of it: "16 of 15" is a full ring and a
 * full bar, as SwiftUI's and Compose's are and as `<progress>` has it.
 * Radix would call it unknown and draw none done.
 */
export function progressDrawnValue(
  value: number | null | undefined,
  max: number | null | undefined,
): [
  max: number,
  value: number | null | undefined,
  known: boolean,
  percentage: number,
] {
  const resolvedMax =
    typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100;
  const drawn =
    typeof value === "number" && Number.isFinite(value) && value > resolvedMax
      ? resolvedMax
      : value;
  const known = typeof drawn === "number" && drawn >= 0 && drawn <= resolvedMax;
  return [resolvedMax, drawn, known, known ? (drawn / resolvedMax) * 100 : 0];
}

/**
 * Radix's progressbar, which Vue draws as React's Radix does: its state, and
 * the number it says. `value` is Radix's own, a number in range or null;
 * `max` is Radix's, a number over 0 or 100.
 */
export function progressbarState(
  value: number | null | undefined,
  max: number | null | undefined,
): { value: number | null; max: number; state: string } {
  const total =
    typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100;
  const current =
    typeof value === "number" &&
    !Number.isNaN(value) &&
    value <= total &&
    value >= 0
      ? value
      : null;
  return {
    value: current,
    max: total,
    state:
      current == null
        ? "indeterminate"
        : current === total
          ? "complete"
          : "loading",
  };
}

/** Radix's own `getValueLabel`: the share, as a whole percentage. */
export const progressDefaultValueLabel = (value: number, max: number) =>
  `${Math.round((value / max) * 100)}%`;

/**
 * A ring's drawing at its size, with `percentage` of it done: its diameter,
 * stroke, centre, radius, viewBox, and the arc's dash and turn, from 12
 * o'clock clockwise; its tone, an emotion (`themed` for anything else), and
 * the arc's colour as a property the stylesheet reads, so forced colours can
 * still replace it; and whether it is done. One call, a tuple, so React's
 * bundle pays for one call and no property names.
 *
 * "100%" is 31.8 wide at 12, in the 28.28 square an `sm` hole holds (owner,
 * 2 Nov), so a whole `sm` ring with no label of the product's draws a check.
 * It says 100%, by a name of its own if it has no other.
 */
export function progressRing(
  size: ProgressRingSize | undefined,
  percentage: number,
  tone: unknown,
  labelled: boolean,
  value: number | null | undefined,
  max: number,
): [
  diameter: number,
  stroke: number,
  centre: number,
  radius: number,
  viewBox: string,
  dasharray: string,
  transform: string,
  tone: Emotion,
  variables: { "--kozmos-progress-ring-tone": string },
  done: boolean,
] {
  const [diameter, stroke] = PROGRESS_RING[size ?? "md"] ?? PROGRESS_RING.md;
  const centre = diameter / 2;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const emotion = EMOTIONS.includes(tone as Emotion)
    ? (tone as Emotion)
    : "themed";
  return [
    diameter,
    stroke,
    centre,
    radius,
    `0 0 ${diameter} ${diameter}`,
    `${(circumference * percentage) / 100} ${circumference}`,
    `rotate(-90 ${centre} ${centre})`,
    emotion,
    {
      "--kozmos-progress-ring-tone": `var(--semantics-emotion-${emotion}-text)`,
    },
    size === "sm" && !labelled && value === max,
  ];
}

/** The ring's elements' classes, each a constant, as React inlined them. */
export const PROGRESS_RING_CLASS = "kozmos-progress-ring";
export const PROGRESS_RING_DIAL_CLASS = "kozmos-progress-ring-dial";
export const PROGRESS_RING_SVG_CLASS = "kozmos-progress-ring-svg";
export const PROGRESS_RING_TRACK_CLASS = "kozmos-progress-ring-track";
export const PROGRESS_RING_ARC_CLASS = "kozmos-progress-ring-arc";
export const PROGRESS_RING_LABEL_CLASS = "kozmos-progress-ring-label";
export const PROGRESS_RING_DONE_CLASS = "kozmos-progress-ring-done";

/**
 * The bar's box (inline, 8 tall and round, or the page's loading bar), its
 * fill or its sweep while it waits (GAP-159), and its name while it waits if
 * the product gave it none: a text label, else "Loading". One call, so
 * React's bundle pays for one.
 */
export function progressBar(
  placement: "inline" | "top" | undefined,
  waiting: boolean,
  label: unknown,
): [className: string, indicatorClassName: string, waitName: string] {
  return [
    `${placement === "top" ? "kozmos-progress-top" : "relative h-2 w-full rounded-pill"} overflow-hidden bg-secondary`,
    waiting ? "kozmos-progress-sweep" : "h-full bg-primary transition-all",
    (typeof label === "string" && label) || "Loading",
  ];
}

/**
 * When the latest group of waits started. Bars that start waiting within
 * 500 ms of a group's first are that group, and only its first says its
 * words: five uploads starting together are one "Loading", not five. A wait
 * that starts later speaks, even while an earlier, long wait still runs.
 */
let groupStart = -Infinity;

/**
 * Whether a bar that starts waiting now speaks, given the group it opened
 * before (`opened`), so an effect run again for the same wait (React's
 * strict mode) still speaks: the group it holds when it speaks, undefined
 * when it does not.
 */
export function progressWaitSpeaks(
  opened: number | undefined,
): number | undefined {
  const now = Date.now();
  if (opened === groupStart || now - groupStart > 500) {
    if (opened !== groupStart) groupStart = opened = now;
    return opened;
  }
  return undefined;
}

/** A normalized interval on a track, 0 to 1. */
export interface ProgressSpan {
  start: number;
  end: number;
}

/** Whether an interval is one a track draws: finite, in 0–1, and not empty. */
export function isProgressSpan<T extends ProgressSpan>(
  range: T | undefined,
): range is T {
  return (
    !!range &&
    Number.isFinite(range.start) &&
    Number.isFinite(range.end) &&
    range.start >= 0 &&
    range.end <= 1 &&
    range.start < range.end
  );
}

/**
 * What a track paints: its fill (the selected interval in static mode, from
 * zero to a valid position in live mode) and its directional flow, if
 * `motion` asks for one and the page is visible. A tuple, so React's bundle
 * carries no property names for it.
 */
export function progressTrackSpans(
  activeRange: ProgressSpan | undefined,
  value: number | null,
  positionMode: "static" | "live",
  motion: "none" | "directional",
  visible: boolean,
): [fill: ProgressSpan | undefined, flow: ProgressSpan | undefined] {
  const range = isProgressSpan(activeRange) ? activeRange : undefined;
  const position =
    range &&
    value !== null &&
    Number.isFinite(value) &&
    value >= range.start &&
    value <= range.end
      ? value
      : null;
  const fill =
    positionMode === "static"
      ? range
      : position !== null && position > 0
        ? { start: 0, end: position }
        : undefined;
  const flowStart = positionMode === "static" ? range?.start : position;
  const flow =
    motion === "directional" &&
    visible &&
    range &&
    flowStart != null &&
    flowStart < range.end
      ? { start: flowStart, end: range.end }
      : undefined;
  return [fill, flow];
}

/** A span's place on the track, as a style. */
export const progressSpanStyle = (span: ProgressSpan) => ({
  insetInlineStart: `${span.start * 100}%`,
  width: `${(span.end - span.start) * 100}%`,
});

/** The track's elements' classes, each a constant, as React inlined them. */
export const PROGRESS_TRACK_CLASS = "kozmos-progress-track";
export const PROGRESS_TRACK_ACTIVE_CLASS = "kozmos-progress-track-active";
export const PROGRESS_TRACK_FLOW_CLASS = "kozmos-progress-track-flow";
