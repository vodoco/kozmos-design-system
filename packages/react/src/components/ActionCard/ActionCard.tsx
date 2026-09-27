import React from "react";
import { cn } from "../../utils";

export interface ActionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** An optional heading above the content, e.g. "2 results". */
  title?: React.ReactNode;
}

/**
 * Rich content inside an assistant turn: a POIResultList, a POIResultCard, a
 * hand-off. It holds them and nothing more — Story 5 AC3 requires that results
 * here open the same details and start the same wayfinding as Agentic Search,
 * which only stays true if this does not reimplement a result.
 */
const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ className, title, children, ...props }, ref) => (
    <div className={cn("flex w-full flex-col gap-2", className)} ref={ref} {...props}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      )}
      {children}
    </div>
  ),
);
ActionCard.displayName = "ActionCard";

export { ActionCard };
