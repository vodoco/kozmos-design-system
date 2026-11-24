import React from "react";
import { cn } from "../../utils";
import { skeleton } from "../../recipes/skeleton";

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

const SkeletonComponent = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = "line", width, height, style, ...props }, ref) => {
    // The pulse, the grey and each shape's box: recipes/skeleton.ts.
    const [shapeClassName, box] = skeleton(shape, width, height);
    return (
      <div
        ref={ref}
        className={cn(shapeClassName, className)}
        data-shape={shape}
        style={{ ...box, ...style }}
        {...props}
      />
    );
  },
);
SkeletonComponent.displayName = "Skeleton";

const Skeleton = SkeletonComponent;

export { Skeleton };
