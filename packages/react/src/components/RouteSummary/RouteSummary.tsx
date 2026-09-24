import React from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import { Button } from "../Button";
import { X, Navigation } from "lucide-react";

interface RouteSummaryBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  distanceText: string;
  onEndRoute: () => void;
  /** What the summary sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
}

/** The summary as it was: the estimate over the distance, End as an icon. */
export interface RouteSummaryEstimateProps extends RouteSummaryBaseProps {
  destination?: undefined;
  etaText: string;
  onStartNavigation?: () => void;
  transportModeIcon?: React.ReactNode;
  state?: "preview" | "active";
  endRouteLabel?: string;
  startNavigationLabel?: string;
}

/**
 * The navigation layout: the destination's name with End beside it in the
 * danger outline; the time, distance and arrival on one row; the caller's
 * progress — a `RouteProgressRail`, in the products — below.
 */
export interface RouteSummaryNavigationProps extends RouteSummaryBaseProps {
  destination: string;
  durationText: string;
  arrivalText?: string;
  endLabel?: string;
  progress?: React.ReactNode;
}

export type RouteSummaryProps =
  | RouteSummaryEstimateProps
  | RouteSummaryNavigationProps;

const LAYOUT =
  "flex w-full flex-col rounded-panel p-4 text-foreground shadow-overlay transition-all duration-300";

const RouteSummaryNavigation = React.forwardRef<
  HTMLDivElement,
  RouteSummaryNavigationProps
>(
  (
    {
      className,
      destination,
      durationText,
      distanceText,
      arrivalText,
      endLabel = "End",
      progress,
      surface = "solid",
      onEndRoute,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(surfaceClass(surface), LAYOUT, "gap-3", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 line-clamp-2 min-w-0 flex-1 text-xl font-semibold leading-tight text-foreground">
          {destination}
        </h2>
        <Button
          variant="outline"
          emotion="danger"
          size="sm"
          className="shrink-0 rounded-pill"
          onClick={onEndRoute}
        >
          {endLabel}
        </Button>
      </div>
      <p className="m-0 flex items-baseline gap-3 text-[15px] text-foreground">
        <span className="font-semibold">{durationText}</span>
        <span>{distanceText}</span>
        {arrivalText ? <span className="ml-auto">{arrivalText}</span> : null}
      </p>
      {progress}
    </div>
  ),
);
RouteSummaryNavigation.displayName = "RouteSummaryNavigation";

const RouteSummary = React.forwardRef<HTMLDivElement, RouteSummaryProps>(
  (props, ref) => {
    if (props.destination !== undefined) {
      return <RouteSummaryNavigation ref={ref} {...props} />;
    }
    const {
      className,
      etaText,
      distanceText,
      onEndRoute,
      onStartNavigation,
      transportModeIcon,
      state = "active",
      endRouteLabel = "End route",
      startNavigationLabel = "Start navigation",
      surface = "solid",
      ...rest
    } = props;
    return (
      <div
        ref={ref}
        className={cn(surfaceClass(surface), LAYOUT, "gap-4", className)}
        {...rest}
      >
        {/* Information Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {transportModeIcon && (
              <div className="w-10 h-10 rounded-pill bg-secondary text-primary flex items-center justify-center shrink-0">
                {transportModeIcon}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {etaText}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {distanceText}
              </span>
            </div>
          </div>
          {state === "active" && (
            <Button
              variant="destructive"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-pill"
              onClick={onEndRoute}
              aria-label={endRouteLabel}
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Primary Action Row - if in preview mode */}
        {state === "preview" && onStartNavigation && (
          <Button
            size="lg"
            className="w-full h-12 rounded-pill font-semibold text-base shadow-raised"
            onClick={onStartNavigation}
          >
            <Navigation aria-hidden="true" className="w-5 h-5" />
            {startNavigationLabel}
          </Button>
        )}
      </div>
    );
  },
);

RouteSummary.displayName = "RouteSummary";

export { RouteSummary };
