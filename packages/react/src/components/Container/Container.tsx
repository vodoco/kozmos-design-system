import React from "react";
import { cn } from "../../utils";
import { Box, type BoxProps } from "../Box/Box";

/**
 * A step of Container's block (top and bottom) inset: `none` 0, `sm` 16,
 * `md` 24 and `lg` 32, the layout spacing steps 200, 300 and 400.
 */
export type ContainerBlockInset = "none" | "sm" | "md" | "lg";

/** Both edges one step, or the top (`start`) and bottom (`end`) apart. */
export type ContainerBlock =
  | ContainerBlockInset
  | { start?: ContainerBlockInset; end?: ContainerBlockInset };

const BLOCK_START: Record<ContainerBlockInset, string | false> = {
  none: false,
  sm: "pt-4",
  md: "pt-6",
  lg: "pt-8",
};
const BLOCK_END: Record<ContainerBlockInset, string | false> = {
  none: false,
  sm: "pb-4",
  md: "pb-6",
  lg: "pb-8",
};

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

function blockEdges(block: ContainerBlock | undefined) {
  if (block === undefined) return { start: "none", end: "none" } as const;
  if (typeof block === "string") return { start: block, end: block };
  return { start: block.start ?? "none", end: block.end ?? "none" };
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, centered = true, inset = "window", block, ...props }, ref) => {
    const edges = blockEdges(block);
    return (
      <Box
        ref={ref}
        className={cn(
          "w-full",
          inset === "panel" ? "px-4" : "px-4 sm:px-6 lg:px-8",
          BLOCK_START[edges.start],
          BLOCK_END[edges.end],
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
