import React from "react";
import type { FloorPresentation } from "@kozmos-ds/product-contracts";
import { ChevronDown, ChevronUp } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useKozmosAnalytics } from "../../utils/analytics";

export type FloorSelectorOption = FloorPresentation | string;

export interface FloorSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  floors: readonly FloorSelectorOption[];
  selectedFloor: string;
  onFloorSelect: (floor: string) => void;
  label?: string;
  variant?: "vertical-list" | "horizontal-list" | "compact-stepper";
}

function normalizeFloor(floor: FloorSelectorOption): FloorPresentation {
  if (typeof floor === "string") {
    return { id: floor, label: floor, shortLabel: floor };
  }
  return floor;
}

const FloorSelector = React.forwardRef<HTMLDivElement, FloorSelectorProps>(
  (
    {
      className,
      floors,
      selectedFloor,
      onFloorSelect,
      label = "Floor selector",
      variant = "vertical-list",
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const handleFloorSelect = (floor: string) => {
      trackEvent("FloorSelector", "floor_selected", { floor });
      onFloorSelect(floor);
    };

    const options = floors.map(normalizeFloor);
    const selectedIndex = options.findIndex(
      (floor) => floor.id === selectedFloor,
    );
    const selectedOption = options[selectedIndex];
    const previousOption =
      selectedIndex > 0
        ? [...options.slice(0, selectedIndex)]
            .reverse()
            .find((floor) => !floor.disabled)
        : undefined;
    const nextOption =
      selectedIndex >= 0
        ? options.slice(selectedIndex + 1).find((floor) => !floor.disabled)
        : undefined;

    if (variant === "compact-stepper") {
      return (
        <div
          ref={ref}
          aria-label={
            selectedOption ? `${label}: ${selectedOption.label}` : label
          }
          className={cn(
            "flex min-h-11 w-fit items-center overflow-hidden rounded-container border border-border bg-background/90 shadow-floating backdrop-blur-sm",
            className,
          )}
          role="group"
          {...props}
        >
          <span
            aria-live="polite"
            className="min-w-14 px-3 text-center text-sm font-semibold text-foreground"
          >
            {selectedOption?.shortLabel ?? selectedFloor}
          </span>
          <span className="flex border-l border-border/70">
            <IconButton
              aria-label="Previous floor"
              className="h-11 w-11 rounded-none border-r border-border/70 bg-transparent p-0 shadow-none"
              disabled={!previousOption}
              onClick={() =>
                previousOption && handleFloorSelect(previousOption.id)
              }
              type="button"
              variant="ghost"
            >
              <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              aria-label="Next floor"
              className="h-11 w-11 rounded-none bg-transparent p-0 shadow-none"
              disabled={!nextOption}
              onClick={() => nextOption && handleFloorSelect(nextOption.id)}
              type="button"
              variant="ghost"
            >
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            </IconButton>
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-label={label}
        className={cn(
          "flex w-fit rounded-container border border-border bg-background/80 p-1 shadow-floating backdrop-blur-sm",
          variant === "vertical-list"
            ? "flex-col"
            : "max-w-full flex-row overflow-x-auto",
          className,
        )}
        role="group"
        {...props}
      >
        {options.map((floor) => (
          <Button
            key={floor.id}
            variant={selectedFloor === floor.id ? "default" : "ghost"}
            size="sm"
            aria-label={floor.label}
            aria-pressed={selectedFloor === floor.id}
            className={cn(
              "h-11 w-11 p-0 font-medium",
              variant === "horizontal-list" && "w-auto min-w-11 px-3",
              selectedFloor === floor.id && "shadow-raised",
            )}
            disabled={floor.disabled}
            onClick={() => handleFloorSelect(floor.id)}
            type="button"
          >
            {floor.shortLabel}
          </Button>
        ))}
      </div>
    );
  },
);
FloorSelector.displayName = "FloorSelector";

export { FloorSelector };
