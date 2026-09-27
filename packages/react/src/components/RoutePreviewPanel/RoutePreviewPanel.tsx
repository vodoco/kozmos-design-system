import React from "react";
import type {
  RouteOptionPresentation,
  RouteReadiness,
} from "@kozmos-ds/product-contracts";
import { ArrowLeft } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import {
  EMOTION_FILLED_CLASSES,
  emotionSurfaceProperties,
} from "../../utils/emotion";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { RouteOptionCard } from "../RouteOptionCard";

export interface RoutePreviewPanelProps extends React.HTMLAttributes<HTMLElement> {
  destinationName: string;
  destinationLabel?: string;
  options: readonly RouteOptionPresentation[];
  status: RouteReadiness;
  onOptionSelect: (routeId: string) => void;
  onBack: () => void;
  onContinue: (routeId: string) => void;
  backLabel: string;
  continueLabel: string;
  optionsLabel?: string;
  optionsCountLabel?: string;
  statusContent?: React.ReactNode;
  alert?: React.ReactNode;
  selectedRouteAnnouncement?: string;
}

const RoutePreviewPanel = React.forwardRef<HTMLElement, RoutePreviewPanelProps>(
  (
    {
      className,
      destinationName,
      destinationLabel = "To",
      options,
      status,
      onOptionSelect,
      onBack,
      onContinue,
      backLabel,
      continueLabel,
      optionsLabel = "Route options",
      optionsCountLabel,
      statusContent,
      alert,
      selectedRouteAnnouncement,
      ...props
    },
    ref,
  ) => {
    const selectedOption = options.find(
      (option) => option.selected && option.available,
    );
    const ready = status === "ready";

    return (
      <section
        ref={ref}
        aria-label="Route preview"
        className={cn(
          "flex min-h-0 min-w-0 w-full flex-col bg-background text-foreground",
          className,
        )}
        data-route-status={status}
        {...props}
      >
        <header className="border-b border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {destinationLabel}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">
            {destinationName}
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <p aria-live="polite" className="sr-only">
            {selectedRouteAnnouncement}
          </p>

          {status !== "ready" && statusContent ? (
            <div
              className="rounded-container border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground"
              role={
                status === "error" || status === "no-route" ? "alert" : "status"
              }
            >
              {statusContent}
            </div>
          ) : (
            <div aria-label={optionsLabel} role="group">
              <ul className="m-0 grid snap-x snap-mandatory auto-cols-[min(78%,14rem)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain p-0 pb-3">
                {options.map((option) => (
                  <li className="list-none snap-start" key={option.id}>
                    <RouteOptionCard
                      className="h-full"
                      onSelect={onOptionSelect}
                      option={option}
                    />
                  </li>
                ))}
              </ul>
              {options.length > 1 && optionsCountLabel && (
                <p className="text-xs text-muted-foreground">
                  {optionsCountLabel}
                </p>
              )}
            </div>
          )}

          {alert && (
            <div
              className={cn(
                "mt-3 rounded-control px-3 py-2 text-sm",
                EMOTION_FILLED_CLASSES,
              )}
              style={emotionSurfaceProperties("alert")}
              role="status"
            >
              {alert}
            </div>
          )}
        </div>

        <footer className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <IconButton
            aria-label={backLabel}
            onClick={onBack}
            type="button"
            variant="outline"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </IconButton>
          <Button
            className="flex-1"
            disabled={!ready || !selectedOption}
            isLoading={status === "calculating"}
            onClick={() => selectedOption && onContinue(selectedOption.id)}
            type="button"
          >
            {continueLabel}
          </Button>
        </footer>
      </section>
    );
  },
);

RoutePreviewPanel.displayName = "RoutePreviewPanel";

export { RoutePreviewPanel };
