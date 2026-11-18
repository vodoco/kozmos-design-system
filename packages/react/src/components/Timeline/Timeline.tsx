import React from "react";
import { cn } from "../../utils";

export type TimelineDensity = "default" | "compact";

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  density?: TimelineDensity;
}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, density = "default", ...props }, ref) => (
    <ol
      ref={ref}
      data-density={density}
      data-timeline
      className={cn(
        // The rail is each item's own, from its marker to the next one's,
        // so it ends at the last marker (GAP-247): no border on the list,
        // which keeps the border's 1 as padding, so nothing moves.
        "relative ml-3 pl-px",
        density === "compact" &&
          "[&_[data-timeline-description]]:mb-2 [&_[data-timeline-description]]:text-sm [&_[data-timeline-item]]:mb-6 [&_[data-timeline-time]]:mb-1 [&_[data-timeline-title]]:text-base",
        className,
      )}
      {...props}
    />
  ),
);
Timeline.displayName = "Timeline";

export type TimelineItemProps = React.LiHTMLAttributes<HTMLLIElement>;

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      data-timeline-item
      // Its rail is drawn down its height and its margin to the next item
      // (owned CSS), and the last item draws none (GAP-247).
      className={cn("relative mb-10 ml-6 last:mb-0", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        data-timeline-marker
        // 36 left of the item: 12 left of the list's edge, as it was.
        className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-pill bg-secondary ring-8 ring-background"
      >
        <span data-timeline-dot className="h-2 w-2 rounded-pill bg-primary" />
      </span>
      {children}
    </li>
  ),
);
TimelineItem.displayName = "TimelineItem";

const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement>
>(({ className, ...props }, ref) => (
  <time
    ref={ref}
    data-timeline-time
    className={cn(
      "block mb-2 text-sm font-normal leading-none text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TimelineTime.displayName = "TimelineTime";

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-timeline-title
    className={cn("flex items-center mb-1 text-lg font-semibold", className)}
    {...props}
  />
));
TimelineTitle.displayName = "TimelineTitle";

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-timeline-description
    className={cn(
      "mb-4 text-base font-normal text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TimelineDescription.displayName = "TimelineDescription";

export {
  Timeline,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  TimelineDescription,
};
