import React from "react";
import { cn } from "../../utils";
import { Box, type BoxProps } from "../Box/Box";
import { containerClasses, type ContainerBlock } from "../../recipes/container";

export type {
  ContainerBlock,
  ContainerBlockInset,
} from "../../recipes/container";

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
  /**
   * The clear space above and below the content (GAP-116): `sm` 16, `md` 24,
   * `lg` 32, or `{ start, end }` for the top and the bottom apart. None by
   * default, so a Container pads its sides only, as it always has. It holds
   * whatever the window does: a page region's top and bottom space does not
   * step with the viewport as its sides do.
   */
  block?: ContainerBlock;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, centered = true, inset = "window", block, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn(containerClasses({ centered, inset, block }), className)}
        {...props}
      />
    );
  },
);

Container.displayName = "Container";
export { Container };
