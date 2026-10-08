import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import {
  EMOTION_FILLED_CLASSES,
  emotionSurfaceProperties,
  type Emotion,
} from "../../utils/emotion";

export const counterVariants = cva(
  "inline-flex items-center justify-center rounded-pill font-semibold leading-none tabular-nums",
  {
    variants: {
      tone: {
        neutral: "bg-secondary text-secondary-foreground",
        // The theme fill and the theme foreground, white in both themes:
        // foreground/1000 turned black on it in the dark (decision 59).
        brand: "bg-theme-fill text-theme-fill-foreground",
        destructive:
          "bg-destructive text-[var(--primitives-colors-foreground-1000)]",
        inverse: "bg-background text-foreground",
      },
      size: {
        sm: "h-[18px] min-w-[18px] px-[5px] text-[11px]",
        default: "h-5 min-w-5 px-1.5 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "default",
    },
  },
);

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

  const text = String(value).trim();
  if (text.startsWith("(") && text.endsWith(")")) {
    return text.slice(1, -1).trim();
  }

  return text;
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
