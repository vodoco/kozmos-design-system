import React from "react";
import { Sparkles } from "lucide-react";
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
 * `--primitives-colors-theme-300` to `-600` and back.
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
      <span
        aria-hidden="true"
        className="kozmos-ai-search-ring absolute inset-0 rounded-pill"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[2.5px] rounded-pill bg-background"
      />
      <Sparkles aria-hidden="true" className="relative h-4 w-4 text-primary" />
    </button>
  ),
);
AISearchButton.displayName = "AISearchButton";

export { AISearchButton };
