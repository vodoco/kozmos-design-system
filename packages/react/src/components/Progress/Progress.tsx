import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { type Emotion } from "../../utils/emotion";
import {
  PROGRESS_RING_ARC_CLASS,
  PROGRESS_RING_CLASS,
  PROGRESS_RING_DIAL_CLASS,
  PROGRESS_RING_DONE_CLASS,
  PROGRESS_RING_LABEL_CLASS,
  PROGRESS_RING_SVG_CLASS,
  PROGRESS_RING_TRACK_CLASS,
  PROGRESS_TRACK_ACTIVE_CLASS,
  PROGRESS_TRACK_CLASS,
  PROGRESS_TRACK_FLOW_CLASS,
  isProgressSpan,
  progressDrawnValue,
  progressRing,
  progressSpanStyle,
  progressTrackSpans,
} from "../../recipes/progress";
import { ProgressBar } from "./ProgressBar";

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
   * A bar draws none. While a bar has no value (`undefined` or `null`) it
   * waits (GAP-159): its label, else its `aria-label` or the text its
   * `aria-labelledby` names, else "Loading", is said once as the wait
   * starts, by the first bar waiting on the page only. A string label also
   * names an unnamed waiting bar; a bar with a value takes its name from
   * `aria-label`.
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
    // The value drawn, the total and the share done: one over the total is
    // all of it (recipes/progress.ts).
    const [resolvedMax, drawnValue, known, percentage] = progressDrawnValue(
      value,
      max,
    );
    if (shape === "circular") {
      const labelled = label != null && label !== false && label !== "";
      // Its drawing, its tone and whether it is done: a whole `sm` ring with
      // no label draws a check, and says 100% (recipes/progress.ts).
      const [
        diameter,
        stroke,
        centre,
        radius,
        viewBox,
        dasharray,
        transform,
        emotion,
        toneVariables,
        done,
      ] = progressRing(
        size,
        percentage,
        tone,
        labelled,
        drawnValue,
        resolvedMax,
      );
      // The label is the ring's name, or its description when the caller has
      // named it already; either way it is said by reference, and the drawn
      // copy is hidden, so a screen reader hears it once. It stays inside the
      // progress bar wherever it is drawn.
      const named = props["aria-label"] != null || labelledBy != null;
      const beside = labelPlacement === "end";
      const drawn = labelled && (
        <div
          id={labelId}
          aria-hidden="true"
          className={PROGRESS_RING_LABEL_CLASS}
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
          className={cn(PROGRESS_RING_CLASS, className)}
          // The arc's colour, as a property the stylesheet reads, so forced
          // colours can still replace it.
          style={
            {
              ...toneVariables,
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
          <div className={PROGRESS_RING_DIAL_CLASS}>
            <svg
              aria-hidden="true"
              focusable="false"
              className={PROGRESS_RING_SVG_CLASS}
              width={diameter}
              height={diameter}
              viewBox={viewBox}
              fill="none"
              strokeWidth={stroke}
            >
              <circle
                className={PROGRESS_RING_TRACK_CLASS}
                cx={centre}
                cy={centre}
                r={radius}
              />
              {known && (
                <circle
                  className={PROGRESS_RING_ARC_CLASS}
                  cx={centre}
                  cy={centre}
                  r={radius}
                  strokeDasharray={dasharray}
                  transform={transform}
                />
              )}
            </svg>
            {!beside && drawn}
            {done && (
              <Check
                aria-hidden="true"
                focusable="false"
                className={PROGRESS_RING_DONE_CLASS}
              />
            )}
          </div>
          {beside && drawn}
        </ProgressPrimitive.Root>
      );
    }
    // The bar, in a module of its own so a part that draws only a bar
    // (TourStep) does not carry the ring.
    return (
      <ProgressBar
        ref={ref}
        value={drawnValue}
        max={max}
        percentage={percentage}
        placement={placement}
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
  return isProgressSpan(range);
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
    const [visible, setVisible] = React.useState(true);
    React.useEffect(() => {
      const update = () => setVisible(document.visibilityState !== "hidden");
      update();
      document.addEventListener("visibilitychange", update);
      return () => document.removeEventListener("visibilitychange", update);
    }, []);
    // What it paints, by mode and motion (recipes/progress.ts).
    const [fill, flow] = progressTrackSpans(
      activeRange,
      value,
      positionMode,
      motion,
      visible,
    );
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={cn(PROGRESS_TRACK_CLASS, className)}
      >
        {fill && (
          <span
            data-testid="progress-active-range"
            data-appearance={appearance}
            className={PROGRESS_TRACK_ACTIVE_CLASS}
            style={progressSpanStyle(fill)}
          />
        )}
        {flow && (
          <span
            data-testid="progress-directional-flow"
            data-mode={positionMode}
            className={PROGRESS_TRACK_FLOW_CLASS}
            style={progressSpanStyle(flow)}
          />
        )}
      </div>
    );
  },
);
ProgressTrack.displayName = "ProgressTrack";

export { Progress, ProgressTrack };
