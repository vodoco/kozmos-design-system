import React from "react";
import { cn } from "../../utils";
import { SpinnerArc } from "./SpinnerArc";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Written out rather than named, because `scripts/skills/check-variant-parity
   * .mjs` reads the union from the interface: behind a type alias the axis is
   * invisible to it, and Spinner dropped out of the parity scan entirely the
   * first time this was written the other way round.
   */
  size?: "sm" | "md" | "lg" | "xl";
  /** What assistive technology hears while the wait lasts. */
  label?: string;
}

export type SpinnerSize = NonNullable<SpinnerProps["size"]>;

/**
 * Indeterminate loading: the system's arc, turning, with a name to hear.
 *
 * The sizes are the `Spinner/size/*` tokens — 16, 24, 32 and 48 — and iOS,
 * Android and Figma draw the same four. The turn is the system's own
 * `kozmos-spin`, one second, linear, and it stops under
 * `prefers-reduced-motion` (GAP-50); the status role keeps saying so when it
 * does, which is why the label is not decorative.
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", label = "Loading", ...props }, ref) => {
    // The `Spinner/size/*` tokens: 16, 24, 32, 48. Both forms are set — the
    // attribute so the arc has an intrinsic size wherever the stylesheet does
    // not reach, the class so a caller can still size it with one.
    const pixels: Record<SpinnerSize, number> = {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    };
    const sizeClasses: Record<SpinnerSize, string> = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        role="status"
        {...props}
      >
        <SpinnerArc className={sizeClasses[size]} size={pixels[size]} />
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
