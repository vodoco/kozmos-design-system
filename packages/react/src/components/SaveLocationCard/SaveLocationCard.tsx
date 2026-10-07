import React from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import { Button } from "../Button";
import {
  Car01 as Car,
  NavigationPointer01 as Navigation,
  MarkerPin01 as MapPin,
  Edit03 as Edit3,
} from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import { WithoutGenericClick } from "../../utils/generic-click";

export interface SaveLocationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the card sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
  title?: string;
  description?: string;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onRouteToLocation?: () => void;
  onEditNote?: () => void;
}

const SaveLocationCard = React.forwardRef<
  HTMLDivElement,
  SaveLocationCardProps
>(
  (
    {
      className,
      surface = "solid",
      title = "Mark My Car",
      description = "Remember where you parked",
      isSaved = false,
      onSaveToggle,
      onRouteToLocation,
      onEditNote,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    return (
      <div
        ref={ref}
        className={cn(
          `${surfaceClass(surface)} shadow-overlay rounded-panel p-5 flex flex-col gap-4 transition-all duration-300`,
          className,
        )}
        {...props}
      >
        {/* Header Information */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-pill flex items-center justify-center shrink-0 shadow-raised ring-1 ring-black/5 dark:ring-white/10",
              // Saved, the disc is a prominent fill: the theme fill and the
              // theme foreground, the same in both themes (decision 59).
              isSaved
                ? "bg-theme-fill text-theme-fill-foreground"
                : "bg-white dark:bg-black/50 text-foreground",
            )}
          >
            <Car className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex flex-col flex-1">
            <span className="font-semibold text-base text-foreground tracking-tight">
              {title}
            </span>
            {/* Muted, and on glass the foreground colour (decision 48). */}
            <span className="kozmos-muted-text text-sm">{description}</span>
          </div>
          {isSaved && onEditNote && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditNote}
              type="button"
              className="shrink-0 text-muted-foreground"
              aria-label="Edit location note"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full mt-2">
          <WithoutGenericClick>
            <Button
              type="button"
              variant={isSaved ? "outline" : "default"}
              className="flex-1 font-medium"
              onClick={() => {
                trackEvent("SaveLocationCard", "save_toggled", {
                  isSaved: !isSaved,
                });
                onSaveToggle?.();
              }}
            >
              <MapPin className="w-4 h-4" />
              {isSaved ? "Remove Location" : "Save Location"}
            </Button>
          </WithoutGenericClick>

          {isSaved && onRouteToLocation && (
            <WithoutGenericClick>
              <Button
                type="button"
                variant="default"
                emotion="success"
                className="flex-1 font-medium"
                onClick={() => {
                  trackEvent("SaveLocationCard", "route_requested", {});
                  onRouteToLocation();
                }}
              >
                <Navigation className="w-4 h-4" />
                Guide Me
              </Button>
            </WithoutGenericClick>
          )}
        </div>
      </div>
    );
  },
);

SaveLocationCard.displayName = "SaveLocationCard";

export { SaveLocationCard };
