import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../utils";

/**
 * How many bars are waiting on the page. Only the first to start says its
 * words: five uploads starting together are one "Loading", not five.
 */
let waits = 0;

export interface ProgressBarProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  /** How much of the bar is drawn, 0 to 100; the value's own share. */
  percentage?: number;
  placement?: "inline" | "top";
  label?: React.ReactNode;
}

/**
 * Progress's bar, internal: Progress draws it, and so does TourStep, which
 * has no ring to carry.
 *
 * With a value it fills from the inline start, as far as `percentage` (right
 * to left from the right, as SwiftUI's and Compose's do). With none at all,
 * `undefined` or `null`, it waits (GAP-159): a quarter-wide segment sweeps
 * from the inline start to the inline end every 2 s and stands still in the
 * middle under reduced motion (the stylesheet's .kozmos-progress-sweep). A
 * value that is not a number, or out of range, is an empty bar, as it always
 * was.
 *
 * A wait is said once, by a polite status beside the bar, mounted empty and
 * given its words after (GAP-226): the label, else the product's own name
 * for the bar, else "Loading". The words are read when the wait starts and
 * kept, so a label that changes while it waits is not said again, and only
 * the first bar to start waiting speaks. The sweep changes nothing a screen
 * reader reads. `placement="top"` is the page's loading bar.
 */
export const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(
  (
    {
      className,
      value,
      percentage = 0,
      placement,
      label,
      "aria-label": ariaLabel,
      "aria-labelledby": labelledBy,
      ...props
    },
    ref,
  ) => {
    const waiting = value == null;
    const words = React.useRef<[React.ReactNode, string | undefined]>([
      null,
      undefined,
    ]);
    words.current = [label || ariaLabel, labelledBy];
    const [said, setSaid] = React.useState<React.ReactNode>(null);
    React.useEffect(() => {
      if (!waiting) return;
      const [own, by] = words.current;
      if (waits++ === 0)
        setSaid(
          own ||
            by
              ?.split(" ")
              .map((id) => document.getElementById(id)?.textContent)
              .join(" ")
              .trim() ||
            "Loading",
        );
      return () => {
        waits--;
        setSaid(null);
      };
    }, [waiting]);
    return (
      <>
        <ProgressPrimitive.Root
          ref={ref}
          value={value}
          className={cn(
            placement === "top"
              ? "kozmos-progress-top"
              : "relative h-2 w-full rounded-pill",
            "overflow-hidden bg-secondary",
            className,
          )}
          aria-labelledby={labelledBy}
          aria-label={
            waiting && !ariaLabel && !labelledBy
              ? (typeof label === "string" && label) || "Loading"
              : ariaLabel
          }
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={
              waiting
                ? "kozmos-progress-sweep"
                : "h-full bg-primary transition-all"
            }
            style={waiting ? undefined : { width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
        {waiting && (
          <span role="status" aria-live="polite" className="sr-only">
            {said}
          </span>
        )}
      </>
    );
  },
);
ProgressBar.displayName = "ProgressBar";
