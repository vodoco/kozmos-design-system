import React from "react";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { surfaceClass, type SurfaceVariant } from "../Surface";

export interface RouteSetupPanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Host has resolved and validated every required route point. Text alone is not readiness. */
  ready: boolean;
  pending?: boolean;
  title?: string;
  description?: string;
  continueLabel?: string;
  closeLabel?: string;
  onContinue: () => void;
  /** Remains available while pending; the host cancels requests and restores focus. */
  onClose: () => void;
  children: React.ReactNode;
  presentation?: "hosted" | "standalone";
  surface?: SurfaceVariant;
}

/** Setup content for an existing sheet. Hosts resolved-place fields; never calculates routes or owns dismissal. */
export const RouteSetupPanel = React.forwardRef<
  HTMLElement,
  RouteSetupPanelProps
>(
  (
    {
      ready,
      pending = false,
      title = "Set up a route",
      description,
      continueLabel = "Continue",
      closeLabel = "Close route setup",
      onContinue,
      onClose,
      children,
      presentation = "hosted",
      surface = "solid",
      className,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    return (
      <section
        ref={ref}
        aria-labelledby={titleId}
        {...props}
        data-presentation={presentation}
        className={cn(
          "flex w-full min-w-0 flex-col gap-4 text-foreground",
          presentation === "standalone"
            ? cn(surfaceClass(surface), "rounded-panel p-4 shadow-overlay")
            : "kozmos-reset",
          className,
        )}
      >
        <header className="flex min-w-0 items-start justify-between gap-3">
          <h2
            id={titleId}
            className="m-0 min-w-0 text-xl font-semibold [overflow-wrap:anywhere]"
          >
            {title}
          </h2>
          <IconButton
            type="button"
            className="shrink-0"
            variant="outline"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </IconButton>
        </header>
        {description && (
          <p className="kozmos-muted-text m-0 text-sm [overflow-wrap:anywhere]">
            {description}
          </p>
        )}
        {children}
        <Button
          type="button"
          className="h-auto min-h-11 w-full whitespace-normal"
          disabled={!ready || pending}
          aria-busy={pending || undefined}
          onClick={() => {
            if (ready && !pending) onContinue();
          }}
        >
          {continueLabel}
        </Button>
      </section>
    );
  },
);
RouteSetupPanel.displayName = "RouteSetupPanel";
