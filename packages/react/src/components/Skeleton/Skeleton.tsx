import React from "react";
import { cn } from "../../utils";

/**
 * What the placeholder stands in for, which is all that decides its shape.
 *
 * `line` is a row of text; `block` a card, a media tile, a panel; `circle` an
 * avatar or a round icon button. The three match the Figma set's `Shape` axis,
 * so a loading state drawn in one place reads the same in the other.
 */
export type SkeletonShape = "line" | "block" | "circle";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  /**
   * The space to hold. A number is pixels; a string is any CSS length, so a
   * placeholder can be `"60%"` of its row.
   *
   * These exist so a loading state needs no inline style of its own — which
   * was the whole of GAP-057. A circle takes `width` as its diameter and needs
   * nothing else.
   */
  width?: number | string;
  height?: number | string;
}

const length = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

const SkeletonComponent = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = "line", width, height, style, ...props }, ref) => {
    const size = length(width);
    return (
      <div
        ref={ref}
        // The pulse is `.kozmos-skeleton` rather than `animate-pulse` so one
        // owned rule can rest it under the reduced-motion preference and under
        // the design config's `motion: reduced`, together with the spinner and
        // the assistant's ring (GAP-50).
        className={cn(
          "kozmos-skeleton bg-muted",
          shape === "circle"
            ? "shrink-0 rounded-pill"
            : "w-full rounded-control",
          // A line stands in for text, so it takes a text-sized height unless
          // it is told otherwise. A block has no such default: it is whatever
          // it replaces, and guessing would be worse than asking.
          shape === "line" && height === undefined && "h-4",
          className,
        )}
        data-shape={shape}
        style={{
          ...(shape === "circle"
            ? {
                width: size ?? "2.5rem",
                height: length(height) ?? size ?? "2.5rem",
              }
            : { width: size, height: length(height) }),
          ...style,
        }}
        {...props}
      />
    );
  },
);
SkeletonComponent.displayName = "Skeleton";

const Skeleton = SkeletonComponent;

export { Skeleton };
