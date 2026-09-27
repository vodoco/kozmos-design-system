import React from "react";
// The mark is `stars-01` in the Pointr Icon Library, which is what the Figma
// painter draws and what `@kozmos-ds/icons` names it. It drew lucide's
// `Sparkles` until 2026-09-23, when every registry name gained its real Pointr
// outline; the test beside this file failed the moment it did, which is what it
// was written to do. This imports the component directly rather than through
// `getIconComponent`, which would pull the whole registry into every consumer
// that touches this button — measured at 20 kB gzip against one icon's 19.
import { Stars01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface AISearchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** What assistive technology hears; the button shows an icon alone. */
  label?: string;
}

/**
 * The AI search, the prototype's: a 48 circle whose gradient ring is a band
 * two and a half wide around a 43 white disc; the gradient runs through the
 * theme's own ramp — the first gradient made of tokens — with a 16 icon.
 * The ring is drawn by `.kozmos-ai-search-ring` in the owned CSS, from
 * `--primitives-colors-theme-300` to `-600` and back, with the band cut out by
 * a radial mask rather than left over between two stacked circles — which is
 * how it came to measure 1.83px on one side and 3.14 on the other in Chromium.
 */
const AISearchButton = React.forwardRef<HTMLButtonElement, AISearchButtonProps>(
  ({ className, label = "AI search", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      // overflow-clip: the ring turns as a square whose corners are round, and
      // layout counts the turned square — 68 wide at 45° — so a button at the
      // end of a row widened the page for part of every turn. Clipped to the
      // button it draws the same; the focus ring is a shadow and is not clipped.
      className={cn(
        "kozmos-reset kozmos-ai-search relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-clip rounded-pill bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {/* The disc first, the ring over it: the band is cut out of the ring by
          a mask, and the disc is inset 2 — inside the 2.5 band — so its own
          edge is covered and never decides where the ring ends. */}
      <span
        aria-hidden="true"
        className="absolute inset-[2px] rounded-pill bg-background"
      />
      <span
        aria-hidden="true"
        className="kozmos-ai-search-ring absolute inset-0 rounded-pill"
      />
      <Stars01 aria-hidden="true" className="relative h-4 w-4 text-primary" />
    </button>
  ),
);
AISearchButton.displayName = "AISearchButton";

export { AISearchButton };
