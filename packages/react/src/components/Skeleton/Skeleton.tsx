import React from "react";
import { cn } from "../../utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // The pulse is `.kozmos-skeleton` rather than `animate-pulse` so one
    // owned rule can rest it under the reduced-motion preference and under the
    // design config's `motion: reduced`, together with the spinner and the
    // assistant's ring (GAP-50).
    className={cn("kozmos-skeleton rounded-control bg-muted", className)}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
