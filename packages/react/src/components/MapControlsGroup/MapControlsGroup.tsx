import React from "react";
import type { UserLocationState } from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";
import { MapControlButton } from "../MapControlButton";
import {
  Plus,
  Minus,
  Compass01 as Compass,
  NavigationPointer01 as Focus,
} from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface MapControlsGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCompassReset?: () => void;
  onMyLocation?: () => void;
  compassBearing?: number;
  label?: string;
  locationState?: UserLocationState;
  locationLabel?: string;
  locationStateLabel?: string;
  locationPresentation?: "icon-only" | "labelled";
}

const MapControlsGroup = React.forwardRef<
  HTMLDivElement,
  MapControlsGroupProps
>(
  (
    {
      className,
      onZoomIn,
      onZoomOut,
      onCompassReset,
      onMyLocation,
      compassBearing = 0,
      label = "Map controls",
      locationState = "off",
      locationLabel = "Focus location",
      locationStateLabel,
      locationPresentation = "icon-only",
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const handleZoomIn = () => {
      trackEvent("MapControls", "zoom_in", {});
      onZoomIn?.();
    };

    const handleZoomOut = () => {
      trackEvent("MapControls", "zoom_out", {});
      onZoomOut?.();
    };

    return (
      <div
        ref={ref}
        aria-label={label}
        className={cn(
          "relative flex flex-col gap-2 pointer-events-auto",
          className,
        )}
        role="group"
        {...props}
      >
        {/* Zoom Cluster */}
        {(onZoomIn || onZoomOut) && (
          <div className="flex w-11 flex-col overflow-hidden rounded-container bg-background shadow-floating ring-1 ring-border backdrop-blur-2xl">
            {onZoomIn && (
              <MapControlButton
                icon={<Plus className="h-5 w-5" />}
                label="Zoom in"
                variant="ghost"
                className={cn(
                  "w-full rounded-none",
                  onZoomOut && "border-b border-border",
                )}
                onClick={handleZoomIn}
              />
            )}
            {onZoomOut && (
              <MapControlButton
                icon={<Minus className="h-5 w-5" />}
                label="Zoom out"
                variant="ghost"
                className="w-full rounded-none"
                onClick={handleZoomOut}
              />
            )}
          </div>
        )}

        {/* Compass */}
        {onCompassReset && (
          <MapControlButton
            icon={
              <Compass
                className="h-5 w-5 transition-transform duration-300"
                style={{ transform: `rotate(${compassBearing}deg)` }}
              />
            }
            label="Reset bearing"
            variant="ghost"
            onClick={() => {
              trackEvent("MapControls", "compass_reset", {});
              onCompassReset();
            }}
          />
        )}

        {/* My Location */}
        {onMyLocation && (
          <MapControlButton
            icon={<Focus className="h-5 w-5" />}
            isLoading={locationState === "locating"}
            label={locationLabel}
            presentation={locationPresentation}
            pressed={
              locationState === "following" || locationState === "heading"
            }
            stateLabel={locationStateLabel}
            onClick={() => {
              trackEvent("MapControls", "my_location_triggered", {});
              onMyLocation();
            }}
          />
        )}
      </div>
    );
  },
);

MapControlsGroup.displayName = "MapControlsGroup";

export { MapControlsGroup };
