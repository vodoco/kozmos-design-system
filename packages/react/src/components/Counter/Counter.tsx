import React from "react";
import { type VariantProps } from "class-variance-authority";
import { counterVariants, formatCounterText } from "../../recipes/counter";
import { cn } from "../../utils";
import {
  EMOTION_FILLED_CLASSES,
  emotionSurfaceProperties,
  type Emotion,
} from "../../utils/emotion";

// The recipe is shared with Vue's KozmosBadge (recipes/counter.ts); it stays
// exported from here, where it always was.
export { counterVariants } from "../../recipes/counter";

export interface CounterProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof counterVariants> {
  /**
   * What the count means. Leave it unset and `tone` renders exactly as it
   * always has. Set it and the emotion decides the colour — a counter is
   * always a filled pill, so there is one treatment rather than two.
   *
   * The product drives this axis on 9,427 counter instances across 11
   * surfaces. `tone` stays for the two values that are not emotions at all:
   * `inverse`, and a `brand` that predates the axis.
   */
  emotion?: Emotion;
}

export function formatCounterValue(value: React.ReactNode) {
  if (typeof value !== "string" && typeof value !== "number") {
    return value;
  }

  return formatCounterText(value);
}

export const Counter = React.forwardRef<HTMLSpanElement, CounterProps>(
  ({ children, className, tone, size, emotion, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        counterVariants({ tone, size }),
        emotion && EMOTION_FILLED_CLASSES,
        className,
      )}
      data-slot="counter"
      // The caller's own style wins over the emotion's defaults.
      style={
        emotion ? { ...emotionSurfaceProperties(emotion), ...style } : style
      }
      {...props}
    >
      {formatCounterValue(children)}
    </span>
  ),
);

Counter.displayName = "Counter";
