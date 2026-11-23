import React from "react";
import { cn } from "../../utils";
import { TIMELINE_CLASSES, type TimelineDensity } from "../../recipes/timeline";

export type { TimelineDensity };

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
        TIMELINE_CLASSES.root,
        density === "compact" && TIMELINE_CLASSES.compact,
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
      className={cn(TIMELINE_CLASSES.item, className)}
      {...props}
    >
      <span
        aria-hidden="true"
        data-timeline-marker
        className={TIMELINE_CLASSES.marker}
      >
        <span data-timeline-dot className={TIMELINE_CLASSES.dot} />
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
    className={cn(TIMELINE_CLASSES.time, className)}
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
    className={cn(TIMELINE_CLASSES.title, className)}
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
    className={cn(TIMELINE_CLASSES.description, className)}
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
