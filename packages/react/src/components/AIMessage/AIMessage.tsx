import React from "react";
import { cn } from "../../utils";

/**
 * How far along an assistant turn is.
 *
 * `streaming` exists because MAP-474 Story 10 asks for a first visible response
 * within 2.5s and counts a streamed acknowledgement as one: the turn must be
 * able to say "Looking through this building…" before it has an answer.
 * `timedOut` is the ten-second hard stop from the same story — a thread that
 * simply stops is indistinguishable from one still thinking.
 */
export type AIMessageStatus = "complete" | "streaming" | "timedOut";

export interface AIMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: AIMessageStatus;
  children?: React.ReactNode;
  /**
   * Rich content under the bubble — an ActionCard holding results. A slot
   * rather than a prop, so the assistant surface never needs to know what a
   * result list is.
   */
  actionCard?: React.ReactNode;
  /** Beside the bubble: a read-aloud control, for example. */
  trailing?: React.ReactNode;
  /** Announced while streaming, in place of the dots. */
  streamingLabel?: string;
  timedOutLabel?: string;
}

const AIMessage = React.forwardRef<HTMLDivElement, AIMessageProps>(
  (
    {
      className,
      status = "complete",
      children,
      actionCard,
      trailing,
      streamingLabel = "Assistant is replying",
      timedOutLabel = "The assistant did not reply in time.",
      ...props
    },
    ref,
  ) => (
    <div
      className={cn("flex w-full flex-col gap-2", className)}
      data-status={status}
      ref={ref}
      {...props}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "max-w-[85%] rounded-container border border-border bg-card px-4 py-3 text-sm text-foreground",
            status === "timedOut" && "text-muted-foreground",
          )}
        >
          {/* The dots sit BESIDE the text, not instead of it: the prototype
              streams "••• Looking through this building…", where the
              acknowledgement is the thing that arrives within 2.5s. */}
          {status === "streaming" && (
            <span className="mr-2 inline-flex items-center gap-1 align-middle">
              <span className="sr-only">{streamingLabel}</span>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-pill bg-primary"
              />
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-pill bg-primary [animation-delay:150ms]"
              />
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-pill bg-primary [animation-delay:300ms]"
              />
            </span>
          )}
          {children ?? (status === "timedOut" ? timedOutLabel : null)}
        </div>
        {trailing}
      </div>
      {actionCard}
    </div>
  ),
);
AIMessage.displayName = "AIMessage";

export { AIMessage };
