import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../utils";

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
   * What a ring shows in its centre: "11 Levels Added", or a percentage. It
   * names the progress bar, or describes it when `aria-label` or
   * `aria-labelledby` already names it, and the drawn copy is hidden from
   * assistive technology, so it is heard once. A bar has no centre: a
   * linear Progress draws none.
   */
  label?: React.ReactNode;
}

/**
 * A ring's diameter and stroke width, in px, by size: the layout spacing
 * tokens 600, 900 and 1000 across, and 50, 100 and 150 thick. The box takes
 * its size from the same tokens in the stylesheet; these draw inside it.
 */
const RING = { sm: [48, 4], md: [96, 8], lg: [128, 12] } as const;

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
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const labelId = React.useId();
    const resolvedMax =
      typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100;
    const known =
      typeof value === "number" && value >= 0 && value <= resolvedMax;
    const percentage = known ? (value / resolvedMax) * 100 : 0;
    if (shape === "circular") {
      const [diameter, stroke] = RING[size] ?? RING.md;
      const centre = diameter / 2;
      const radius = (diameter - stroke) / 2;
      const circumference = 2 * Math.PI * radius;
      const labelled = label != null && label !== false && label !== "";
      // The centre label is the ring's name, or its description when the
      // caller has named it already; either way it is said by reference, and
      // the drawn copy is hidden, so a screen reader hears it once.
      const named = props["aria-label"] != null || labelledBy != null;
      return (
        <ProgressPrimitive.Root
          ref={ref}
          value={value}
          max={max}
          data-shape="circular"
          data-size={size}
          className={cn("kozmos-progress-ring", className)}
          aria-labelledby={labelled && !named ? labelId : labelledBy}
          aria-describedby={
            labelled && named
              ? [describedBy, labelId].filter(Boolean).join(" ")
              : describedBy
          }
          {...props}
        >
          {/* One drawing: the track and the arc are strokes of one circle,
              so nothing is inset and nothing can sit off centre. The arc
              starts at 12 o'clock and runs clockwise, and a progress ring
              does not mirror right to left: SVG is drawn in the page's own
              coordinates whatever the direction. With no value the track is
              drawn alone (the indeterminate ring is GAP-159's). */}
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
          {labelled && (
            <div
              id={labelId}
              aria-hidden="true"
              className="kozmos-progress-ring-label"
            >
              {label}
            </div>
          )}
        </ProgressPrimitive.Root>
      );
    }
    return (
      <ProgressPrimitive.Root
        ref={ref}
        value={value}
        max={max}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-pill bg-secondary",
          className,
        )}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        {...props}
      >
        {/* As wide as the value, from the inline start: right to left it fills
          from the right, as SwiftUI's and Compose's bars do. */}
        <ProgressPrimitive.Indicator
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </ProgressPrimitive.Root>
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
