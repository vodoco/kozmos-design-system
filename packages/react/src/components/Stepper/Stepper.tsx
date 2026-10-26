import React from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";

/**
 * How the steps are drawn: `numbered`, a numbered circle over each step's
 * label, or `dots`, one dot per step with no label shown, as a tour's
 * progress is. The indicator style only: an orientation, and a status for
 * each step, would sit beside it (GAP-173).
 */
export type StepperVariant = "numbered" | "dots";

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Each step's name: the numbered variant's labels, and each dot's name. */
  steps: string[];
  /** The current step, from 0. Earlier steps are done; at `steps.length`, every one is. */
  currentStep: number;
  /** `numbered` (the default) or `dots` (GAP-191). */
  variant?: StepperVariant;
  /**
   * The dots' position, read as the group's name: a function of the step
   * (from 1) and the count, or a template with `{step}` and `{count}`.
   * English by default, "Step 2 of 5". Once every step is done, the step is
   * the last.
   */
  positionLabel?: string | ((step: number, count: number) => string);
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      steps,
      currentStep,
      variant = "numbered",
      positionLabel = "Step {step} of {count}",
      ...props
    },
    ref,
  ) => {
    if (variant === "dots") {
      const count = steps.length;
      const step = Math.min(Math.max(currentStep + 1, 1), count);
      const position =
        typeof positionLabel === "function"
          ? positionLabel(step, count)
          : positionLabel
              .replace(/\{step\}/g, String(step))
              .replace(/\{count\}/g, String(count));
      // The dots draw no label, so the group says where the tour is and each
      // dot is named by its step, in text a screen reader reads and the page
      // never shows. The current dot is the long one, so its shape says it
      // as well as its colour; the pending ones are foreground 500, 3:1 or
      // more on the page, a popover and the muted fill in both themes.
      return (
        <div
          ref={ref}
          role="group"
          aria-label={position}
          className={cn("kozmos-stepper-dots", className)}
          {...props}
        >
          <ol className="kozmos-stepper-dots-list">
            {steps.map((name, index) => {
              const state =
                index < currentStep
                  ? "done"
                  : index === currentStep
                    ? "current"
                    : "pending";
              return (
                <li
                  key={index}
                  className="kozmos-stepper-dot"
                  data-state={state}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span className="kozmos-stepper-dot-name">{name}</span>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center", className)}
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              {/* A step can shrink below its label, which then truncates: the
                  row fits any width without widening the page. The label's
                  text stays whole for assistive technology, and the title
                  shows it on hover. The current step is `aria-current="step"`,
                  so a screen reader hears which step the visitor is on: it
                  set none until 2026-10-21. */}
              <div
                className="flex min-w-0 flex-col items-center gap-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-pill border text-sm font-medium transition-colors",
                    // The current and completed steps' ring is 2, a pending
                    // one's 1, as the plugin paints them; the current step's
                    // was 1 until 2026-09-22. A completed step is a
                    // prominent fill: the theme fill with the theme
                    // foreground on it, the same in both themes (decision
                    // 59). The current step's ring stays a border, theme 600,
                    // and so does the connector, a line, as Progress is.
                    isCompleted
                      ? "border-2 border-theme-fill bg-theme-fill text-theme-fill-foreground"
                      : isCurrent
                        ? "border-2 border-primary text-foreground"
                        : // A pending step's ring is its glyph: foreground/500,
                          // as Figma and the natives draw it. `border-muted`
                          // read 1.2:1 on the page until 2026-09-22.
                          "border-[color:var(--primitives-colors-foreground-500)] text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  title={step}
                  className={cn(
                    "max-w-full truncate text-xs",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    // 8 a side on a phone, 16 from sm: three connectors at 16
                    // took 96 of a 288-wide row.
                    "mx-2 h-[1px] flex-1 sm:mx-4",
                    index < currentStep ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
Stepper.displayName = "Stepper";

export { Stepper };
