import React from "react";
import type { Instruction, DirectionKind } from "@kozmos-ds/product-contracts";
import { InstructionText } from "../../utils/instruction";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MarkerPin01,
  FlipBackward,
  ArrowUpRight,
  ArrowDownRight,
  LogIn01,
  LogOut01,
  Walking,
  type KozmosIconComponent,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";

/** Legacy export retained as an alias of the shared semantic manoeuvre contract. */
export type DirectionType = DirectionKind;

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
  "walking",
  "enter",
  "exit",
  "ramp-up",
  "ramp-down",
];

/**
 * One mapping for step, card, itinerary and rail, drawn only with approved
 * marks: the Pointr icon set and the existing SDK walking mark. The original
 * lift, escalator, stairs, ramp and entry artwork awaits design approval
 * (Olcay, 2026-10-04): @kozmos-ds/icons exports it by name for products to
 * opt into, and no default draws it until it is approved.
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
  walking: Walking,
  enter: LogIn01,
  exit: LogOut01,
  "ramp-up": ArrowUpRight,
  "ramp-down": ArrowDownRight,
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
  // Runtime adapters may still send an unknown value. Keep the instruction,
  // omit an unknown mark rather than inventing a straight or left turn.
  const Icon = Object.prototype.hasOwnProperty.call(DIRECTION_ICONS, type)
    ? DIRECTION_ICONS[type]
    : undefined;
  return Icon ? <Icon aria-hidden="true" className={className} /> : null;
}

export interface DirectionStepProps extends React.HTMLAttributes<HTMLDivElement> {
  type: DirectionType;
  /** Legacy text or ordered inline parts with secondary emphasis and speech language. */
  instruction: Instruction;
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
        <div className="flex shrink-0 items-center justify-center w-10 h-10 me-3 text-primary bg-primary/10 rounded-pill">
          <DirectionIcon type={type} className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            <InstructionText instruction={instruction} />
          </p>
          {(distance || duration) && (
            <p className="text-sm text-muted-foreground">
              {[distance, duration].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </div>
    );
  },
);
DirectionStep.displayName = "DirectionStep";

export { DirectionStep };
