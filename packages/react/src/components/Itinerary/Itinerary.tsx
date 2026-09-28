import React from "react";
import { cn } from "../../utils";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

/** One step of an itinerary, as the products present it. */
export interface ItineraryStep {
  id: string;
  /** The routing engine's own wording. */
  instruction: string;
  type: DirectionType;
  /** The step under way. */
  current?: boolean;
}

export interface ItineraryProps extends React.HTMLAttributes<HTMLElement> {
  origin: string;
  steps: ItineraryStep[];
  destination: string;
  originLabel?: string;
  destinationLabel?: string;
  /** What the list is called to assistive technology. */
  label?: string;
}

/**
 * The whole route as a list: where it starts, every step with the current
 * one emphasised, where it ends. Assistive technology reads the endpoints
 * with their labels and each step as one item, the current one marked
 * `aria-current="step"`.
 */
const Itinerary = React.forwardRef<HTMLElement, ItineraryProps>(
  (
    {
      className,
      origin,
      steps,
      destination,
      originLabel = "From",
      destinationLabel = "To",
      label = "Itinerary",
      ...props
    },
    ref,
  ) => {
    // The captions and the origin are muted, and on glass, in a glass
    // manoeuvre card, the foreground colour (decision 48).
    const endpoint = (caption: string, name: string, emphasised: boolean) => (
      <li className="flex items-baseline gap-3 text-[15px]">
        <span className="kozmos-muted-text w-10 shrink-0 text-xs uppercase">
          {caption}
        </span>
        <span
          className={cn(
            emphasised ? "font-semibold text-foreground" : "kozmos-muted-text",
          )}
        >
          {name}
        </span>
      </li>
    );
    return (
      <section
        ref={ref}
        aria-label={label}
        className={cn("kozmos-itinerary text-foreground", className)}
        {...props}
      >
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {endpoint(originLabel, origin, false)}
          {steps.map((step) => (
            <li
              key={step.id}
              aria-current={step.current ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 text-[15px]",
                step.current ? "font-semibold text-primary" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-10 shrink-0 items-center",
                  step.current ? "text-primary" : "text-muted-foreground",
                )}
              >
                <DirectionIcon type={step.type} className="h-4 w-4" />
              </span>
              <span>{step.instruction}</span>
            </li>
          ))}
          {endpoint(destinationLabel, destination, true)}
        </ol>
      </section>
    );
  },
);
Itinerary.displayName = "Itinerary";

export { Itinerary };
