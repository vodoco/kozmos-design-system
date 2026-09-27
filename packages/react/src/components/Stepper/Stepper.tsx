import React from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStep: number;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, ...props }, ref) => {
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
                  shows it on hover. */}
              <div className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-pill border text-sm font-medium transition-colors",
                    // The current and completed steps' ring is 2, a pending
                    // one's 1, as the plugin paints them; the current step's
                    // was 1 until 2026-09-22.
                    isCompleted
                      ? "border-2 border-primary bg-primary text-primary-foreground"
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
