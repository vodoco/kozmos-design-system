import * as React from "react";
import { cn } from "../../utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
  hideScrollbar?: boolean;
  snap?: "none" | "x" | "y" | "both";
  /** Attributes for the scrollable, keyboard-focusable viewport. The ref remains on the outer wrapper. */
  viewportProps?: React.HTMLAttributes<HTMLDivElement>;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      children,
      orientation = "vertical",
      hideScrollbar = true,
      snap = "none",
      viewportProps,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden",
          // A vertical scroller needs a bounded height or it has nothing to
          // scroll. A horizontal one does not, and assuming `h-full` for both
          // meant that inside an auto-height column — a `Stack`, say — the
          // height resolved to 0 and the content vanished. Found while
          // rebuilding the SDK's POI detail card, whose action row scrolls
          // sideways and disappeared entirely.
          orientation !== "horizontal" && "h-full",
          className,
        )}
        {...props}
      >
        <div
          tabIndex={0}
          {...viewportProps}
          className={cn(
            "w-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            orientation !== "horizontal" && "h-full",
            orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
            orientation === "horizontal" &&
              "overflow-x-auto overflow-y-hidden text-nowrap",
            orientation === "both" && "overflow-auto",
            // The standard property, and the WebKit pseudo-element for the
            // floor's Chromium before 121 and Safari before 18.2. (IE's
            // -ms-overflow-style is gone: no browser that runs @scope read it.)
            hideScrollbar &&
              "[&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
            snap === "x" && "snap-x snap-mandatory",
            snap === "y" && "snap-y snap-mandatory",
            snap === "both" && "snap-both snap-mandatory",
            viewportProps?.className,
          )}
          style={{ WebkitOverflowScrolling: "touch", ...viewportProps?.style }}
        >
          {children}
        </div>
      </div>
    );
  },
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
