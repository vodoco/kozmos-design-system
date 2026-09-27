import React from "react";
import { Stars01, XClose } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface AICompanionPanelProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  /** The thread and its input, in that order. */
  children?: React.ReactNode;
  /** Above the thread: the Story 14 notice, an offline EmptyState. */
  banner?: React.ReactNode;
}

/**
 * The assistant surface.
 *
 * It covers the frame and leaves the search sheet untouched beneath, as the
 * prototype sheet spec describes, so closing it returns the visitor to exactly
 * the search they left.
 *
 * `onClose` is optional on purpose. Story 18 lets a host app turn the
 * assistant off, and Story 5 AC1 says the panel must tolerate AISearchButton
 * being absent — a panel that cannot be opened from a button it does not have
 * must still be closable by whatever did open it, or by nothing at all.
 */
const AICompanionPanel = React.forwardRef<
  HTMLDivElement,
  AICompanionPanelProps
>(
  (
    {
      className,
      title = "Assistant",
      onClose,
      closeLabel = "Close assistant",
      banner,
      children,
      ...props
    },
    ref,
  ) => {
    // A surface that covers the frame has to be dismissible from the
    // keyboard, or it is a trap for anyone not using a pointer. Bound on the
    // panel rather than the document so a host that renders two of these does
    // not close both, and skipped entirely when there is nothing to close.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClose || event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };

    return (
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-col bg-background text-foreground",
          className,
        )}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...props}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-pill border border-border text-primary"
          >
            <Stars01 className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 truncate text-base font-semibold">
            {title}
          </p>
          {onClose && (
            <button
              aria-label={closeLabel}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onClose}
              type="button"
            >
              <XClose aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
        {banner && <div className="shrink-0 px-4 pt-4">{banner}</div>}
        {children}
      </div>
    );
  },
);
AICompanionPanel.displayName = "AICompanionPanel";

export { AICompanionPanel };
