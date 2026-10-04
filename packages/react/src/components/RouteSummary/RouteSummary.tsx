import React from "react";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import { Button } from "../Button";
import { DestinationImage } from "../../utils/navigation-presentation";
import { MapShellPanelContext } from "../AdaptiveMapShell/map-shell-panel";
import { X, NavigationPointer01 as Navigation } from "@kozmos-ds/icons";

interface RouteSummaryBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  distanceText?: string;
  onEndRoute: () => void;
  /** What the summary sits on: solid by default, glass where the product asks for it. */
  surface?: SurfaceVariant;
}

/** The summary as it was: the estimate over the distance, End as an icon. */
export interface RouteSummaryEstimateProps extends RouteSummaryBaseProps {
  distanceText: string;
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
  /** Localized remaining estimate; omitted when the host cannot provide one. */
  durationText?: string;
  /** Decorative destination image; failures retain a same-size map-pin fallback. */
  destinationImage?: string;
  /**
   * Hosted content has no independent surface, radius, shadow or outer
   * padding. Unset, it is hosted in the map shell's panel and standalone
   * anywhere else (decision 43).
   */
  presentation?: "standalone" | "hosted";
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
      destinationImage,
      presentation: presentationProp,
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
  ) => {
    const inShellPanel = React.useContext(MapShellPanelContext);
    const presentation =
      presentationProp ?? (inShellPanel ? "hosted" : "standalone");
    return (
      <div
        ref={ref}
        className={cn(
          presentation === "hosted"
            ? "kozmos-reset flex w-full flex-col text-foreground"
            : cn(surfaceClass(surface), LAYOUT),
          "gap-3",
          className,
        )}
        {...props}
        data-presentation={presentation}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {destinationImage && (
            <DestinationImage key={destinationImage} src={destinationImage} />
          )}
          <h2 className="m-0 min-w-0 flex-1 basis-40 break-words text-xl font-semibold leading-tight text-foreground">
            {destination}
          </h2>
          <Button
            type="button"
            variant="outline"
            emotion="danger"
            size="sm"
            className="h-auto min-h-11 max-w-full shrink-0 whitespace-normal rounded-pill [overflow-wrap:anywhere]"
            onClick={onEndRoute}
          >
            {endLabel}
          </Button>
        </div>
        {(durationText || distanceText || arrivalText) && (
          <p className="m-0 flex flex-wrap items-baseline gap-3 text-[15px] text-foreground">
            {durationText && (
              <span className="font-semibold">{durationText}</span>
            )}
            {distanceText && <span>{distanceText}</span>}
            {arrivalText ? (
              <span className="ms-auto">{arrivalText}</span>
            ) : null}
          </p>
        )}
        {progress}
      </div>
    );
  },
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
              {/* Muted, and on glass the foreground colour (decision 48). */}
              <span className="kozmos-muted-text text-sm font-medium">
                {distanceText}
              </span>
            </div>
          </div>
          {state === "active" && (
            <Button
              type="button"
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
            type="button"
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
