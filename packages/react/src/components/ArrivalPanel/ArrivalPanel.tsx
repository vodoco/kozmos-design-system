import React from "react";
import { cn } from "../../utils";
import { DestinationImage } from "../../utils/navigation-presentation";
import { Button } from "../Button";
import { surfaceClass, type SurfaceVariant } from "../Surface";

export interface ArrivalPanelProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  destination: string;
  destinationImage?: string;
  locationText?: string;
  title?: string;
  message?: string;
  /** Actual elapsed journey time supplied by the host, never a remaining estimate. */
  actualDurationText?: string;
  /** Actual travelled distance supplied by the host. Missing values are omitted. */
  actualDistanceText?: string;
  durationLabel?: string;
  distanceLabel?: string;
  doneLabel?: string;
  onDone: () => void;
  /** The host is finishing navigation; prevents further activation while pending. */
  pending?: boolean;
  /** Hosted by default: the sheet owns padding, surface, focus and dismissal. */
  presentation?: "hosted" | "standalone";
  surface?: SurfaceVariant;
}

/** Host-confirmed arrival content. Does not detect arrival, announce, dismiss or reset a route. */
export const ArrivalPanel = React.forwardRef<HTMLDivElement, ArrivalPanelProps>(
  (
    {
      destination,
      destinationImage,
      locationText,
      title = "You've arrived",
      message,
      actualDurationText,
      actualDistanceText,
      durationLabel = "Journey time",
      distanceLabel = "Distance travelled",
      doneLabel = "Done",
      onDone,
      pending = false,
      presentation = "hosted",
      surface = "solid",
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      {...props}
      data-presentation={presentation}
      className={cn(
        "kozmos-arrival-panel flex w-full min-w-0 flex-col gap-4 text-foreground",
        presentation === "standalone"
          ? cn(surfaceClass(surface), "rounded-panel p-4 shadow-overlay")
          : "kozmos-reset",
        className,
      )}
    >
      <h2 className="m-0 break-words text-xl font-semibold">{title}</h2>
      <div className="flex min-w-0 items-center gap-3">
        {destinationImage && (
          <DestinationImage key={destinationImage} src={destinationImage} />
        )}
        <div className="min-w-0 flex-1">
          <p className="m-0 break-words text-base font-semibold">
            {destination}
          </p>
          {locationText && (
            <p className="kozmos-muted-text m-0 break-words text-sm">
              {locationText}
            </p>
          )}
        </div>
      </div>
      {message && <p className="m-0 break-words text-base">{message}</p>}
      {(actualDurationText || actualDistanceText) && (
        <dl className="m-0 flex flex-wrap gap-4">
          {actualDurationText && (
            <div className="min-w-0">
              <dt className="kozmos-muted-text text-sm">{durationLabel}</dt>
              <dd className="m-0 break-words text-base font-semibold">
                {actualDurationText}
              </dd>
            </div>
          )}
          {actualDistanceText && (
            <div className="min-w-0">
              <dt className="kozmos-muted-text text-sm">{distanceLabel}</dt>
              <dd className="m-0 break-words text-base font-semibold">
                {actualDistanceText}
              </dd>
            </div>
          )}
        </dl>
      )}
      <Button
        className="w-full"
        onClick={onDone}
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {doneLabel}
      </Button>
    </div>
  ),
);
ArrivalPanel.displayName = "ArrivalPanel";
