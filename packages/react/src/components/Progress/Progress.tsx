import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => {
  const resolvedMax =
    typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 100;
  const percentage =
    typeof value === "number" && value >= 0 && value <= resolvedMax
      ? (value / resolvedMax) * 100
      : 0;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-pill bg-secondary",
        className,
      )}
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
});
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
