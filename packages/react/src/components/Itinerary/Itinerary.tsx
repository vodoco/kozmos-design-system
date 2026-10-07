import React from "react";
import type { Instruction } from "@kozmos-ds/product-contracts";
import { InstructionText } from "../../utils/instruction";
import { cn } from "../../utils";
import { Button } from "../Button";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

/** One step of an itinerary, as the products present it. */
export interface ItineraryStep {
  id: string;
  /** The routing engine's own wording, optionally ordered parts with role/language. */
  instruction: Instruction;
  type: DirectionType;
  /** The step under way. */
  current?: boolean;
  /** Localized estimate for this step, not an actual journey total. */
  distance?: string;
  /** Localized estimate for this step. Missing and empty values are omitted. */
  duration?: string;
}

export interface ItineraryProps extends React.HTMLAttributes<HTMLElement> {
  origin: string;
  steps: ItineraryStep[];
  destination: string;
  originLabel?: string;
  destinationLabel?: string;
  /** What the list is called to assistive technology. */
  label?: string;
  /**
   * Draws an action at the end of the From row, after the place's name. The
   * host owns what follows: it opens the start point for editing and moves
   * focus there. Left out, the row has no action.
   */
  onEditOrigin?: () => void;
  /** As `onEditOrigin`, for the To row. */
  onEditDestination?: () => void;
  /** The actions' visible verb: RouteLocationField's `changeLabel`, "Change". */
  changeLabel?: string;
  /**
   * The From action's accessible name. Start it with `changeLabel`, the words
   * on the button, so a speech user can say what they see (WCAG 2.5.3); by
   * default it is `changeLabel` and "start point".
   */
  editOriginLabel?: string;
  /** The To action's accessible name; by default `changeLabel` and "destination". */
  editDestinationLabel?: string;
}

/**
 * The whole route as a list: where it starts, every step with the current
 * one emphasised, where it ends. Assistive technology reads the endpoints
 * with their labels and each step as one item, the current one marked
 * `aria-current="step"`. With `onEditOrigin` or `onEditDestination`, that
 * endpoint's row ends in a Change button.
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
      onEditOrigin,
      onEditDestination,
      changeLabel = "Change",
      editOriginLabel = `${changeLabel} start point`,
      editDestinationLabel = `${changeLabel} destination`,
      ...props
    },
    ref,
  ) => {
    const currentCount = steps.filter((step) => step.current).length;
    // The captions and the origin are muted, and on glass, in a glass
    // manoeuvre card, the foreground colour (decision 48).
    // An action follows the name, on its baseline, and takes the next line,
    // at the row's end, when the name would keep under 80px beside it.
    const endpoint = (
      caption: string,
      name: string,
      emphasised: boolean,
      onEdit?: () => void,
      editLabel?: string,
    ) => (
      <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px]">
        <span className="kozmos-muted-text min-w-10 max-w-full shrink-0 text-xs uppercase [overflow-wrap:anywhere]">
          {caption}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 basis-20 [overflow-wrap:anywhere]",
            emphasised
              ? "font-semibold kozmos-guidance-text"
              : "kozmos-muted-text",
          )}
        >
          {name}
        </span>
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ms-auto h-auto min-h-11 max-w-full whitespace-normal [overflow-wrap:anywhere]"
            aria-label={editLabel}
            onClick={onEdit}
          >
            {changeLabel}
          </Button>
        )}
      </li>
    );
    return (
      <section
        ref={ref}
        aria-label={label}
        className={cn("kozmos-itinerary kozmos-guidance-text", className)}
        {...props}
      >
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {endpoint(originLabel, origin, false, onEditOrigin, editOriginLabel)}
          {steps.map((step) => (
            <li
              key={step.id}
              aria-current={
                step.current && currentCount === 1 ? "step" : undefined
              }
              className={cn(
                "flex items-start gap-3 text-[15px]",
                step.current && currentCount === 1
                  ? "font-semibold kozmos-guidance-accent"
                  : "kozmos-guidance-text",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-10 shrink-0 items-center",
                  step.current && currentCount === 1
                    ? "kozmos-guidance-accent"
                    : "kozmos-muted-text",
                )}
              >
                <DirectionIcon type={step.type} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex flex-col gap-0.5">
                <span>
                  <InstructionText instruction={step.instruction} />
                </span>
                {(step.distance || step.duration) && (
                  <span className="kozmos-muted-text text-sm font-normal">
                    {[step.distance, step.duration].filter(Boolean).join(" • ")}
                  </span>
                )}
              </span>
            </li>
          ))}
          {endpoint(
            destinationLabel,
            destination,
            true,
            onEditDestination,
            editDestinationLabel,
          )}
        </ol>
      </section>
    );
  },
);
Itinerary.displayName = "Itinerary";

export { Itinerary };
