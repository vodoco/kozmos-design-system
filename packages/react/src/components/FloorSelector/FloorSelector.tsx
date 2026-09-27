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
  /**
   * What the compact stepper's two buttons are called, for a visitor who
   * cannot see them. Hard-coded English until row 67, so a German or Japanese
   * device announced "Previous floor" whatever else the product had
   * translated. Only the stepper draws them; the two list variants name each
   * floor by its own label.
   */
  previousFloorLabel?: string;
  nextFloorLabel?: string;
  /**
   * How a level's result count is said, for a visitor who cannot see the
   * marker. Joined to the floor's own label: "Level 2, 3 results".
   *
   * A function because a count needs a plural rule, and the design system has
   * no locale to pick one with — the product does.
   */
  resultCountLabel?: (count: number) => string;
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
      previousFloorLabel = "Previous floor",
      nextFloorLabel = "Next floor",
      resultCountLabel = (count) => `${count} results`,
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
              aria-label={previousFloorLabel}
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
              aria-label={nextFloorLabel}
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
            aria-label={
              floor.resultCount
                ? `${floor.label}, ${resultCountLabel(floor.resultCount)}`
                : floor.label
            }
            aria-pressed={selectedFloor === floor.id}
            className={cn(
              "relative h-11 w-11 p-0 font-medium",
              variant === "horizontal-list" && "w-auto min-w-11 px-3",
              selectedFloor === floor.id && "shadow-raised",
            )}
            disabled={floor.disabled}
            onClick={() => handleFloorSelect(floor.id)}
            type="button"
          >
            {floor.shortLabel}
            {/* The count, drawn once and said once: the marker is hidden from
                assistive technology because the button's own label already
                carries it, and hearing "3" after "Level 2, 3 results" is
                noise. Logical inset so it mirrors in Arabic. Only where the
                product gave a count above zero — absent is unknown, which is
                not the same as none. */}
            {floor.resultCount ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 end-[-2px] min-w-4 rounded-pill bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
              >
                {floor.resultCount}
              </span>
            ) : null}
          </Button>
        ))}
      </div>
    );
  },
);
FloorSelector.displayName = "FloorSelector";

export { FloorSelector };
