// The bottom sheet's detents and the rules that move between them: the
// prototype's, driven and measured (docs/pointr-prototype-initial-sheet-
// 2026-09-20.md §1–§2), shared with the iOS and Compose shells. Pure, so
// every rule is tested without a pointer.

/** Where the bottom sheet can rest. */
export type PanelDetent =
  /** A peek: a fifth of the shell, or the content's peek anchor (`panelPeekAnchor`). */
  | "collapsed"
  /** The resting height, where the map and the sheet share the shell. */
  | "medium"
  /** Nearly the whole shell, for reading a long sheet. */
  | "large"
  /** As tall as the sheet's content, between collapsed and large. */
  | "content"
  /** A share of the shell's height. */
  | { fraction: number }
  /** An exact height in pixels. */
  | { height: number };

export const PANEL_DETENT_RULES = {
  collapsed: 0.2,
  medium: 0.54,
  large: 0.94,
  /** A collapsed sheet still has to fit the handle and a header row. */
  collapsedFloor: 112,
  /** …but never takes more than this of a short shell. */
  collapsedCap: 0.4,
  /** An anchored peek stays within these shares of the shell. */
  peekFloor: 0.24,
  peekCap: 0.72,
  /** The margin under a peek anchor. */
  peekMargin: 16,
  /** Outside this range there is either no map or no sheet worth showing. */
  minFraction: 0.12,
  maxFraction: 0.94,
} as const;

export interface PanelDetentMeasures {
  /** The sheet's content height, for the content detent; 0 until measured. */
  contentHeight?: number;
  /** The bottom edge of the content's peek anchor from the sheet's top; 0 when none. */
  peekBottom?: number;
  /**
   * The bottom edge of the sheet's panel header from the sheet's top; 0 when
   * there is none. A floor for the collapsed detent, not an anchor: see
   * `panelDetentHeight`.
   */
  headerBottom?: number;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/** The collapsed detent when the content marks a peek anchor. */
export function anchoredCollapsedHeight(
  peekBottom: number,
  shellHeight: number,
): number {
  return clamp(
    peekBottom + PANEL_DETENT_RULES.peekMargin,
    shellHeight * PANEL_DETENT_RULES.peekFloor,
    shellHeight * PANEL_DETENT_RULES.peekCap,
  );
}

/** A detent's height in a shell of `shellHeight` pixels. */
export function panelDetentHeight(
  detent: PanelDetent,
  shellHeight: number,
  measures: PanelDetentMeasures = {},
): number {
  const rules = PANEL_DETENT_RULES;
  const largest = shellHeight * rules.large;
  if (detent === "collapsed") {
    if (measures.peekBottom && measures.peekBottom > 0)
      return anchoredCollapsedHeight(measures.peekBottom, shellHeight);
    const resting = Math.min(
      Math.max(shellHeight * rules.collapsed, rules.collapsedFloor),
      shellHeight * rules.collapsedCap,
    );
    // A panel header stays put above the content, so a collapsed sheet has to
    // show all of it. It raises the resting height only when it would not
    // fit: treated as an anchor, its quarter-of-the-shell floor lifted every
    // search sheet with a small header above the prototype's fifth (row 73).
    if (measures.headerBottom && measures.headerBottom > 0)
      return Math.max(
        resting,
        Math.min(
          measures.headerBottom + rules.peekMargin,
          shellHeight * rules.peekCap,
        ),
      );
    return resting;
  }
  if (detent === "medium") return shellHeight * rules.medium;
  if (detent === "large") return largest;
  if (detent === "content") {
    if (!measures.contentHeight || measures.contentHeight <= 0)
      return shellHeight * rules.medium;
    return clamp(
      measures.contentHeight,
      panelDetentHeight("collapsed", shellHeight, measures),
      largest,
    );
  }
  if ("fraction" in detent)
    return (
      shellHeight * clamp(detent.fraction, rules.minFraction, rules.maxFraction)
    );
  return clamp(detent.height, 0, largest);
}

export function panelDetentKey(detent: PanelDetent): string {
  if (typeof detent === "string") return detent;
  return "fraction" in detent
    ? `fraction:${detent.fraction}`
    : `height:${detent.height}`;
}

export function panelDetentEquals(a: PanelDetent, b: PanelDetent): boolean {
  return panelDetentKey(a) === panelDetentKey(b);
}

/** The offered detents in ascending height, one per distinct height. */
export function orderPanelDetents(
  detents: readonly PanelDetent[],
  shellHeight: number,
  measures: PanelDetentMeasures = {},
): PanelDetent[] {
  const seen = new Set<number>();
  return [...detents]
    .sort(
      (a, b) =>
        panelDetentHeight(a, shellHeight, measures) -
        panelDetentHeight(b, shellHeight, measures),
    )
    .filter((detent) => {
      const height = Math.round(
        panelDetentHeight(detent, shellHeight, measures),
      );
      if (seen.has(height)) return false;
      seen.add(height);
      return true;
    });
}

/** The offered detent closest to a height: where a drag snaps once it ends. */
export function nearestPanelDetent(
  detents: readonly PanelDetent[],
  height: number,
  shellHeight: number,
  measures: PanelDetentMeasures = {},
): PanelDetent | undefined {
  let best: PanelDetent | undefined;
  let bestDistance = Infinity;
  for (const detent of orderPanelDetents(detents, shellHeight, measures)) {
    const distance = Math.abs(
      panelDetentHeight(detent, shellHeight, measures) - height,
    );
    if (distance < bestDistance) {
      best = detent;
      bestDistance = distance;
    }
  }
  return best;
}

/** What a drag that starts on the sheet does, decided once at its first move. */
export type PanelDragKind = "content" | "sheet";

/**
 * The prototype's rule: a sideways move is the content's; at the largest
 * detent an upward drag scrolls the content, and a downward one scrolls it
 * back to its top before the sheet moves; below the largest detent every
 * vertical drag moves the sheet.
 */
export function decidePanelDrag(input: {
  dx: number;
  dy: number;
  atLargestDetent: boolean;
  scrollTop: number;
}): PanelDragKind {
  if (Math.abs(input.dx) > Math.abs(input.dy)) return "content";
  if (input.atLargestDetent && (input.dy < 0 || input.scrollTop > 0))
    return "content";
  return "sheet";
}

/** Movement below this reads as a tap rather than a drag. */
export const PANEL_DRAG_SLOP = 6;

export function panelDetentDescription(detent: PanelDetent): string {
  if (detent === "collapsed") return "Collapsed";
  if (detent === "medium") return "Half height";
  if (detent === "large") return "Expanded";
  if (detent === "content") return "Fitted to content";
  if ("fraction" in detent)
    return `${Math.round(detent.fraction * 100)} percent`;
  return `${Math.round(detent.height)} pixels`;
}
