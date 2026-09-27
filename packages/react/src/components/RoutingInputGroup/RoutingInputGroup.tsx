import React from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import { Input } from "../Input";
import { Button } from "../Button";
import {
  ArrowDown as ArrowDownUp,
  Plus,
  X,
  Circle,
  MarkerPin01 as MapPin,
} from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface RoutePoint {
  id: string;
  value: string;
  placeholder?: string;
}

export interface RoutingInputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the card sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
  points: RoutePoint[];
  onPointChange: (id: string, value: string) => void;
  onSwap?: () => void;
  onAddPoint?: () => void;
  onRemovePoint?: (id: string) => void;
}

const RoutingInputGroup = React.forwardRef<
  HTMLDivElement,
  RoutingInputGroupProps
>(
  (
    {
      className,
      surface = "solid",
      points,
      onPointChange,
      onSwap,
      onAddPoint,
      onRemovePoint,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const handleSwap = () => {
      trackEvent("RoutingInputGroup", "points_swapped", {});
      onSwap?.();
    };

    const handleAdd = () => {
      trackEvent("RoutingInputGroup", "point_added", {});
      onAddPoint?.();
    };

    const handleRemove = (id: string) => {
      trackEvent("RoutingInputGroup", "point_removed", { pointId: id });
      onRemovePoint?.(id);
    };

    return (
      <div
        ref={ref}
        className={cn(
          `flex items-start gap-3 w-full ${surfaceClass(surface)} p-4 rounded-panel shadow-overlay transition-all duration-300`,
          className,
        )}
        {...props}
      >
        {/* Timeline UI */}
        <div className="flex flex-col items-center justify-start mt-3 gap-2 shrink-0">
          {points.map((point, index) => {
            const isFirst = index === 0;
            const isLast = index === points.length - 1;

            return (
              <React.Fragment key={`timeline-${point.id}`}>
                {isLast ? (
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Circle
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 border-2 rounded-pill",
                      isFirst
                        ? "text-primary border-primary bg-primary/20"
                        : "text-muted-foreground border-current",
                    )}
                  />
                )}

                {!isLast && (
                  <div className="w-[2px] h-9 bg-border rounded-pill" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Inputs List */}
        <div className="flex flex-col gap-3 grow">
          {points.map((point, index) => (
            <div key={point.id} className="flex items-center gap-2">
              {/* A field keeps the control radius and the standard focus ring,
                  as every other field does. Until 2026-09-22 this one was
                  rounded-panel (24) and drew no ring (ring-0): the only field
                  in the system with no visible focus. */}
              <Input
                value={point.value}
                onChange={(e) => onPointChange(point.id, e.target.value)}
                placeholder={
                  point.placeholder ||
                  (index === 0 ? "Choose Starting Point" : "Choose Destination")
                }
                className="h-10 text-sm bg-black/5 dark:bg-white/10 border-transparent focus-visible:bg-black/10 dark:focus-visible:bg-white/20 transition-all duration-300"
              />
              {points.length > 2 &&
                index > 0 &&
                index < points.length - 1 &&
                onRemovePoint && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 shrink-0 text-muted-foreground hover:text-destructive-text"
                    onClick={() => handleRemove(point.id)}
                    aria-label={`Remove ${point.placeholder || point.value || "route point"}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
            </div>
          ))}
        </div>

        {/* Vertical Actions (Swap/Add) */}
        <div className="flex flex-col gap-2 shrink-0 justify-center">
          {points.length === 2 && onSwap && (
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 mt-6 shrink-0 bg-secondary hover:bg-secondary/80 text-foreground"
              onClick={handleSwap}
              aria-label="Swap route points"
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          )}
          {onAddPoint && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-10 h-10 shrink-0 text-muted-foreground",
                points.length === 2 ? "mt-5" : "mt-0",
              )}
              onClick={handleAdd}
              aria-label="Add route point"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
);

RoutingInputGroup.displayName = "RoutingInputGroup";

export { RoutingInputGroup };
