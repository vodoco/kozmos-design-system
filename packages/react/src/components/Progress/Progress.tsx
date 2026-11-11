import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { EMOTIONS, type Emotion } from "../../utils/emotion";

export interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  /**
   * `"linear"`, the default, is the bar. `"circular"` is a ring with an
   * optional `label` in its centre, for a count out of a total (decision
   * 131): it fills from 12 o'clock clockwise, in either reading direction.
   */
  shape?: "linear" | "circular";
  /**
   * A ring's diameter and stroke: `sm` 48 and 4, `md` 96 and 8 (the
   * default), `lg` 128 and 12. A bar has one size.
   */
  size?: "sm" | "md" | "lg";
  /**
   * What a ring shows: "11 Levels Added in total", or a percentage. It
   * names the progress bar, or describes it when `aria-label` or
   * `aria-labelledby` already names it, and the drawn copy is hidden from
   * assistive technology, so it is heard once. An `sm` ring that is
   * complete and has no label draws a check in its hole.
   *
   * A bar draws none. While a bar's value is unknown its label, "Loading"
   * unless one is given, names it and is said once as the wait starts
   * (GAP-159); a bar with a value takes its name from `aria-label`.
   */
  label?: React.ReactNode;
  /**
   * Where a ring's label is drawn: `"center"`, in the hole (the default),
   * or `"end"`, beside the ring at the inline end, so on its left right to
   * left.
   */
  labelPlacement?: "center" | "end";
  /**
   * What a ring's completion means, in Tag's and Button's emotions: its arc
   * is the emotion's text colour, 3:1 or more on the track in both themes.
   * `"themed"`, the default, is the bar's own fill, theme 600.
   */
  tone?: Emotion;
  /**
   * Where a bar sits (GAP-159). `"inline"`, the default, is the 8 tall
   * rounded bar in the flow. `"top"` is the page's loading bar: fixed to the
   * top of the window, edge to edge, 4 tall and square, over the page's
   * content. A ring has one placement.
   */
  placement?: "inline" | "top";
}

/**
 * What an indeterminate bar is called, and says once when it appears, when
 * the product gives no `label` or name of its own.
 */
const LOADING = "Loading";

/**
 * A ring's diameter and stroke width, in px, by size: the layout spacing
 * tokens 600, 900 and 1000 across, and 50, 100 and 150 thick. The box takes
 * its size from the same tokens in the stylesheet; these draw inside it.
 */
const RING = { sm: [48, 4], md: [96, 8], lg: [128, 12] } as const;

interface LinearProgressProps extends Omit<
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
  "value"
> {
  value: number | null | undefined;
  known: boolean;
  percentage: number;
  placement: "inline" | "top";
  label?: React.ReactNode;
}

/**
 * The bar. With a value it fills from the inline start, as far as the value
 * is of the total. With none it is indeterminate (GAP-159): a segment a
 * quarter of the track wide sweeps from the inline start to the inline end
 * every 2 s, linear, for as long as the wait lasts, and stands still in the
 * middle of the track under reduced motion, the system's or
 * DesignConfigProvider's.
 *
 * An indeterminate bar is said once. Its words, `label` or "Loading", name
 * the bar and are put into a polite status beside it after the status is in
 * the page, so a screen reader hears them when the wait starts (a region
 * mounted with its words may go unheard, GAP-226). The sweep changes
 * nothing a screen reader reads, so nothing more is said while it moves;
 * when the bar gets a value the status empties, ready for the next wait.
 */
const LinearProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  LinearProgressProps
>(
  (
    {
      className,
      value,
      max,
      known,
      percentage,
      placement,
      label,
      style,
      "aria-labelledby": labelledBy,
      ...props
    },
    ref,
  ) => {
    const statusId = React.useId();
    const indeterminate = !known;
    const named = props["aria-label"] != null || labelledBy != null;
    const words =
      label != null && label !== false && label !== "" ? label : LOADING;
    // Mounted empty, then given its words: the change is what is said.
    const [said, setSaid] = React.useState(false);
    React.useEffect(() => {
      setSaid(indeterminate);
    }, [indeterminate]);
    const top = placement === "top";
    return (
      <>
        <ProgressPrimitive.Root
          ref={ref}
          value={value}
          max={max}
          data-placement={placement}
          className={cn(
            top ? "kozmos-progress-top" : "relative h-2 w-full rounded-pill",
            "overflow-hidden bg-secondary",
            className,
          )}
          aria-labelledby={indeterminate && !named ? statusId : labelledBy}
          style={style}
          {...props}
        >
          {indeterminate ? (
            <ProgressPrimitive.Indicator className="kozmos-progress-sweep" />
          ) : (
            // As wide as the value, from the inline start: right to left it
            // fills from the right, as SwiftUI's and Compose's bars do.
            <ProgressPrimitive.Indicator
              className="h-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          )}
        </ProgressPrimitive.Root>
        {indeterminate && (
          <span
            id={statusId}
            role="status"
            aria-live="polite"
            className="sr-only"
            data-kozmos-progress-status=""
          >
            {said ? words : null}
          </span>
        )}
      </>
    );
  },
);
LinearProgress.displayName = "LinearProgress";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value,
      max = 100,
      shape = "linear",
      size = "md",
      label,
      labelPlacement = "center",
      tone = "themed",
      placement = "inline",
      style,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const labelId = React.useId();
    const resolvedMax =
      typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100;
    // A value over the total is all of it: "16 of 15" is a full ring and a
    // full bar, as SwiftUI's and Compose's are and as `<progress>` has it.
    // Radix would call it unknown and draw none done.
    const drawnValue =
      typeof value === "number" && Number.isFinite(value) && value > resolvedMax
        ? resolvedMax
        : value;
    const known =
      typeof drawnValue === "number" &&
      drawnValue >= 0 &&
      drawnValue <= resolvedMax;
    const percentage = known ? (drawnValue / resolvedMax) * 100 : 0;
    if (shape === "circular") {
      const [diameter, stroke] = RING[size] ?? RING.md;
      const centre = diameter / 2;
      const radius = (diameter - stroke) / 2;
      const circumference = 2 * Math.PI * radius;
      const labelled = label != null && label !== false && label !== "";
      // The label is the ring's name, or its description when the caller has
      // named it already; either way it is said by reference, and the drawn
      // copy is hidden, so a screen reader hears it once. It stays inside the
      // progress bar wherever it is drawn.
      const named = props["aria-label"] != null || labelledBy != null;
      const emotion = EMOTIONS.includes(tone) ? tone : "themed";
      const beside = labelPlacement === "end";
      // "100%" is 31.8 wide at 12, in the 28.28 square an `sm` hole holds
      // (owner, 2 Nov), so a whole `sm` ring with no label of the product's
      // draws a check. It says 100%, by a name of its own if it has no other.
      const done = size === "sm" && !labelled && drawnValue === resolvedMax;
      const drawn = labelled && (
        <div
          id={labelId}
          aria-hidden="true"
          className="kozmos-progress-ring-label"
        >
          {label}
        </div>
      );
      return (
        <ProgressPrimitive.Root
          ref={ref}
          value={drawnValue}
          max={max}
          data-shape="circular"
          data-size={size}
          data-tone={emotion}
          data-label-placement={beside ? "end" : "center"}
          className={cn("kozmos-progress-ring", className)}
          // The arc's colour, as a property the stylesheet reads, so forced
          // colours can still replace it.
          style={
            {
              "--kozmos-progress-ring-tone": `var(--semantics-emotion-${emotion}-text)`,
              ...style,
            } as React.CSSProperties
          }
          aria-labelledby={labelled && !named ? labelId : labelledBy}
          aria-describedby={
            labelled && named
              ? [describedBy, labelId].filter(Boolean).join(" ")
              : describedBy
          }
          {...props}
          aria-label={done && !named ? "100%" : props["aria-label"]}
        >
          {/* One drawing: the track and the arc are strokes of one circle,
              so nothing is inset and nothing can sit off centre. The arc
              starts at 12 o'clock and runs clockwise, and a progress ring
              does not mirror right to left: SVG is drawn in the page's own
              coordinates whatever the direction. With no value the track is
              drawn alone: a turning ring is Spinner. */}
          <div className="kozmos-progress-ring-dial">
            <svg
              aria-hidden="true"
              focusable="false"
              className="kozmos-progress-ring-svg"
              width={diameter}
              height={diameter}
              viewBox={`0 0 ${diameter} ${diameter}`}
              fill="none"
              strokeWidth={stroke}
            >
              <circle
                className="kozmos-progress-ring-track"
                cx={centre}
                cy={centre}
                r={radius}
              />
              {known && (
                <circle
                  className="kozmos-progress-ring-arc"
                  cx={centre}
                  cy={centre}
                  r={radius}
                  strokeDasharray={`${(circumference * percentage) / 100} ${circumference}`}
                  transform={`rotate(-90 ${centre} ${centre})`}
                />
              )}
            </svg>
            {!beside && drawn}
            {done && (
              <Check
                aria-hidden="true"
                focusable="false"
                className="kozmos-progress-ring-done"
              />
            )}
          </div>
          {beside && drawn}
        </ProgressPrimitive.Root>
      );
    }
    return (
      <LinearProgress
        ref={ref}
        value={drawnValue}
        max={max}
        known={known}
        percentage={percentage}
        placement={placement === "top" ? "top" : "inline"}
        label={label}
        className={className}
        style={style}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        {...props}
      />
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

/** A normalized, host-selected interval. Invalid intervals are not rendered. */
export interface ProgressRange {
  start: number;
  end: number;
}
export function validProgressRange(
  range: ProgressRange | undefined,
): range is ProgressRange {
  return (
    !!range &&
    Number.isFinite(range.start) &&
    Number.isFinite(range.end) &&
    range.start >= 0 &&
    range.end <= 1 &&
    range.start < range.end
  );
}

export interface ProgressTrackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Selected interval in static mode; bounds of the current section in live mode. */
  activeRange?: ProgressRange;
  /** Absolute normalized position; null/nonfinite/outside the active range means unknown. */
  value: number | null;
  appearance?: "theme" | "gradient";
  /** Static paints only the selected interval; live paints from zero to a valid value. */
  positionMode?: "static" | "live";
  /** Decorative direction, never simulated progress. Host disables when guidance pauses. */
  motion?: "none" | "directional";
}

/** Decorative track primitive. The owning progress control supplies its accessible semantics. */
const ProgressTrack = React.forwardRef<HTMLDivElement, ProgressTrackProps>(
  (
    {
      activeRange,
      value,
      appearance = "theme",
      positionMode = "live",
      motion = "none",
      className,
      ...props
    },
    ref,
  ) => {
    const range = validProgressRange(activeRange) ? activeRange : undefined;
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
    const [visible, setVisible] = React.useState(true);
    React.useEffect(() => {
      const update = () => setVisible(document.visibilityState !== "hidden");
      update();
      document.addEventListener("visibilitychange", update);
      return () => document.removeEventListener("visibilitychange", update);
    }, []);
    const flow =
      motion === "directional" &&
      visible &&
      range &&
      flowStart != null &&
      flowStart < range.end
        ? { start: flowStart, end: range.end }
        : undefined;
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={cn("kozmos-progress-track", className)}
      >
        {fill && (
          <span
            data-testid="progress-active-range"
            data-appearance={appearance}
            className="kozmos-progress-track-active"
            style={{
              insetInlineStart: `${fill.start * 100}%`,
              width: `${(fill.end - fill.start) * 100}%`,
            }}
          />
        )}
        {flow && (
          <span
            data-testid="progress-directional-flow"
            data-mode={positionMode}
            className="kozmos-progress-track-flow"
            style={{
              insetInlineStart: `${flow.start * 100}%`,
              width: `${(flow.end - flow.start) * 100}%`,
            }}
          />
        )}
      </div>
    );
  },
);
ProgressTrack.displayName = "ProgressTrack";

export { Progress, ProgressTrack };
