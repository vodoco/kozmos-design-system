import React from "react";
import { cn } from "../../utils";
import { SpinnerArc } from "./SpinnerArc";
import {
  SPINNER_CLASS,
  SPINNER_LABEL_DELAY_MS,
  SPINNER_PIXELS,
  SPINNER_SIZE_CLASSES,
} from "../../recipes/spinner";

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
    // The `Spinner/size/*` tokens, as attribute and class, and the label
    // put in after the region (GAP-226): recipes/spinner.ts says why.
    const [labelled, setLabelled] = React.useState(false);
    React.useEffect(() => {
      const timer = setTimeout(() => setLabelled(true), SPINNER_LABEL_DELAY_MS);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div
        ref={ref}
        className={cn(SPINNER_CLASS, className)}
        role="status"
        // Said as well as implied: an open Select or Menu hides every box not
        // marked aria-live (GAP-193).
        aria-live="polite"
        {...props}
      >
        <SpinnerArc
          className={SPINNER_SIZE_CLASSES[size]}
          size={SPINNER_PIXELS[size]}
        />
        <span className="sr-only">{labelled ? label : null}</span>
      </div>
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
