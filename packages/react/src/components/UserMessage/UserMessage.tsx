import React from "react";
import { cn } from "../../utils";

export type UserMessageProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The visitor's turn. Filled and right-aligned against the assistant's
 * outlined, left-aligned bubble — Story 5 AC2 asks only that the two be
 * visually distinct, and side plus fill distinguishes them without relying on
 * colour alone.
 */
const UserMessage = React.forwardRef<HTMLDivElement, UserMessageProps>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("flex w-full justify-end", className)} ref={ref} {...props}>
      <div className="max-w-[85%] rounded-container bg-primary px-4 py-3 text-sm text-primary-foreground">
        {children}
      </div>
    </div>
  ),
);
UserMessage.displayName = "UserMessage";

export { UserMessage };
