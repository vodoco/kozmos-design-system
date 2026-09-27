import React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MarkerPin01,
  FlipBackward,
  type KozmosIconComponent,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";

/**
 * What a step of a route asks for. The four turns, and the transitions the
 * routing engines describe: a level change by lift, escalator or stairs — up
 * or down — or by something unnamed; a same-level transition, a walkway or a
 * corridor to another building; and turning back. Each platform draws the
 * closest glyph its own icon set has, and the instruction's words carry the
 * rest.
 */
export type DirectionType =
  | "straight"
  | "left"
  | "right"
  | "destination"
  | "lift-up"
  | "lift-down"
  | "escalator-up"
  | "escalator-down"
  | "stairs-up"
  | "stairs-down"
  | "level-up"
  | "level-down"
  | "transition"
  | "turn-back";

export const DIRECTION_TYPES: readonly DirectionType[] = [
  "straight",
  "left",
  "right",
  "destination",
  "lift-up",
  "lift-down",
  "escalator-up",
  "escalator-down",
  "stairs-up",
  "stairs-down",
  "level-up",
  "level-down",
  "transition",
  "turn-back",
];

/**
 * The arrow for each direction, one table for every part that draws one.
 * Pointr has no lift, escalator or stairs glyph either, so a level change
 * shows the direction of travel and the instruction's words name what carries
 * it. These are the same outlines the Figma component swaps in: its fourteen
 * variants resolve to arrow-up, arrow-down, arrow-left, arrow-right,
 * marker-pin-01 and flip-backward, and nothing finer.
 */
export const DIRECTION_ICONS: Record<DirectionType, KozmosIconComponent> = {
  straight: ArrowUp,
  left: ArrowLeft,
  right: ArrowRight,
  destination: MarkerPin01,
  "lift-up": ArrowUp,
  "lift-down": ArrowDown,
  "escalator-up": ArrowUp,
  "escalator-down": ArrowDown,
  "stairs-up": ArrowUp,
  "stairs-down": ArrowDown,
  "level-up": ArrowUp,
  "level-down": ArrowDown,
  transition: ArrowRight,
  "turn-back": FlipBackward,
};

/**
 * A direction's arrow. Decorative: the instruction beside it says what it
 * says, so assistive technology never hears it.
 */
export function DirectionIcon({
  type,
  className,
}: {
  type: DirectionType;
  className?: string;
}) {
  const Icon = DIRECTION_ICONS[type];
  return <Icon aria-hidden="true" className={className} />;
}

interface DirectionStepProps extends React.HTMLAttributes<HTMLDivElement> {
  type: DirectionType;
  instruction: string;
  distance?: string;
  duration?: string;
}

const DirectionStep = React.forwardRef<HTMLDivElement, DirectionStepProps>(
  ({ className, type, instruction, distance, duration, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center p-3 bg-background border border-border rounded-container shadow-raised",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-center w-10 h-10 mr-3 text-primary bg-primary/10 rounded-pill">
          <DirectionIcon type={type} className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{instruction}</p>
          {(distance || duration) && (
            <p className="text-sm text-muted-foreground">
              {distance} {duration && `• ${duration}`}
            </p>
          )}
        </div>
      </div>
    );
  },
);
DirectionStep.displayName = "DirectionStep";

export { DirectionStep };
