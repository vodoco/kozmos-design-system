import React from "react";
import { cn } from "../../utils";
import { Box, type BoxProps } from "../Box/Box";

export interface ContainerProps extends BoxProps {
  centered?: boolean;
  /**
   * What the padding responds to.
   *
   * `window` steps 16 -> 24 -> 32 with the viewport, which is right for a
   * page. `panel` keeps 16 whatever the window is doing, which is right for
   * anything inside a fixed-width region: a 390px side panel in a 1280px
   * window was taking the widest step, so the same content had 32px of
   * padding each side on desktop and 16px on a phone.
   */
  inset?: "window" | "panel";
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, centered = true, inset = "window", ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn(
          "w-full",
          inset === "panel" ? "px-4" : "px-4 sm:px-6 lg:px-8",
          centered && "mx-auto max-w-7xl", // Centered with max width
          className,
        )}
        {...props}
      />
    );
  },
);

Container.displayName = "Container";
export { Container };
